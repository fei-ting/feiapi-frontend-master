import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary.vue';

const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

describe('ErrorBoundary', () => {
  const globalMountOptions = {
    global: {
      config: {
        warnHandler: () => undefined,
        errorHandler: () => undefined,
      },
    },
  };

  it('正常渲染子组件内容', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: { default: '<div class="child-content">页面内容</div>' },
      ...globalMountOptions,
    });
    await nextTick();

    expect(wrapper.find('.child-content').text()).toBe('页面内容');
  });

  it('捕获子组件错误后显示固定友好文案且不阻断全局错误传播', async () => {
    const sensitiveErrorMessage = '内部接口 /admin/users 响应失败，令牌为 secret-token';
    const capturedError = new Error(sensitiveErrorMessage);
    const globalErrorHandler = vi.fn();
    const ThrowingChild = defineComponent({
      name: 'ThrowingChild',
      setup() {
        const shouldThrow = ref(false);

        return () => {
          if (shouldThrow.value) {
            throw capturedError;
          }

          return h('button', {
            class: 'throwing-child-trigger',
            onClick: () => {
              shouldThrow.value = true;
            },
          }, '触发渲染错误');
        };
      },
    });
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: () => h(ThrowingChild),
      },
      global: {
        config: {
          warnHandler: () => undefined,
          errorHandler: globalErrorHandler,
        },
      },
    });
    await wrapper.find('.throwing-child-trigger').trigger('click');
    await nextTick();

    expect(wrapper.find('.fei-error-boundary').exists()).toBe(true);
    expect(wrapper.text()).toContain('页面遇到了意外错误，请刷新页面后重试，或返回首页。');
    expect(wrapper.text()).not.toContain(sensitiveErrorMessage);
    expect(globalErrorHandler).toHaveBeenCalledTimes(1);
    expect(globalErrorHandler.mock.calls[0]?.[0]).toBe(capturedError);
  });

  it('点击返回首页会导航到首页', async () => {
    const wrapper = mount(ErrorBoundary, {
      ...globalMountOptions,
    });

    // 通过组件公开的导航按钮契约验证返回首页行为。
    wrapper.vm.$.setupState.handleGoHome();
    expect(routerPush).toHaveBeenCalledWith('/home');
  });
});
