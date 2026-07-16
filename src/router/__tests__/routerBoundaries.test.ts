import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '../index';

const serviceMocks = vi.hoisted(() => ({
  getLoginUser: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  userService: {
    getLoginUser: serviceMocks.getLoginUser,
  },
}));

describe('功能路由边界', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    serviceMocks.getLoginUser.mockResolvedValue({
      id: 1,
      userAccount: 'admin',
      userName: '管理员',
      userRole: 'admin',
    });
    await router.replace('/home');
  });

  /** 验证所有功能边界具有稳定名称和功能元数据 */
  it('为各功能路由提供稳定名称和边界元数据', () => {
    const routeMap = new Map(router.getRoutes().map((route) => [route.name, route]));

    expect(routeMap.get('home')?.meta.feature).toBe('home');
    expect(routeMap.get('interface-market')?.meta.feature).toBe('interface-market');
    expect(routeMap.get('profile-info')?.meta.feature).toBe('profile-info');
    expect(routeMap.get('profile-records')?.meta.feature).toBe('profile-records');
    expect(routeMap.get('profile-keys')?.meta.feature).toBe('profile-keys');
    expect(routeMap.get('admin-dashboard')?.meta.feature).toBe('admin-dashboard');
    expect(routeMap.get('admin-interfaces')?.meta.feature).toBe('admin-interfaces');
    expect(routeMap.get('admin-quotas')?.meta.feature).toBe('admin-quotas');
  });

  /** 验证父路由默认入口指向明确的子功能 */
  it('将个人中心和后台父路径重定向到默认子页面', async () => {
    await router.push('/profile');
    expect(router.currentRoute.value.name).toBe('profile-info');

    await router.push('/admin');
    expect(router.currentRoute.value.name).toBe('admin-dashboard');
  });

  /** 验证受保护功能仍保留认证和管理员权限边界 */
  it('保留个人中心和后台的权限元数据', () => {
    const profileRoute = router.getRoutes().find((route) => route.name === 'profile');
    const adminRoute = router.getRoutes().find((route) => route.name === 'admin');

    expect(profileRoute?.meta.requiresAuth).toBe(true);
    expect(adminRoute?.meta.requiresAuth).toBe(true);
    expect(adminRoute?.meta.requiresAdmin).toBe(true);
  });

  /** 验证旧巨型页面已从源码中移除 */
  it('不再保留旧的巨型页面文件', () => {
    expect(existsSync(resolve(process.cwd(), 'src/views/AdminView.vue'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/views/ProfileView.vue'))).toBe(false);
  });
});
