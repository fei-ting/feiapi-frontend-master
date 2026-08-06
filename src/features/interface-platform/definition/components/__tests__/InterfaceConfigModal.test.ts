import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InterfaceConfigModal from '../InterfaceConfigModal.vue';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/services/interfaceInfo', () => ({
  interfaceService: {
    add: mocks.add,
    update: mocks.update,
  },
}));

describe('InterfaceConfigModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.add.mockResolvedValue(7);
  });

  it('新增接口时省略空展示地址', async () => {
    const wrapper = mount(InterfaceConfigModal, {
      props: { open: true },
    });
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('用户接口');
    await inputs[1].setValue('getUser');
    await inputs[2].setValue('/api/user');
    await inputs[3].setValue('http://user-service:8080');
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
    await inputs[1].setValue('getUser');
    await inputs[2].setValue('/api/user');
    await inputs[3].setValue('http://user-service:8080');
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
    await inputs[1].setValue('getUser');
    await inputs[2].setValue('/api/user');
    await inputs[3].setValue('http://user-service:8080');
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
});
