import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceDetailView from '../InterfaceDetailView.vue';
import type { InterfaceDocDetailVO } from '@/types/api';

const mocks = vi.hoisted(() => ({
  getDocDetail: vi.fn(),
  getLoginUser: vi.fn(),
  logout: vi.fn(),
  clearLoginUser: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, fullPath: '/interface/1' }),
  useRouter: () => ({ push: mocks.routerPush, replace: mocks.routerReplace }),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    getDocDetail: mocks.getDocDetail,
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
    clearLoginUser: mocks.clearLoginUser,
  }),
}));

/**
 * 构建接口文档详情测试数据。
 */
const buildDocDetail = (override: Partial<InterfaceDocDetailVO> = {}): InterfaceDocDetailVO => ({
  interfaceInfo: {
    id: 1,
    name: '用户查询',
    description: '查询用户信息',
    targetHost: 'http://feiapi-interface:8123',
    method: 'POST',
    status: 1,
    quotaType: 'BASIC_QUOTA',
    quotaTypeText: '基础额度接口',
    initialQuota: 100,
    totalNum: 12,
    updateTime: '2026-07-13T12:00:00',
  },
  doc: {
    docVersion: 'v1',
    requestContentType: 'application/json',
    responseContentType: 'application/json',
    authDescription: '签名鉴权',
    successExample: '{bad json',
    failExample: '{"ok":false}',
  },
  gatewayUrl: 'http://localhost:8090/api/user',
  structuredDocMissing: false,
  requestHeaders: [{ id: 1, name: 'Content-Type', type: 'string', required: true, exampleValue: 'application/json' }],
  requestParams: [{ id: 2, name: 'age', paramScene: 'BODY', type: 'number', required: true, exampleValue: '18' }],
  responseParams: [
    { id: 3, name: 'requiredButNullable', paramScene: 'RESPONSE', type: 'string', required: true, nullable: true },
    { id: 4, name: 'optionalButNotNullable', paramScene: 'RESPONSE', type: 'string', required: false, nullable: false },
  ],
  errorCodes: [{ id: 1, errorCode: 'A001', errorMessage: '参数错误', solution: '检查请求参数' }],
  curlExample: '#!/usr/bin/env bash\ncurl -X "$METHOD" "$URL"',
  ...override,
});

/**
 * 挂载接口详情页组件。
 */
const mountView = async (docDetail: InterfaceDocDetailVO) => {
  mocks.getLoginUser.mockResolvedValue({ data: { id: 1, userRole: 'admin' } });
  mocks.getDocDetail.mockResolvedValue({ data: docDetail });
  const wrapper = mount(InterfaceDetailView, {
    global: {
      stubs: {
        AppHeader: { template: '<header />' },
        AppFooter: { template: '<footer />' },
        PageContainer: { template: '<main><slot /></main>' },
        ToastMessage: { template: '<div />' },
        StatusTag: { template: '<span />' },
        MethodTag: { props: ['method'], template: '<span>{{ method }}</span>' },
        CopyOutlined: { template: '<span>复制</span>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('InterfaceDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 验证文档分区、非法 JSON 原文、nullable 和复制 curl。
   */
  it('渲染文档分区并按 nullable 独立展示响应字段', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const wrapper = await mountView(buildDocDetail());

    expect(wrapper.text()).toContain('基础信息');
    expect(wrapper.text()).toContain('请求 Header');
    expect(wrapper.text()).toContain('请求参数');
    expect(wrapper.text()).toContain('响应参数');
    expect(wrapper.text()).toContain('错误码');
    expect(wrapper.text()).toContain('{bad json');
    expect(wrapper.text()).toContain('requiredButNullable');
    expect(wrapper.text()).toContain('optionalButNotNullable');
    expect(wrapper.text()).toContain('requiredButNullablestring是');
    expect(wrapper.text()).toContain('optionalButNotNullablestring否');

    await wrapper.get('button[title="复制 curl 示例"]').trigger('click');
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith('#!/usr/bin/env bash\ncurl -X "$METHOD" "$URL"');
  });

  /**
   * 验证空文档分区渲染。
   */
  it('渲染各文档分区空状态', async () => {
    const wrapper = await mountView(buildDocDetail({
      structuredDocMissing: true,
      requestHeaders: [],
      requestParams: [],
      responseParams: [],
      errorCodes: [],
      curlExample: '',
    }));

    expect(wrapper.text()).toContain('当前接口尚未维护完整的结构化文档');
    expect(wrapper.text()).toContain('无请求 Header');
    expect(wrapper.text()).toContain('无请求参数');
    expect(wrapper.text()).toContain('暂无响应字段说明');
    expect(wrapper.text()).toContain('暂无接口级错误码');
    expect(wrapper.text()).toContain('暂无调用示例');
  });
});
