import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceConfigModal from '../InterfaceConfigModal.vue';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  listSdkMethods: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    add: mocks.add,
    listSdkMethods: mocks.listSdkMethods,
    update: mocks.update,
  },
}));

describe('InterfaceConfigModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.add.mockResolvedValue(7);
    mocks.listSdkMethods.mockResolvedValue([
      { sdkMethodName: 'getUser', needParams: true },
      { sdkMethodName: 'getLoveWords', needParams: false },
    ]);
  });

  it('新增接口时省略空展示地址', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: { open: true },
    });
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('用户接口');
    await flushPromises();
    await wrapper.findAll('select')[0].setValue('getUser');
    await inputs[1].setValue('/api/user');
    await inputs[2].setValue('http://user-service:8080');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.add).toHaveBeenCalledOnce();
    const payload = mocks.add.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: '用户接口',
      sdkMethodName: 'getUser',
      path: '/api/user',
      targetHost: 'http://user-service:8080',
    });
    expect(payload).not.toHaveProperty('url');
    expect(wrapper.emitted('saved')).toEqual([[7, true]]);
  });

  it('运行时模板参数名带首尾空白时阻止提交', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: { open: true },
    });
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('用户接口');
    await flushPromises();
    await wrapper.findAll('select')[0].setValue('getUser');
    await inputs[1].setValue('/api/user');
    await inputs[2].setValue('http://user-service:8080');
    await wrapper.get('textarea.fei-code-input').setValue('{" userId": 1}');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.add).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('请求参数名称不能包含首尾空白');
  });

  it('运行时模板参数名为空时阻止提交', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: { open: true },
    });
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('用户接口');
    await flushPromises();
    await wrapper.findAll('select')[0].setValue('getUser');
    await inputs[1].setValue('/api/user');
    await inputs[2].setValue('http://user-service:8080');
    await wrapper.get('textarea.fei-code-input').setValue('{"": 1}');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.add).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('请求参数名称不能为空');
  });

  it('编辑接口时运行时模板参数名非法则不调用更新接口', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: {
        open: false,
        interfaceInfo: {
          id: 9,
          name: '用户接口',
          sdkMethodName: 'getUser',
          path: '/api/user',
          targetHost: 'http://user-service:8080',
          requestParams: '{"userId ": 1}',
          method: 'POST',
          quotaType: 'BASIC_QUOTA',
        },
      },
    });
    await wrapper.setProps({ open: true });

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.update).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('请求参数名称不能包含首尾空白');
  });

  it.each([
    [JSON.stringify(Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`p${index}`, index]))), '请求参数数量不能超过 100'],
    [JSON.stringify({ ['😀'.repeat(129)]: 1 }), '参数名称长度不能超过 128 个字符'],
    [JSON.stringify({ value: 'a'.repeat(1025) }), '参数示例值长度不能超过 1024 个字符'],
    ['x'.repeat(65_536), '请求参数模板不能超过 65535 个 UTF-8 字节'],
  ])('运行时模板边界超限时阻止提交并展示原因', async (requestParams, message) => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await wrapper.get('textarea.fei-code-input').setValue(requestParams);

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.add).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(message);
  });

  it('新增接口时以下拉框展示已注册 SDK 方法', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await flushPromises();

    expect(mocks.listSdkMethods).toHaveBeenCalledOnce();
    expect(wrapper.findAll('select')[0].text()).toContain('getUser（需要请求参数）');
    expect(wrapper.findAll('select')[0].text()).toContain('getLoveWords（无请求参数）');
  });

  it('SDK 方法列表加载失败时禁止新增提交', async () => {
    mocks.listSdkMethods.mockRejectedValueOnce(new Error('SDK 方法列表加载失败'));
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await flushPromises();

    await wrapper.get('form').trigger('submit');

    expect(mocks.add).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('SDK 方法列表加载失败');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('点击弹窗外部遮罩时保留弹窗和已填写内容', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    const nameInput = wrapper.get('input');
    await nameInput.setValue('尚未保存的接口');

    await wrapper.get('.fei-modal-mask').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.get('input').element.value).toBe('尚未保存的接口');
    expect(wrapper.find('.fei-confirm-dialog').exists()).toBe(false);
  });

  it('表单未修改时点击取消直接关闭', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });

    await wrapper.get('.fei-interface-config-modal .fei-btn--secondary').trigger('click');

    expect(wrapper.emitted('close')).toEqual([[]]);
  });

  it('表单修改后点击取消要求确认并允许继续编辑', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await wrapper.get('input').setValue('尚未保存的接口');

    await wrapper.get('.fei-interface-config-modal .fei-btn--secondary').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.get('.fei-confirm-dialog').text()).toContain('放弃未保存内容');

    await wrapper.get('.fei-confirm-dialog .fei-btn--secondary').trigger('click');

    expect(wrapper.find('.fei-confirm-dialog').exists()).toBe(false);
    expect(wrapper.get('input').element.value).toBe('尚未保存的接口');
  });

  it('表单修改后确认放弃才关闭弹窗', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await wrapper.get('input').setValue('尚未保存的接口');
    await wrapper.get('.fei-modal-mask').trigger('keyup', { key: 'Escape' });

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.find('.fei-confirm-dialog').exists()).toBe(true);

    await wrapper.get('.fei-confirm-dialog .fei-btn--primary').trigger('click');

    expect(wrapper.emitted('close')).toEqual([[]]);
  });

  it('表单修改后点击关闭按钮要求确认并锁定底层表单', async () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });
    await wrapper.get('input').setValue('尚未保存的接口');

    await wrapper.get('.fei-interface-config-modal__close').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.find('.fei-confirm-dialog').exists()).toBe(true);
    expect(wrapper.get('.fei-interface-config-modal').attributes('inert')).toBeDefined();
    expect(wrapper.get('.fei-interface-config-modal').attributes('aria-hidden')).toBe('true');
  });

  it('准确标记六个必填字段和展示地址可选状态', () => {
    const wrapper = mount(InterfaceConfigModal, { props: { open: true } });

    expect(wrapper.findAll('.fei-required-mark')).toHaveLength(6);
    expect(wrapper.get('.fei-interface-config-modal__optional').text()).toBe('可选');
    expect(wrapper.get('.fei-interface-config-modal__remaining').text()).toContain('剩余');
  });
});
