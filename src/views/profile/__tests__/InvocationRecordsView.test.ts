import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InvocationRecordsView from '../InvocationRecordsView.vue';

const mocks = vi.hoisted(() => ({
  getListPage: vi.fn(),
}));

vi.mock('@/services/userInterfaceInfo', () => ({
  userInterfaceInfoService: {
    myListPage: mocks.getListPage,
  },
}));

describe('InvocationRecordsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** 验证调用记录跳转使用 Vue Router 路径而不是 Hash 链接。 */
  it('渲染不带 Hash 的接口详情链接', async () => {
    mocks.getListPage.mockResolvedValue({
      records: [
        {
          id: 1,
          interfaceInfoId: 7,
          interfaceName: '天气接口',
          interfacePath: '/weather',
          interfaceStatus: 1,
          method: 'GET',
          quotaType: 'BASIC_QUOTA',
          leftNum: 10,
          totalNum: 2,
        },
      ],
      total: 1,
      size: 10,
      current: 1,
    });

    const wrapper = mount(InvocationRecordsView, {
      global: {
        stubs: {
          MethodTag: { template: '<span />' },
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    });
    await flushPromises();

    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('/interface/7');
    expect(link.attributes('href')).not.toContain('#');
  });
});
