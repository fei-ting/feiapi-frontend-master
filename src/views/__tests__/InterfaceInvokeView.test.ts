import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceInvokeView from '../InterfaceInvokeView.vue';
import type { InterfaceDocDetailVO } from '@/types/api';

const mocks = vi.hoisted(() => ({
  getDocDetail: vi.fn(),
  invoke: vi.fn(),
  getLoginUser: vi.fn(),
  logout: vi.fn(),
  clearLoginUser: vi.fn(),
  routerPush: vi.fn(),
  loginUser: null as { id: number; userRole: string } | null,
  routerReplace: vi.fn(),
  routeParams: { id: '1' },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: mocks.routeParams, fullPath: '/interface/1/invoke' }),
  useRouter: () => ({ push: mocks.routerPush, replace: mocks.routerReplace }),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    getDocDetail: mocks.getDocDetail,
    invoke: mocks.invoke,
  },
}));

vi.mock('@/services/user', () => ({
  userService: {
    getLoginUser: mocks.getLoginUser,
    logout: mocks.logout,
  },
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    loginUser: mocks.loginUser,
    clearLoginUser: mocks.clearLoginUser,
  }),
}));

/**
 * 构建在线调用页测试文档。
 */
const buildDocDetail = (): InterfaceDocDetailVO => ({
  interfaceInfo: {
    id: 1,
    name: '类型测试接口',
    description: '类型化参数生成',
    method: 'POST',
    status: 1,
    quotaType: 'BASIC_QUOTA',
    quotaTypeText: '基础额度接口',
  },
  doc: {
    docVersion: 'v1',
    requestContentType: 'application/json',
    responseContentType: 'application/json',
    successExample: '{"ok":true}',
  },
  gatewayUrl: 'http://localhost:8090/api/type',
  structuredDocMissing: false,
  requestHeaders: [],
  requestParams: [
    { id: 1, name: 'name', paramScene: 'BODY', type: 'string', required: true, exampleValue: 'alice' },
    { id: 2, name: 'age', paramScene: 'BODY', type: 'number', required: true, exampleValue: '18' },
    { id: 3, name: 'enabled', paramScene: 'BODY', type: 'boolean', required: true, exampleValue: 'true' },
    { id: 4, name: 'meta', paramScene: 'BODY', type: 'object', required: true, exampleValue: '{"level":2}' },
    { id: 5, name: 'tags', paramScene: 'BODY', type: 'array', required: true, exampleValue: '["vip"]' },
  ],
  responseParams: [{ id: 6, name: 'data', paramScene: 'RESPONSE', type: 'object', nullable: false }],
  errorCodes: [],
  curlExample: '#!/usr/bin/env bash',
});

/**
 * 挂载在线调用页组件。
 */
const mountView = async () => {
  const wrapper = mount(InterfaceInvokeView, {
    global: {
      stubs: {
        AppHeader: { template: '<header />' },
        AppFooter: { template: '<footer />' },
        PageContainer: { template: '<main><slot /></main>' },
        ToastMessage: { template: '<div />' },
        StatusTag: { template: '<span />' },
        MethodTag: { props: ['method'], template: '<span>{{ method }}</span>' },
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

/** 点击指定文案的按钮。 */
const clickButton = async (wrapper: Awaited<ReturnType<typeof mountView>>, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text() === text);
  expect(button).toBeDefined();
  await button?.trigger('click');
  await flushPromises();
};

describe('InterfaceInvokeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginUser = { id: 1, userRole: 'user' };
    mocks.getLoginUser.mockResolvedValue({ id: 1, userRole: 'user' });
    mocks.getDocDetail.mockResolvedValue(buildDocDetail());
    mocks.invoke.mockResolvedValue({ ok: true });
    mocks.routeParams.id = '1';
  });

  /**
   * 验证结构化参数按正确 JSON 类型提交。
   */
  it('按结构化参数类型生成在线调用 JSON', async () => {
    const wrapper = await mountView();

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');

    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    const payload = mocks.invoke.mock.calls[0][0];
    const params = JSON.parse(payload.userRequestParams);
    expect(params).toEqual({
      name: 'alice',
      age: 18,
      enabled: true,
      meta: { level: 2 },
      tags: ['vip'],
    });
    expect(wrapper.text()).toContain('"ok": true');
    expect(wrapper.emitted('show-toast')).toContainEqual(['调用成功', 'success']);
  });

  /** 验证未登录调用使用 Vue Router 跳转且不生成 Hash 链接。 */
  it('未登录时跳转到带 redirect 参数的登录路由', async () => {
    mocks.loginUser = null;
    const wrapper = await mountView();

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '去登录');

    expect(mocks.routerPush).toHaveBeenCalledWith('/login?redirect=%2Finterface%2F1%2Finvoke');
  });

  it('参数类型错误时不调用接口并展示校验错误', async () => {
    const wrapper = await mountView();
    await wrapper.get('#invoke-param-meta').setValue('{错误 JSON');

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');

    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('请求参数字段类型错误：meta 应为 object');
    expect(wrapper.emitted('show-toast')).toContainEqual([
      '请求参数字段类型错误：meta 应为 object',
      'error',
    ]);
  });

  it('调用失败时展示服务错误并发送错误通知', async () => {
    mocks.invoke.mockRejectedValue(new Error('网关调用失败'));
    const wrapper = await mountView();

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');

    expect(wrapper.text()).toContain('网关调用失败');
    expect(wrapper.emitted('show-toast')).toContainEqual(['网关调用失败', 'error']);
  });

  it('调用返回空值时显示空响应文案', async () => {
    mocks.invoke.mockResolvedValue(null);
    const wrapper = await mountView();

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');

    expect(wrapper.text()).toContain('接口返回为空');
    expect(wrapper.emitted('show-toast')).toContainEqual(['调用成功', 'success']);
  });

  it('文档加载失败时显示接口不存在', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getDocDetail.mockRejectedValue(new Error('文档加载失败'));

    const wrapper = await mountView();

    expect(wrapper.text()).toContain('接口不存在');
    expect(wrapper.text()).not.toContain('正在加载在线调用');
    consoleError.mockRestore();
  });

  it('有调用结果时通过父页面复制结果', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    const wrapper = await mountView();

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');
    await wrapper.get('.fei-debug-copy').trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith('{\n  "ok": true\n}');
    expect(wrapper.emitted('show-toast')).toContainEqual(['已复制', 'success']);
  });

  it('展示请求头、填充结构化示例并保留字符串响应', async () => {
    const detail = buildDocDetail();
    detail.requestHeaders = [{ name: 'Authorization', defaultValue: 'Bearer demo' }];
    mocks.getDocDetail.mockResolvedValue(detail);
    mocks.invoke.mockResolvedValue('plain response');
    const wrapper = await mountView();

    await wrapper.get('#invoke-param-name').setValue('');
    await clickButton(wrapper, '填充示例');
    expect((wrapper.get('#invoke-param-name').element as HTMLInputElement).value).toBe('alice');
    expect(wrapper.text()).toContain('Authorization: Bearer demo');

    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');
    expect(wrapper.text()).toContain('plain response');

    await clickButton(wrapper, '接口文档');
    expect(wrapper.find('[role="tab"][aria-selected="true"]').text()).toBe('接口文档');
  });

  it('非法接口ID不发起文档请求', async () => {
    mocks.routeParams.id = '0';
    const wrapper = await mountView();

    expect(mocks.getDocDetail).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('接口不存在');
  });

  it('空文档使用缺省展示且非Error调用失败使用兜底消息', async () => {
    const detail = buildDocDetail();
    detail.gatewayUrl = undefined;
    detail.requestHeaders = undefined;
    detail.requestParams = [];
    detail.structuredDocMissing = true;
    mocks.getDocDetail.mockResolvedValue(detail);
    mocks.invoke.mockRejectedValue(null);
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('无请求 Header');
    expect(wrapper.text()).toContain('暂无结构化请求参数');
    await clickButton(wrapper, '发送请求');
    await clickButton(wrapper, '确认调用');

    expect(wrapper.text()).toContain('调用失败，请稍后重试');
    expect(wrapper.emitted('show-toast')).toContainEqual(['调用失败，请稍后重试', 'error']);
  });
});
