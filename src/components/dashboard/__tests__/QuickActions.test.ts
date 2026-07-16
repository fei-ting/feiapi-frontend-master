import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import QuickActions from '../QuickActions.vue';

/** RouterLink 测试替身。 */
const routerLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
};

describe('QuickActions', () => {
  it('保留三个固定路由入口和四项操作文案', () => {
    const wrapper = mount(QuickActions, {
      global: { stubs: { RouterLink: routerLinkStub } },
    });

    expect(wrapper.findAll('a').map((item) => item.attributes('href'))).toEqual([
      '/admin/interfaces',
      '/market',
      '/home',
    ]);
    expect(wrapper.text()).toContain('管理接口');
    expect(wrapper.text()).toContain('查看接口广场');
    expect(wrapper.text()).toContain('刷新数据');
    expect(wrapper.text()).toContain('返回首页');
  });

  it('点击刷新按钮时发送刷新事件', async () => {
    const wrapper = mount(QuickActions, {
      global: { stubs: { RouterLink: routerLinkStub } },
    });

    await wrapper.find('button.fei-quick-action').trigger('click');

    expect(wrapper.emitted('refresh')).toHaveLength(1);
  });
});
