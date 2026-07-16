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
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, fullPath: '/interface/1/invoke' }),
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
  mocks.getLoginUser.mockResolvedValue({ id: 1, userRole: 'user' });
  mocks.getDocDetail.mockResolvedValue(buildDocDetail());
  mocks.invoke.mockResolvedValue({ ok: true });
  const wrapper = mount(InterfaceInvokeView, {
    global: {
      stubs: {
        AppHeader: { template: '<header />' },
        AppFooter: { template: '<footer />' },
        PageContainer: { template: '<main><slot /></main>' },
        ToastMessage: { template: '<div />' },
        StatusTag: { template: '<span />' },
        MethodTag: { props: ['method'], template: '<span>{{ method }}</span>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('InterfaceInvokeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginUser = { id: 1, userRole: 'user' };
  });

  /**
   * 验证结构化参数按正确 JSON 类型提交。
   */
  it('按结构化参数类型生成在线调用 JSON', async () => {
    const wrapper = await mountView();

    await wrapper.findAll('button').find((button) => button.text() === '发送请求')?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '确认调用')?.trigger('click');
    await flushPromises();

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
  });

  /** 验证未登录调用使用 Vue Router 跳转且不生成 Hash 链接。 */
  it('未登录时跳转到带 redirect 参数的登录路由', async () => {
    mocks.loginUser = null;
    const wrapper = await mountView();

    await wrapper.findAll('button').find((button) => button.text() === '发送请求')?.trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === '去登录')?.trigger('click');

    expect(mocks.routerPush).toHaveBeenCalledWith('/login?redirect=%2Finterface%2F1%2Finvoke');
  });
});
