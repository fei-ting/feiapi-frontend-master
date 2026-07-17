import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProfileForm from '../ProfileForm.vue';

/** 挂载个人资料表单。 */
const mountForm = (overrides: Record<string, unknown> = {}) => mount(ProfileForm, {
  props: {
    modelValue: { userName: '当前昵称', gender: 1 },
    nicknameError: '',
    submitting: false,
    ...overrides,
  },
});

describe('ProfileForm', () => {
  it('展示当前昵称和性别', () => {
    const wrapper = mountForm();

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('当前昵称');
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('1');
  });

  it('昵称去除首尾空白并发送字段更新事件', async () => {
    const wrapper = mountForm();

    await wrapper.get('input').setValue('  新昵称  ');
    await wrapper.get('select').setValue('0');

    expect(wrapper.emitted('update:userName')).toEqual([['新昵称']]);
    expect(wrapper.emitted('update:gender')).toEqual([[0]]);
  });

  it('展示昵称错误并禁用提交按钮', () => {
    const wrapper = mountForm({ nicknameError: '昵称长度应为 2-16 个字符' });

    expect(wrapper.text()).toContain('昵称长度应为 2-16 个字符');
    expect(wrapper.get('input').classes()).toContain('fei-input--error');
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled');
  });

  it('提交中展示状态文案并发送提交事件', async () => {
    const wrapper = mountForm({ submitting: true });
    expect(wrapper.get('button').text()).toBe('修改中');

    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('submit')).toHaveLength(1);
  });
});
