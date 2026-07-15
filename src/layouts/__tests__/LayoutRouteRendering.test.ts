import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { defineComponent, type Component } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLayout from '../AdminLayout.vue';
import AppLayout from '../AppLayout.vue';
import ProfileLayout from '../ProfileLayout.vue';
import HomeView from '@/views/HomeView.vue';

const serviceMocks = vi.hoisted(() => ({
  getLoginUser: vi.fn(),
  getHomeStats: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  userService: {
    getLoginUser: serviceMocks.getLoginUser,
    logout: serviceMocks.logout,
  },
}));

vi.mock('@/services/homeStats', () => ({
  homeStatsService: {
    getHomeStats: serviceMocks.getHomeStats,
  },
}));

/** 测试应用根组件 */
const TestRoot = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
});

/** 可发送 Toast 通知的测试子页面 */
const NotificationPage = defineComponent({
  emits: ['show-toast'],
  template: '<button class="test-notify" @click="$emit(\'show-toast\', \'保存成功\', \'success\')">通知</button>',
});

/** 后台测试子页面 */
const AdminPage = defineComponent({
  template: '<div class="test-admin-page">后台子页面</div>',
});

/** 个人中心测试子页面 */
const ProfilePage = defineComponent({
  template: '<div class="test-profile-page">个人中心子页面</div>',
});

/**
 * 挂载包含父布局和子页面的内存路由
 * @param layout 父布局组件
 * @param parentPath 父路由路径
 * @param childPath 子路由路径
 * @param targetPath 目标完整路径
 * @param childComponent 子页面组件
 * @returns 页面包装器
 */
const mountLayoutRoute = async (
  layout: Component,
  parentPath: string,
  childPath: string,
  targetPath: string,
  childComponent: Component,
): Promise<VueWrapper> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: parentPath,
        component: layout,
        children: [{ path: childPath, component: childComponent }],
      },
    ],
  });

  await router.push(targetPath);
  await router.isReady();

  const wrapper = mount(TestRoot, {
    global: {
      plugins: [createPinia(), router],
      stubs: {
        AppHeader: {
          props: ['active'],
          template: '<header class="test-header" :data-active="active" />',
        },
        AppFooter: { template: '<footer class="test-footer" />' },
        ErrorBoundary: { template: '<div class="test-error-boundary"><slot /></div>' },
        PageContainer: { template: '<main class="test-page-container"><slot /></main>' },
        ToastMessage: {
          props: ['message', 'type', 'visible'],
          template: '<div class="test-toast" :data-type="type" :data-visible="visible">{{ message }}</div>',
        },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('统一应用壳层路由渲染', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getLoginUser.mockResolvedValue({
      id: 1,
      userAccount: 'admin',
      userName: '管理员',
      userRole: 'admin',
    });
    serviceMocks.getHomeStats.mockResolvedValue({
      platformInterfaceCount: 1,
      totalInvocations: 2,
      successRate: 100,
      averageResponseTimeMs: 10,
    });
    serviceMocks.logout.mockResolvedValue(true);
  });

  /** 验证首页只通过父路由布局渲染一次应用壳层 */
  it('渲染首页子路由且不重复嵌套应用壳层', async () => {
    const wrapper = await mountLayoutRoute(AppLayout, '/', 'home', '/home', HomeView);

    expect(wrapper.find('.fei-hero').exists()).toBe(true);
    expect(wrapper.findAll('.fei-app-shell')).toHaveLength(1);
    expect(wrapper.get('.test-header').attributes('data-active')).toBe('home');
  });

  /** 验证普通页面通知可以交给应用布局统一展示 */
  it('接收普通子路由页面发出的 Toast 通知', async () => {
    const wrapper = await mountLayoutRoute(AppLayout, '/', 'market', '/market', NotificationPage);

    await wrapper.get('.test-notify').trigger('click');

    expect(wrapper.get('.test-toast').text()).toBe('保存成功');
    expect(wrapper.get('.test-toast').attributes('data-type')).toBe('success');
  });

  /** 验证后台布局能够渲染嵌套路由页面 */
  it('渲染后台子路由页面', async () => {
    const wrapper = await mountLayoutRoute(AdminLayout, '/admin', 'interfaces', '/admin/interfaces', AdminPage);

    expect(wrapper.find('.test-admin-page').exists()).toBe(true);
    expect(wrapper.get('a[href="/admin/interfaces"]').classes()).toContain('is-active');
  });

  /** 验证个人中心布局能够渲染嵌套路由页面 */
  it('渲染个人中心子路由页面', async () => {
    const wrapper = await mountLayoutRoute(ProfileLayout, '/profile', 'keys', '/profile/keys', ProfilePage);

    expect(wrapper.find('.test-profile-page').exists()).toBe(true);
    expect(wrapper.get('a[href="/profile/keys"]').classes()).toContain('is-active');
  });
});
