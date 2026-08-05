import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BoundaryRemaining from '../BoundaryRemaining.vue';

describe('BoundaryRemaining', () => {
  it('展示剩余量并在超限时切换错误状态', async () => {
    const wrapper = mount(BoundaryRemaining, { props: { current: 9, max: 10, unit: '字符' } });

    expect(wrapper.text()).toBe('剩余 1 字符');
    expect(wrapper.attributes('data-over-limit')).toBe('false');

    await wrapper.setProps({ current: 12 });
    expect(wrapper.text()).toBe('超过 2 字符');
    expect(wrapper.classes()).toContain('fei-boundary-remaining--error');
  });
});
