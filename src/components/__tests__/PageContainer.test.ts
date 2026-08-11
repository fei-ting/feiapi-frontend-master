import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PageContainer from '../PageContainer.vue';

/** 页面容器组件测试。 */
describe('PageContainer', () => {
  /** 验证普通页面继续使用默认容器宽度。 */
  it('默认使用标准页面容器', () => {
    const wrapper = mount(PageContainer, {
      slots: { default: '<div>页面内容</div>' },
    });

    expect(wrapper.get('.fei-container').classes()).not.toContain('fei-container--wide');
  });

  /** 验证工作区页面可以显式启用宽容器。 */
  it('根据 wide 属性启用宽工作区容器', () => {
    const wrapper = mount(PageContainer, {
      props: { wide: true },
      slots: { default: '<div>工作区内容</div>' },
    });

    expect(wrapper.get('.fei-container').classes()).toContain('fei-container--wide');
  });
});
