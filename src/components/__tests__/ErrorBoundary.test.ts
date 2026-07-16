import { defineComponent, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary.vue';

const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

describe('ErrorBoundary', () => {
  it('捕获子组件渲染异常并显示降级界面', async () => {
    const BrokenComponent = defineComponent({
      template: '<div>{{ missing.value }}</div>',
      setup() {
        return { missing: undefined };
      },
    });

    const wrapper = mount(ErrorBoundary, {
      slots: { default: BrokenComponent },
      global: { config: { warnHandler: () => undefined } },
    });
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('页面渲染出错');
    expect(wrapper.text()).toContain('刷新页面');
    expect(wrapper.text()).toContain('返回首页');
  });

  it('点击返回首页会清理错误状态并导航', async () => {
    const BrokenComponent = defineComponent({
      template: '<div>{{ missing.value }}</div>',
      setup() {
        return { missing: undefined };
      },
    });
    const wrapper = mount(ErrorBoundary, {
      slots: { default: BrokenComponent },
      global: { config: { warnHandler: () => undefined } },
    });
    await flushPromises();

    const buttons = wrapper.findAll('button');
    await buttons.find((button) => button.text() === '返回首页')?.trigger('click');

    expect(routerPush).toHaveBeenCalledWith('/home');
  });
});
