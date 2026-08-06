import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceManagementView from '../InterfaceManagementView.vue';
import type { InterfaceInfoVO } from '@/types/interface';
import {
  PUBLISH_CHECK_FAILED_CODE,
  PUBLISH_PROBE_FAILED_CODE,
  type InterfacePublishCheckVO,
} from '@/features/interface-platform/publishing/types/interfacePublish';

const mocks = vi.hoisted(() => ({
  listPage: vi.fn(),
  online: vi.fn(),
  checkPublish: vi.fn(),
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
    checkPublish: mocks.checkPublish,
    offline: mocks.offline,
    delete: mocks.deleteInterface,
  },
}));

/** 构建接口列表测试数据。 */
const buildInterface = (docStatus: 'DRAFT' | 'READY'): InterfaceInfoVO => ({
  id: 1,
  name: '用户接口',
  url: 'http://localhost/api/user',
  path: '/api/user',
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

  it('发布静态检查失败时展示后端返回的问题弹窗', async () => {
    const checkResult: InterfacePublishCheckVO = {
      passed: false,
      issues: [{
        category: 'DOCUMENT',
        ruleCode: 'DOCUMENT_READY_REQUIRED',
        field: 'doc.docStatus',
        message: '接口文档必须完成维护',
      }],
    };
    const error = Object.assign(new Error('接口发布前检查未通过，请先修复检查问题'), {
      code: PUBLISH_CHECK_FAILED_CODE,
      data: checkResult,
    });
    mocks.online.mockRejectedValue(error);
    const wrapper = await mountView('READY');
    const publishButton = wrapper.findAll('button').find((button) => button.text() === '发布');

    await publishButton?.trigger('click');
    await flushPromises();

    expect(mocks.checkPublish).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('发布检查未通过');
    expect(wrapper.text()).toContain('接口文档必须完成维护');
    expect(wrapper.emitted('show-toast')).toContainEqual(['接口发布前检查未通过，请先修复检查问题', 'error']);
  });

  it('发布探测失败时不补跑静态检查也不展示通过弹窗', async () => {
    const error = Object.assign(new Error('发布探测失败[GATEWAY_AUTH]：网关发布探测校验失败'), {
      code: PUBLISH_PROBE_FAILED_CODE,
      data: {
        stage: 'GATEWAY_AUTH',
        reason: '网关发布探测校验失败',
      },
    });
    mocks.online.mockRejectedValue(error);
    mocks.checkPublish.mockResolvedValue({ passed: true, issues: [] });
    const wrapper = await mountView('READY');
    const publishButton = wrapper.findAll('button').find((button) => button.text() === '发布');

    await publishButton?.trigger('click');
    await flushPromises();

    expect(mocks.checkPublish).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('发布条件已通过');
    expect(wrapper.emitted('show-toast')).toContainEqual(['发布探测失败[GATEWAY_AUTH]：网关发布探测校验失败', 'error']);
  });

  it('删除确认展示接口名称、请求方法、路径和不可恢复提示', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = await mountView('READY');
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除');

    await deleteButton?.trigger('click');
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledWith(
      '确定删除接口“用户接口”吗？\n请求方法：POST\n网关路径：/api/user\n删除后不可恢复。',
    );
    expect(mocks.deleteInterface).toHaveBeenCalledWith({ id: 1 });
    confirmSpy.mockRestore();
  });

  it('取消删除确认时不发送删除请求', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const wrapper = await mountView('READY');
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除');

    await deleteButton?.trigger('click');

    expect(mocks.deleteInterface).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('删除失败时展示服务端错误并重新加载权威列表', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.deleteInterface.mockRejectedValue(new Error('接口不存在'));
    const wrapper = await mountView('READY');
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除');

    await deleteButton?.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('show-toast')).toContainEqual(['接口不存在', 'error']);
    expect(mocks.listPage).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });
});
