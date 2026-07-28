import { expect, test as base } from '@playwright/test';
import type { BrowserContext, Page, Request, Route } from '@playwright/test';
import {
  ADMIN_PASSWORD,
  ADMIN_USER,
  createInterfaces,
  createQuotaConfigs,
} from './testData';
import type { TestInterface, TestQuotaConfig, TestUser } from './testData';

/** 会触发文档重新维护的接口受控配置字段。 */
const CONTROLLED_CONFIG_FIELDS = [
  'name',
  'description',
  'method',
  'path',
  'targetHost',
  'url',
  'quotaType',
  'sdkMethodName',
  'requestParams',
] as const satisfies readonly (keyof TestInterface)[];

/** HTTP Mock 记录的公开请求。 */
export interface RecordedRequest {
  /** HTTP 方法。 */
  method: string;
  /** 请求路径。 */
  path: string;
  /** 查询参数。 */
  query: Record<string, string>;
  /** 请求头。 */
  headers: Record<string, string>;
  /** JSON 请求体。 */
  body: unknown;
}

/** API Mock 的独立状态。 */
interface ApiMockState {
  /** 当前登录用户。 */
  currentUser: TestUser | null;
  /** 接口列表。 */
  interfaces: TestInterface[];
  /** 配额列表。 */
  quotaConfigs: TestQuotaConfig[];
  /** 下一个接口 ID。 */
  nextInterfaceId: number;
}

/** 统一成功响应。 */
const success = (data: unknown) => ({ code: 0, data, message: 'ok' });

/** 浏览器外部 HTTP Mock 控制器。 */
export class ApiMockController {
  /** 每个测试独享的 Mock 状态。 */
  private readonly state: ApiMockState = {
    currentUser: null,
    interfaces: createInterfaces(),
    quotaConfigs: createQuotaConfigs(),
    nextInterfaceId: 103,
  };

  /** 已记录的公开请求。 */
  private readonly recordedRequests: RecordedRequest[] = [];

  /** 未登记的 API 请求。 */
  private readonly unhandledRequests: string[] = [];

  /**
   * 创建 API Mock 控制器。
   * @param page Playwright 页面
   * @param context Playwright 浏览器上下文
   */
  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
  ) {}

  /** 安装同源 API 路由拦截。 */
  async install(): Promise<void> {
    await this.page.route('**/api/**', async (route) => {
      await this.handleRoute(route);
    });
  }

  /**
   * 设置预登录用户和虚构会话 Cookie。
   * @param user 登录用户
   */
  async authenticateAs(user: TestUser): Promise<void> {
    this.state.currentUser = { ...user };
    await this.context.addCookies([
      {
        name: 'FEIAPI_SESSION',
        value: `e2e-session-${user.id}`,
        url: 'http://127.0.0.1:4173',
        sameSite: 'Lax',
      },
      {
        name: 'XSRF-TOKEN',
        value: 'e2e-csrf-token',
        url: 'http://127.0.0.1:4173',
        sameSite: 'Lax',
      },
    ]);
  }

  /**
   * 查询匹配的请求记录。
   * @param method HTTP 方法
   * @param path API 路径
   * @returns 请求记录
   */
  requestsFor(method: string, path: string): RecordedRequest[] {
    return this.recordedRequests.filter((request) => (
      request.method === method.toUpperCase() && request.path === path
    ));
  }

  /** 断言不存在未登记 API 请求。 */
  assertNoUnhandledRequests(): void {
    expect(this.unhandledRequests, '存在未登记的 /api/** 请求').toEqual([]);
  }

  /**
   * 解析并记录公开请求。
   * @param request Playwright 请求
   * @returns 请求记录
   */
  private recordRequest(request: Request): RecordedRequest {
    const url = new URL(request.url());
    let body: unknown;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    const recordedRequest: RecordedRequest = {
      method: request.method().toUpperCase(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: request.headers(),
      body,
    };
    this.recordedRequests.push(recordedRequest);
    return recordedRequest;
  }

  /**
   * 返回 JSON 业务响应。
   * @param route Playwright 路由
   * @param data 响应数据
   * @param status HTTP 状态码
   * @param headers 附加响应头
   */
  private async fulfillJson(
    route: Route,
    data: unknown,
    status = 200,
    headers: Record<string, string> = {},
  ): Promise<void> {
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * 校验非安全请求携带 CSRF Header。
   * @param route Playwright 路由
   * @param request 请求记录
   * @returns 是否通过校验
   */
  private async requireCsrf(route: Route, request: RecordedRequest): Promise<boolean> {
    if (request.headers['x-xsrf-token']) return true;
    await this.fulfillJson(
      route,
      { code: 40300, data: null, message: '安全校验失败' },
      403,
    );
    return false;
  }

  /**
   * 处理同源 API 请求。
   * @param route Playwright 路由
   */
  private async handleRoute(route: Route): Promise<void> {
    const request = this.recordRequest(route.request());
    const key = `${request.method} ${request.path}`;

    if (key === 'GET /api/csrf') {
      await this.fulfillJson(route, success(true), 200, {
        'set-cookie': 'XSRF-TOKEN=e2e-csrf-token; Path=/; SameSite=Lax',
      });
      return;
    }

    if (key === 'GET /api/user/get/login') {
      await this.fulfillJson(route, success(this.state.currentUser));
      return;
    }

    if (key === 'POST /api/user/login') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as { userAccount?: string; userPassword?: string };
      if (body.userAccount !== ADMIN_USER.userAccount || body.userPassword !== ADMIN_PASSWORD) {
        await this.fulfillJson(route, { code: 40000, data: null, message: '账号或密码不正确' });
        return;
      }
      this.state.currentUser = { ...ADMIN_USER };
      await this.fulfillJson(route, success(this.state.currentUser));
      return;
    }

    if (key === 'GET /api/interfaceQuotaConfig/list') {
      await this.fulfillJson(route, success(this.state.quotaConfigs.map((item) => ({ ...item }))));
      return;
    }

    if (key === 'POST /api/interfaceQuotaConfig/update') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as { quotaType?: string; initialQuota?: number };
      const target = this.state.quotaConfigs.find((item) => item.quotaType === body.quotaType);
      if (!target || !target.limited || !Number.isInteger(body.initialQuota) || Number(body.initialQuota) <= 0) {
        await this.fulfillJson(route, { code: 40000, data: null, message: '配额参数错误' });
        return;
      }
      target.initialQuota = Number(body.initialQuota);
      target.updateTime = '2026-07-25T09:00:00';
      await this.fulfillJson(route, success(true));
      return;
    }

    if (key === 'GET /api/interfaceInfo/list/page') {
      await this.fulfillJson(route, success({
        records: this.state.interfaces.map((item) => ({ ...item })),
        total: this.state.interfaces.length,
        current: Number(request.query.current ?? 1),
        pageSize: Number(request.query.pageSize ?? 10),
      }));
      return;
    }

    if (key === 'POST /api/interfaceInfo/add') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as Omit<TestInterface, 'id' | 'status' | 'totalNum' | 'initialQuota' | 'docStatus' | 'updateTime'>;
      const id = this.state.nextInterfaceId++;
      this.state.interfaces.push({
        ...body,
        id,
        status: 0,
        totalNum: 0,
        docStatus: 'DRAFT',
        initialQuota: body.quotaType === 'ADVANCED_TRIAL' ? 20 : 100,
        url: body.url ?? body.path,
        updateTime: '2026-07-25T09:00:00',
      });
      await this.fulfillJson(route, success(id));
      return;
    }

    if (key === 'POST /api/interfaceInfo/update') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as Partial<TestInterface> & { id?: number };
      const target = this.state.interfaces.find((item) => item.id === body.id);
      if (!target) {
        await this.fulfillJson(route, { code: 40400, data: null, message: '接口不存在' });
        return;
      }
      const controlledConfigChanged = CONTROLLED_CONFIG_FIELDS.some((field) => (
        body[field] !== undefined && body[field] !== target[field]
      ));
      CONTROLLED_CONFIG_FIELDS.forEach((field) => {
        if (body[field] !== undefined) {
          target[field] = body[field] as never;
        }
      });
      if (controlledConfigChanged) {
        target.docStatus = 'DRAFT';
      }
      target.updateTime = '2026-07-28T10:00:00';
      await this.fulfillJson(route, success(true));
      return;
    }

    if (key === 'POST /api/interfaceInfo/online' || key === 'POST /api/interfaceInfo/offline') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as { id?: number };
      const target = this.state.interfaces.find((item) => item.id === body.id);
      if (!target) {
        await this.fulfillJson(route, { code: 40400, data: null, message: '接口不存在' });
        return;
      }
      if (key.endsWith('/online') && target.docStatus !== 'READY') {
        await this.fulfillJson(route, { code: 50001, data: null, message: '接口文档待完善，请先完成文档维护' });
        return;
      }
      target.status = key.endsWith('/online') ? 1 : 0;
      await this.fulfillJson(route, success(true));
      return;
    }

    if (key === 'POST /api/interfaceInfo/delete') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as { id?: number };
      this.state.interfaces = this.state.interfaces.filter((item) => item.id !== body.id);
      await this.fulfillJson(route, success(true));
      return;
    }

    if (key === 'GET /api/interfaceDoc/get') {
      const interfaceInfoId = Number(request.query.interfaceInfoId);
      const interfaceInfo = this.state.interfaces.find((item) => item.id === interfaceInfoId);
      await this.fulfillJson(route, success({
        docStatus: interfaceInfo?.docStatus ?? 'DRAFT',
        interfaceInfo,
        doc: null,
        requestParams: [],
        responseParams: [],
        errorCodes: [],
      }));
      return;
    }

    if (key === 'POST /api/interfaceDoc/save') {
      if (!await this.requireCsrf(route, request)) return;
      const body = request.body as { interfaceInfoId?: number; docStatus?: 'DRAFT' | 'READY' };
      const interfaceInfo = this.state.interfaces.find((item) => item.id === body.interfaceInfoId);
      if (!interfaceInfo || !body.docStatus) {
        await this.fulfillJson(route, { code: 40000, data: null, message: '文档保存参数错误' });
        return;
      }
      interfaceInfo.docStatus = body.docStatus;
      await this.fulfillJson(route, success(true));
      return;
    }

    if (key === 'GET /api/analysis/home/stats') {
      await this.fulfillJson(route, success({
        platformInterfaceCount: this.state.interfaces.length,
        totalInvocations: 49,
        successRate: 99.5,
        averageResponseTimeMs: 86,
      }));
      return;
    }

    if (key === 'GET /api/analysis/dashboard/overview') {
      await this.fulfillJson(route, success({
        totalUsers: 2,
        totalInterfaces: this.state.interfaces.length,
        onlineInterfaces: this.state.interfaces.filter((item) => item.status === 1).length,
        offlineInterfaces: this.state.interfaces.filter((item) => item.status === 0).length,
        todayInvocations: 12,
        todaySuccessRate: 100,
      }));
      return;
    }

    if (key === 'GET /api/analysis/dashboard/trends') {
      await this.fulfillJson(route, success({
        successRate: [],
        invocationCount: [],
        errorRate: [],
        responseTime: [],
      }));
      return;
    }

    if (key === 'GET /api/analysis/dashboard/alerts' || key === 'GET /api/analysis/dashboard/changes') {
      await this.fulfillJson(route, success([]));
      return;
    }

    this.unhandledRequests.push(key);
    await this.fulfillJson(
      route,
      { code: 50100, data: null, message: `E2E 未登记请求: ${key}` },
      501,
    );
  }
}

/** FeiAPI E2E 公共 Fixture。 */
export const test = base.extend<{ apiMock: ApiMockController }>({
  apiMock: [async ({ page, context }, use) => {
    const apiMock = new ApiMockController(page, context);
    await apiMock.install();
    await use(apiMock);
    apiMock.assertNoUnhandledRequests();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
