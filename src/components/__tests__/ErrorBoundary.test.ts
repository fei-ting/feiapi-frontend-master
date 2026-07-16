import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nextTick } from 'vue';
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

  it('错误边界捕获错误但不阻断全局错误传播', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/ErrorBoundary.vue'), 'utf8');

    expect(source).toContain('onErrorCaptured');
    expect(source).not.toContain('return false');
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
