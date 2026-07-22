import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  csrfGet: vi.fn(),
  requestUse: vi.fn(),
  responseUse: vi.fn(),
}));

vi.mock('axios', () => {
  const csrfClient = {
    get: mocks.csrfGet,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  const businessClient = {
    interceptors: {
      request: {
        use: mocks.requestUse,
      },
      response: {
        use: mocks.responseUse,
      },
    },
  };
  mocks.create
    .mockReturnValueOnce(csrfClient)
    .mockReturnValueOnce(businessClient);

  return {
    default: {
      create: mocks.create,
    },
  };
});

import '../http';

type RequestInterceptor = (config: { method?: string }) => Promise<unknown>;
type ResponseSuccessInterceptor = (response: unknown) => unknown;
type ResponseErrorInterceptor = (error: unknown) => Promise<never>;

const requestInterceptor = mocks.requestUse.mock.calls[0]?.[0] as RequestInterceptor;
const successInterceptor = mocks.responseUse.mock.calls[0]?.[0] as ResponseSuccessInterceptor;
const errorInterceptor = mocks.responseUse.mock.calls[0]?.[1] as ResponseErrorInterceptor;

/**
 * 清除当前测试页面下的全部 Cookie，避免用例之间共享 CSRF 状态。
 */
function clearCookies(): void {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    }
  });
}

beforeEach(() => {
  clearCookies();
  mocks.csrfGet.mockReset();
});

describe('http 服务同源与 CSRF 契约', () => {
  /** 验证两个客户端均固定使用同源 API 基址，且初始化客户端不配置 XSRF Header。 */
  it('业务和初始化客户端使用固定同源配置', () => {
    expect(mocks.create).toHaveBeenNthCalledWith(1, {
      baseURL: '/api',
      timeout: 15000,
      withCredentials: true,
    });
    expect(mocks.create).toHaveBeenNthCalledWith(2, {
      baseURL: '/api',
      timeout: 15000,
      withCredentials: true,
      withXSRFToken: true,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
    });
  });

  /** 验证读取请求不会产生不必要的 CSRF 初始化流量。 */
  it('GET 请求不触发 CSRF 初始化', async () => {
    const config = { method: 'get' };

    await expect(requestInterceptor(config)).resolves.toBe(config);

    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });

  /** 验证首次写请求会等待 CSRF Cookie 初始化完成后再继续。 */
  it('首个写请求先初始化 CSRF Cookie', async () => {
    mocks.csrfGet.mockResolvedValueOnce({ status: 200 });
    const continueRequest = vi.fn();
    const config = { method: 'post' };

    await requestInterceptor(config).then(continueRequest);

    expect(mocks.csrfGet).toHaveBeenCalledWith('/csrf');
    expect(mocks.csrfGet.mock.invocationCallOrder[0])
      .toBeLessThan(continueRequest.mock.invocationCallOrder[0] as number);
    expect(continueRequest).toHaveBeenCalledWith(config);
  });

  /** 验证并发写请求共享同一个初始化 Promise。 */
  it('并发写请求只初始化一次 CSRF Cookie', async () => {
    let resolveInitialization: ((value: unknown) => void) | undefined;
    const initialization = new Promise((resolve) => {
      resolveInitialization = resolve;
    });
    mocks.csrfGet.mockReturnValueOnce(initialization);

    const requests = [
      requestInterceptor({ method: 'post' }),
      requestInterceptor({ method: 'put' }),
      requestInterceptor({ method: 'delete' }),
    ];

    expect(mocks.csrfGet).toHaveBeenCalledTimes(1);
    resolveInitialization?.({ status: 200 });
    await expect(Promise.all(requests)).resolves.toHaveLength(3);
  });

  /** 验证浏览器已有非空令牌时直接发送写请求。 */
  it('已有非空 CSRF Cookie 时不重复初始化', async () => {
    document.cookie = 'XSRF-TOKEN=existing-token; Path=/';

    await requestInterceptor({ method: 'patch' });

    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });

  /** 验证空令牌不能绕过初始化门禁。 */
  it('空 CSRF Cookie 被视为未初始化', async () => {
    document.cookie = 'XSRF-TOKEN=; Path=/';
    mocks.csrfGet.mockResolvedValueOnce({ status: 200 });

    await requestInterceptor({ method: 'post' });

    expect(mocks.csrfGet).toHaveBeenCalledWith('/csrf');
  });

  /** 验证初始化失败会阻止写请求继续执行，并允许后续操作重新初始化。 */
  it('初始化失败时拒绝原写请求且允许后续重试初始化', async () => {
    mocks.csrfGet.mockRejectedValueOnce(new Error('初始化服务不可用'));
    const continueRequest = vi.fn();

    await expect(requestInterceptor({ method: 'post' }).then(continueRequest))
      .rejects.toMatchObject({
        code: 40300,
        message: '安全校验失败，请刷新页面后重试',
      });
    expect(continueRequest).not.toHaveBeenCalled();

    mocks.csrfGet.mockResolvedValueOnce({ status: 200 });
    await requestInterceptor({ method: 'post' });
    expect(mocks.csrfGet).toHaveBeenCalledTimes(2);
  });

  /** 验证后端 CSRF 拒绝转换为固定提示，且不会自动初始化或重放。 */
  it('CSRF 403 转换为固定提示且不自动重试', async () => {
    const csrfError = {
      response: {
        status: 403,
        data: { code: 40300, message: '后端原始提示' },
      },
    };

    await expect(errorInterceptor(csrfError)).rejects.toMatchObject({
      code: 40300,
      message: '安全校验失败，请刷新页面后重试',
    });
    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });

  /** 验证普通 HTTP 403 不会被错误识别为 CSRF 拒绝。 */
  it('普通业务 403 保持原错误对象', async () => {
    const businessError = {
      response: {
        status: 403,
        data: { code: 40301, message: '权限不足' },
      },
    };

    await expect(errorInterceptor(businessError)).rejects.toBe(businessError);
  });
});

describe('http 服务返回契约', () => {
  /** 验证成功响应在 HTTP 边界直接解包为领域数据。 */
  it('成功响应返回 data 字段', () => {
    expect(successInterceptor({ data: { code: 0, message: 'ok', data: { id: 1 } } })).toEqual({ id: 1 });
  });

  /** 验证业务错误码转换为带 code 的异常。 */
  it('业务错误码拒绝并保留错误码', async () => {
    const error = await (successInterceptor({
      data: { code: 1001, message: '未登录', data: null },
    }) as Promise<never>).catch((reason: Error & { code?: number }) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(1001);
    expect(error.message).toBe('未登录');
  });

  /** 验证网络层错误不被 HTTP 封装吞掉。 */
  it('网络错误原样透传', async () => {
    const networkError = new Error('网络不可用');
    await expect(errorInterceptor(networkError)).rejects.toBe(networkError);
  });
});
