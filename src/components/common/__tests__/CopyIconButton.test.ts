import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CopyIconButton from '../CopyIconButton.vue';

describe('CopyIconButton', () => {
  it('渲染统一复制图标和提示信息', () => {
    const wrapper = mount(CopyIconButton, {
      props: { label: '复制 Java SDK 示例', placement: 'top-right' },
    });

    const button = wrapper.get('button');
    expect(button.attributes('aria-label')).toBe('复制 Java SDK 示例');
    expect(button.attributes('title')).toBe('复制 Java SDK 示例');
    expect(button.attributes('data-tooltip')).toBe('复制');
    expect(button.classes()).toContain('fei-copy-button--top-right');
    expect(button.find('svg').exists()).toBe(true);
  });

  it('点击时转发事件且禁用后不再触发', async () => {
    const wrapper = mount(CopyIconButton);

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.setProps({ disabled: true });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled');
  });
});
