import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from '../useToast';

/** Toast 组合式函数测试组件。 */
const ToastHarness = defineComponent({
  setup() {
    const controller = useToast(1000);

    /** 显示成功通知。 */
    const showSuccess = (): void => controller.showToast('保存成功', 'success');
    /** 显示默认类型通知。 */
    const showDefault = (): void => controller.showToast('默认提示');
    /** 显示第一条连续通知。 */
    const showFirst = (): void => controller.showToast('第一条通知', 'info');
    /** 显示第二条连续通知。 */
    const showSecond = (): void => controller.showToast('第二条通知', 'error');

    return {
      ...controller,
      showSuccess,
      showDefault,
      showFirst,
      showSecond,
    };
  },
  template: `
    <div>
      <output class="test-toast" :data-visible="toast.visible" :data-type="toast.type">{{ toast.message }}</output>
      <button class="show-success" @click="showSuccess">成功通知</button>
      <button class="show-default" @click="showDefault">默认通知</button>
      <button class="show-first" @click="showFirst">第一条</button>
      <button class="show-second" @click="showSecond">第二条</button>
      <button class="hide-toast" @click="hideToast">隐藏</button>
    </div>
  `,
});

describe('Toast 通知组合式函数', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('显示指定类型通知并在持续时间后关闭', async () => {
    const wrapper = mount(ToastHarness);

    await wrapper.get('.show-success').trigger('click');
    expect(wrapper.get('.test-toast').text()).toBe('保存成功');
    expect(wrapper.get('.test-toast').attributes('data-type')).toBe('success');
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('true');

    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('false');
    wrapper.unmount();
  });

  it('使用默认类型并支持立即隐藏', async () => {
    const wrapper = mount(ToastHarness);

    await wrapper.get('.show-default').trigger('click');
    expect(wrapper.get('.test-toast').attributes('data-type')).toBe('info');
    expect(vi.getTimerCount()).toBe(1);

    await wrapper.get('.hide-toast').trigger('click');
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('false');
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('连续通知取消旧定时器并保留最新通知完整时长', async () => {
    const wrapper = mount(ToastHarness);

    await wrapper.get('.show-first').trigger('click');
    await vi.advanceTimersByTimeAsync(500);
    await wrapper.get('.show-second').trigger('click');
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.get('.test-toast').text()).toBe('第二条通知');
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('true');

    await vi.advanceTimersByTimeAsync(499);
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('true');
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.get('.test-toast').attributes('data-visible')).toBe('false');
    wrapper.unmount();
  });

  it('组件卸载时隐藏通知并清理定时器', async () => {
    const wrapper = mount(ToastHarness);

    await wrapper.get('.show-success').trigger('click');
    const toast = wrapper.vm.toast;
    expect(vi.getTimerCount()).toBe(1);

    wrapper.unmount();
    expect(toast.visible).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(toast.visible).toBe(false);
  });

  it('非组件上下文调用时不注册生命周期钩子', () => {
    const { toast, hideToast } = useToast();

    expect(toast.visible).toBe(false);
    expect(() => hideToast()).not.toThrow();
  });
});
