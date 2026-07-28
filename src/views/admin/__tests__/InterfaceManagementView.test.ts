import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceManagementView from '../InterfaceManagementView.vue';
import type { InterfaceInfoVO } from '@/types/interface';

const mocks = vi.hoisted(() => ({
  listPage: vi.fn(),
  online: vi.fn(),
  offline: vi.fn(),
  deleteInterface: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    listPage: mocks.listPage,
    online: mocks.online,
    offline: mocks.offline,
    delete: mocks.deleteInterface,
  },
}));

/** 构建接口列表测试数据。 */
const buildInterface = (docStatus: 'DRAFT' | 'READY'): InterfaceInfoVO => ({
  id: 1,
  name: '用户接口',
  url: 'http://localhost/api/user',
  status: 0,
  method: 'POST',
  quotaType: 'BASIC_QUOTA',
  quotaTypeText: '基础额度接口',
  initialQuota: 100,
  totalNum: 0,
  docStatus,
});

/** 挂载接口管理页并等待列表加载。 */
const mountView = async (docStatus: 'DRAFT' | 'READY') => {
  mocks.listPage.mockResolvedValue({
    records: [buildInterface(docStatus)],
    current: 1,
    size: 10,
    total: 1,
  });
  const wrapper = mount(InterfaceManagementView, {
    global: {
      stubs: { InterfaceConfigModal: true },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('InterfaceManagementView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('草稿接口显示待完善角标并禁用发布', async () => {
    const wrapper = await mountView('DRAFT');
    const publishButton = wrapper.findAll('button').find((button) => button.text() === '发布');

    expect(wrapper.text()).toContain('文档待完善');
    expect(publishButton?.attributes()).toHaveProperty('disabled');
    expect(publishButton?.attributes('title')).toBe('请先完成文档维护');
  });

  it('已完成的下线接口允许发布并展示服务端错误', async () => {
    mocks.online.mockRejectedValue(new Error('发布探测失败'));
    const wrapper = await mountView('READY');
    const publishButton = wrapper.findAll('button').find((button) => button.text() === '发布');

    expect(wrapper.text()).not.toContain('文档待完善');
    expect(publishButton?.attributes()).not.toHaveProperty('disabled');
    await publishButton?.trigger('click');
    await flushPromises();

    expect(mocks.online).toHaveBeenCalledWith({ id: 1 });
    expect(wrapper.emitted('show-toast')).toContainEqual(['发布探测失败', 'error']);
  });
});
