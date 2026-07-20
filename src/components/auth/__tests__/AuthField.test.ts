import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AuthField from '../AuthField.vue';

/** 挂载认证字段组件。 */
const mountField = (overrides: Record<string, unknown> = {}) => mount(AuthField, {
  props: {
    id: 'userAccount',
    label: '用户名',
    modelValue: 'alice1',
    placeholder: '请输入用户名',
    ...overrides,
  },
});

describe('AuthField', () => {
  it('关联标签与输入框并展示初始值', () => {
    const wrapper = mountField();
    const input = wrapper.get('input');

    expect(wrapper.get('label').attributes('for')).toBe('userAccount');
    expect(input.attributes('id')).toBe('userAccount');
    expect(input.attributes('type')).toBe('text');
    expect((input.element as HTMLInputElement).value).toBe('alice1');
    expect(input.attributes('placeholder')).toBe('请输入用户名');
    expect(input.attributes('aria-invalid')).toBe('false');
  });

  it('转发字段更新、输入和失焦事件', async () => {
    const wrapper = mountField();
    const input = wrapper.get('input');

    await input.setValue('bob2');
    await input.trigger('blur');

    expect(wrapper.emitted('update:modelValue')).toEqual([['bob2']]);
    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });

  it('展示密码字段、错误状态和抖动反馈', () => {
    const wrapper = mountField({
      id: 'userPassword',
      label: '密码',
      type: 'password',
      error: '请输入密码',
      shaking: true,
    });
    const input = wrapper.get('input');
    const error = wrapper.get('.fei-field-error');

    expect(input.attributes('type')).toBe('password');
    expect(input.classes()).toContain('fei-input--error');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe('userPassword-error');
    expect(error.attributes('id')).toBe('userPassword-error');
    expect(error.attributes('role')).toBe('alert');
    expect(error.classes()).toContain('fei-field-error--shake');
    expect(error.text()).toBe('请输入密码');
  });
});
