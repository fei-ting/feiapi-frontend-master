import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceDocMaintenanceView from '../InterfaceDocMaintenanceView.vue';
import type { InterfaceDocDetailVO } from '@/types/api';

const mocks = vi.hoisted(() => ({
  routeParams: { id: '1' },
  getDocDetail: vi.fn(),
  saveDoc: vi.fn(),
  routerPush: vi.fn(),
  leaveGuard: null as null | (() => boolean),
  updateGuard: null as null | (() => boolean),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: mocks.routeParams }),
  useRouter: () => ({ push: mocks.routerPush }),
  onBeforeRouteLeave: (guard: () => boolean) => { mocks.leaveGuard = guard; },
  onBeforeRouteUpdate: (guard: () => boolean) => { mocks.updateGuard = guard; },
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    getDocDetail: mocks.getDocDetail,
    saveDoc: mocks.saveDoc,
  },
}));

/** 构建接口文档维护测试数据。 */
const buildDetail = (status = 0): InterfaceDocDetailVO => ({
  interfaceInfo: {
    id: 1, name: '用户接口', method: 'POST', path: '/api/user', status,
    quotaType: 'BASIC_QUOTA', quotaTypeText: '基础额度接口', sdkMethodName: 'getUser',
  },
  doc: {
    docVersion: 'v1', requestContentType: 'application/json', responseContentType: 'application/json',
    successExample: '{"ok":true}', failExample: '{"ok":false}', remark: '公开备注',
  },
  requestParams: [{
    id: 1, name: 'userId', paramScene: 'BODY', type: 'number', required: true,
    description: '用户标识', exampleValue: '1', sortOrder: 1,
  }],
  responseParams: [
    { id: 2, name: 'data', paramScene: 'RESPONSE', type: 'object', required: true, nullable: false, sortOrder: 1 },
    { id: 3, parentId: 2, name: 'name', paramScene: 'RESPONSE', type: 'string', required: false, nullable: true, sortOrder: 2 },
  ],
  errorCodes: [{ id: 1, errorCode: 'A001', errorMessage: '参数错误', sortOrder: 1 }],
});

const wrappers: VueWrapper[] = [];

/** 挂载并等待文档加载完成。 */
const mountView = async (): Promise<VueWrapper> => {
  const wrapper = mount(InterfaceDocMaintenanceView);
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
};

/** 根据标题获取文档编辑区块。 */
const sectionByTitle = (wrapper: VueWrapper, title: string): VueWrapper => {
  const section = wrapper.findAll('.fei-doc-section').find((item) => item.find('h2').text() === title);
  expect(section).toBeDefined();
  return section as VueWrapper;
};

describe('InterfaceDocMaintenanceView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.routeParams.id = '1';
    mocks.leaveGuard = null;
    mocks.updateGuard = null;
    mocks.getDocDetail.mockResolvedValue(buildDetail());
    mocks.saveDoc.mockResolvedValue(true);
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  it('加载并映射主信息、参数和错误码', async () => {
    const wrapper = await mountView();

    expect(mocks.getDocDetail).toHaveBeenCalledWith(1);
    expect(wrapper.text()).toContain('用户接口');
    expect((sectionByTitle(wrapper, '请求参数说明').findAll('input')[0].element as HTMLInputElement).value).toBe('用户标识');
    expect((sectionByTitle(wrapper, '接口错误码').findAll('input')[1].element as HTMLInputElement).value).toBe('参数错误');
    expect((sectionByTitle(wrapper, '文档主信息').get('input').element as HTMLInputElement).value).toBe('v1');
    expect(wrapper.get('fieldset').attributes()).not.toHaveProperty('disabled');
  });

  it('非法接口ID不请求服务并展示加载错误', async () => {
    mocks.routeParams.id = 'invalid';
    const wrapper = await mountView();

    expect(mocks.getDocDetail).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('接口 ID 无效');
  });

  it('加载失败后可以重新加载', async () => {
    mocks.getDocDetail.mockRejectedValueOnce(new Error('文档服务失败')).mockResolvedValueOnce(buildDetail());
    const wrapper = await mountView();
    expect(wrapper.text()).toContain('文档服务失败');

    const retryButton = wrapper.findAll('button').find((button) => button.text() === '重新加载');
    await retryButton?.trigger('click');
    await flushPromises();
    expect(mocks.getDocDetail).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('用户接口');
  });

  it('接口不可编辑时由父级fieldset禁用全部控件', async () => {
    mocks.getDocDetail.mockResolvedValue(buildDetail(1));
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('当前接口不可编辑');
    expect(wrapper.get('fieldset').attributes()).toHaveProperty('disabled');
    const saveButtons = wrapper.findAll('button').filter((button) => button.text() === '保存文档');
    expect(saveButtons).toHaveLength(2);
    expect(saveButtons.every((button) => button.attributes().disabled !== undefined)).toBe(true);
  });

  it('字段更新后显示脏状态并允许保存', async () => {
    const wrapper = await mountView();
    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v2');

    expect(wrapper.text()).toContain('存在未保存修改');
    expect(wrapper.findAll('button').find((button) => button.text() === '保存文档')?.attributes()).not.toHaveProperty('disabled');
  });

  it('删除响应父字段时清除子字段引用并保持保存载荷', async () => {
    const wrapper = await mountView();
    const responseSection = sectionByTitle(wrapper, '响应字段');
    await responseSection.findAll('.fei-action-btn--danger')[0].trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === '保存文档')?.trigger('click');
    await flushPromises();

    const payload = mocks.saveDoc.mock.calls[0][0];
    const child = payload.params.find((param: { name: string }) => param.name === 'name');
    expect(payload.params.some((param: { name: string }) => param.name === 'data')).toBe(false);
    expect(child.parentParamKey).toBeUndefined();
  });

  it('格式化合法JSON并保留非法JSON原值', async () => {
    const wrapper = await mountView();
    const jsonSection = sectionByTitle(wrapper, 'JSON 示例');
    const textareas = jsonSection.findAll('textarea');

    await textareas[0].setValue('{"data":1}');
    await jsonSection.findAll('button')[0].trigger('click');
    expect((textareas[0].element as HTMLTextAreaElement).value).toContain('\n  "data": 1\n');

    await textareas[1].setValue('{bad json');
    await jsonSection.findAll('button')[1].trigger('click');
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('{bad json');
    expect(wrapper.text()).toContain('失败响应示例不是合法 JSON');
  });

  it('依次拦截主信息、响应字段和错误码必填错误', async () => {
    const wrapper = await mountView();
    const saveButton = () => wrapper.findAll('button').find((button) => button.text() === '保存文档');

    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('');
    await saveButton()?.trigger('click');
    expect(wrapper.text()).toContain('文档版本和内容格式不能为空');

    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v1');
    await sectionByTitle(wrapper, '响应字段').findAll('input')[0].setValue('');
    await saveButton()?.trigger('click');
    expect(wrapper.text()).toContain('响应字段名称和类型不能为空');

    await sectionByTitle(wrapper, '响应字段').findAll('input')[0].setValue('data');
    await sectionByTitle(wrapper, '接口错误码').findAll('input')[0].setValue('');
    await saveButton()?.trigger('click');
    expect(wrapper.text()).toContain('错误码和错误信息不能为空');
    expect(mocks.saveDoc).not.toHaveBeenCalled();
  });

  it('保存成功后重新加载并发送成功通知', async () => {
    const wrapper = await mountView();
    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v2');
    await wrapper.findAll('button').find((button) => button.text() === '保存文档')?.trigger('click');
    await flushPromises();

    expect(mocks.saveDoc).toHaveBeenCalledOnce();
    expect(mocks.saveDoc.mock.calls[0][0].docVersion).toBe('v2');
    expect(mocks.getDocDetail).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('show-toast')).toContainEqual(['接口文档已保存', 'success']);
  });

  it('保存失败时保留编辑状态和服务错误', async () => {
    mocks.saveDoc.mockRejectedValue(new Error('保存服务失败'));
    const wrapper = await mountView();
    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v2');
    await wrapper.findAll('button').find((button) => button.text() === '保存文档')?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('保存服务失败');
    expect(wrapper.text()).toContain('存在未保存修改');
  });

  it('脏数据触发路由离开和beforeunload确认', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const wrapper = await mountView();
    expect(mocks.leaveGuard?.()).toBe(true);

    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v2');
    expect(mocks.leaveGuard?.()).toBe(false);
    expect(confirm).toHaveBeenCalledWith('当前文档存在未保存修改，确定离开吗？');

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('缺省文档映射稳定键并支持区块增删和返回列表', async () => {
    mocks.getDocDetail.mockResolvedValue({
      interfaceInfo: { id: 1, name: '缺省文档接口', status: 0 },
      requestParams: [{ name: 'keyword', paramScene: 'QUERY' }],
      responseParams: [{ paramScene: 'RESPONSE' }],
      errorCodes: [{}],
    } satisfies InterfaceDocDetailVO);
    const wrapper = await mountView();

    const requestSection = sectionByTitle(wrapper, '请求参数说明');
    await requestSection.findAll('input')[0].setValue('查询关键字');
    expect((requestSection.findAll('input')[0].element as HTMLInputElement).value).toBe('查询关键字');

    await sectionByTitle(wrapper, '响应字段').findAll('button')[0].trigger('click');
    expect(sectionByTitle(wrapper, '响应字段').findAll('.fei-doc-record')).toHaveLength(2);

    const errorSection = sectionByTitle(wrapper, '接口错误码');
    await errorSection.findAll('button')[0].trigger('click');
    expect(errorSection.findAll('.fei-doc-record')).toHaveLength(2);
    await errorSection.findAll('.fei-action-btn--danger')[0].trigger('click');
    expect(errorSection.findAll('.fei-doc-record')).toHaveLength(1);

    await wrapper.findAll('button').find((button) => button.text() === '返回列表')?.trigger('click');
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: 'admin-interfaces' });
  });

  it('空JSON不处理并展示成功示例格式错误', async () => {
    const wrapper = await mountView();
    const jsonSection = sectionByTitle(wrapper, 'JSON 示例');
    const successExample = jsonSection.findAll('textarea')[0];

    await successExample.setValue('');
    await jsonSection.findAll('button')[0].trigger('click');
    expect(wrapper.find('.fei-form-error').exists()).toBe(false);

    await successExample.setValue('{bad json');
    await jsonSection.findAll('button')[0].trigger('click');
    expect(wrapper.text()).toContain('成功响应示例不是合法 JSON');
  });

  it('非Error加载和保存失败时使用兜底消息', async () => {
    mocks.getDocDetail.mockRejectedValueOnce(null).mockResolvedValueOnce(buildDetail());
    const wrapper = await mountView();
    expect(wrapper.text()).toContain('接口文档加载失败');

    await wrapper.findAll('button').find((button) => button.text() === '重新加载')?.trigger('click');
    await flushPromises();
    mocks.saveDoc.mockRejectedValue(null);
    await sectionByTitle(wrapper, '文档主信息').get('input').setValue('v2');
    await wrapper.findAll('button').find((button) => button.text() === '保存文档')?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('接口文档保存失败');
  });
});
