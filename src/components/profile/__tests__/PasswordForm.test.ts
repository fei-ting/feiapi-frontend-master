import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordForm from '../PasswordForm.vue';

/** 挂载密码修改表单。 */
const mountForm = (overrides: Record<string, unknown> = {}) => mount(PasswordForm, {
  props: {
    modelValue: { oldPassword: 'oldpass1', newPassword: 'newpass2', checkPassword: 'newpass2' },
    errors: { oldPassword: '', newPassword: '', checkPassword: '' },
    submitting: false,
    ...overrides,
  },
});

describe('PasswordForm', () => {
  it('展示三个密码值及正确的输入属性', () => {
    const wrapper = mountForm();
    const inputs = wrapper.findAll('input');

    expect(inputs.map((input) => (input.element as HTMLInputElement).value)).toEqual([
      'oldpass1', 'newpass2', 'newpass2',
    ]);
    expect(inputs.map((input) => input.attributes('type'))).toEqual(['password', 'password', 'password']);
    expect(inputs.map((input) => input.attributes('autocomplete'))).toEqual([
      'current-password', 'new-password', 'new-password',
    ]);
  });

  it('输入和失焦时发送字段更新及校验事件', async () => {
    const wrapper = mountForm();
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('changed1');
    await inputs[1].setValue('changed2');
    await inputs[2].setValue('changed2');
    await inputs[0].trigger('blur');
    await inputs[1].trigger('blur');
    await inputs[2].trigger('blur');

    expect(wrapper.emitted('update:oldPassword')).toEqual([['changed1']]);
    expect(wrapper.emitted('update:newPassword')).toEqual([['changed2']]);
    expect(wrapper.emitted('update:checkPassword')).toEqual([['changed2']]);
    expect(wrapper.emitted('validate-field')).toEqual([
      ['oldPassword'], ['newPassword'], ['checkPassword'],
    ]);
  });

  it('展示每个字段的实时错误状态', () => {
    const wrapper = mountForm({
      errors: {
        oldPassword: '请输入旧密码',
        newPassword: '密码长度应为 8-16 位',
        checkPassword: '两次输入的新密码不一致',
      },
    });

    expect(wrapper.findAll('.fei-field-error').map((item) => item.text())).toEqual([
      '请输入旧密码', '密码长度应为 8-16 位', '两次输入的新密码不一致',
    ]);
    expect(wrapper.findAll('.fei-input--error')).toHaveLength(3);
  });

  it('提交中禁用按钮并保持提交事件', async () => {
    const wrapper = mountForm({ submitting: true });

    expect(wrapper.get('button').text()).toBe('修改中');
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });
});
