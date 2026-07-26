import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import SectionNavigation from '../SectionNavigation.vue';

/** 测试导航图标组件。 */
const TestIcon = defineComponent({
  name: 'TestIcon',
  template: '<svg data-testid="navigation-icon" />',
});

/** 测试页面组件。 */
const TestPage = defineComponent({
  name: 'TestPage',
  template: '<div>测试页面</div>',
});

/** 公共导航测试数据。 */
const navigationItems = [
  { key: 'info', label: '个人信息', to: '/profile/info', icon: TestIcon },
  { key: 'records', label: '我的额度/调用', to: '/profile/records', icon: TestIcon },
  { key: 'keys', label: '密钥管理', to: '/profile/keys', icon: TestIcon },
];

/**
 * 挂载公共导航组件。
 * @param activeKey 当前激活菜单键
 * @returns 公共导航组件包装器
 */
const mountNavigation = async (activeKey: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: navigationItems.map((item) => ({ path: item.to, component: TestPage })),
  });
  await router.push(`/profile/${activeKey}`);
  await router.isReady();

  return mount(SectionNavigation, {
    props: {
      label: '个人中心导航',
      activeKey,
      items: navigationItems,
    },
    global: {
      plugins: [router],
    },
  });
};

describe('SectionNavigation 公共导航组件', () => {
  /** 验证导航语义、菜单内容和图标均完整渲染。 */
  it('渲染带可访问名称的全部导航项', async () => {
    const wrapper = await mountNavigation('records');

    expect(wrapper.get('nav').attributes('aria-label')).toBe('个人中心导航');
    expect(wrapper.findAll('.fei-section-navigation__link')).toHaveLength(3);
    expect(wrapper.findAll('[data-testid="navigation-icon"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('个人信息');
    expect(wrapper.text()).toContain('我的额度/调用');
    expect(wrapper.text()).toContain('密钥管理');
  });

  /** 验证路由地址和激活状态由调用方配置驱动。 */
  it('为当前菜单设置唯一激活状态并保留路由地址', async () => {
    const wrapper = await mountNavigation('records');
    const links = wrapper.findAll('.fei-section-navigation__link');

    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/profile/info',
      '/profile/records',
      '/profile/keys',
    ]);
    expect(links.filter((link) => link.classes('is-active'))).toHaveLength(1);
    expect(wrapper.get('a[href="/profile/records"]').classes()).toContain('is-active');
    expect(wrapper.get('a[href="/profile/records"]').attributes('aria-current')).toBe('page');
  });
});
