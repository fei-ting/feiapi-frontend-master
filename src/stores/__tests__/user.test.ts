import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '../user';
import type { UserVO } from '@/types/user';

const serviceMocks = vi.hoisted(() => ({
  getLoginUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  userService: {
    getLoginUser: serviceMocks.getLoginUser,
    logout: serviceMocks.logout,
  },
}));

/**
 * 创建可手动完成的 Promise
 * @returns Promise 及其完成、拒绝函数
 */
const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

/** 管理员测试用户 */
const adminUser: UserVO = {
  id: 1,
  userAccount: 'admin',
  userName: '管理员',
  userRole: 'admin',
};

/** 普通测试用户 */
const normalUser: UserVO = {
  id: 2,
  userAccount: 'user',
  userName: '普通用户',
  userRole: 'user',
};

describe('用户会话 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    serviceMocks.logout.mockResolvedValue(true);
  });

  /** 验证并发加载只发送一次请求，后续读取使用缓存 */
  it('合并并发加载并缓存当前用户', async () => {
    const deferred = createDeferred<UserVO>();
    serviceMocks.getLoginUser.mockReturnValue(deferred.promise);
    const userStore = useUserStore();

    const firstRequest = userStore.fetchLoginUser();
    const secondRequest = userStore.fetchLoginUser();
    deferred.resolve(adminUser);

    await expect(firstRequest).resolves.toEqual(adminUser);
    await expect(secondRequest).resolves.toEqual(adminUser);
    await expect(userStore.fetchLoginUser()).resolves.toEqual(adminUser);
    expect(serviceMocks.getLoginUser).toHaveBeenCalledTimes(1);
    expect(userStore.loginUser).toEqual(adminUser);
    expect(userStore.loaded).toBe(true);
  });

  /** 验证强制刷新会绕过已加载缓存 */
  it('强制刷新并更新统一用户状态', async () => {
    serviceMocks.getLoginUser
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(normalUser);
    const userStore = useUserStore();

    await userStore.fetchLoginUser();
    await expect(userStore.refreshLoginUser()).resolves.toEqual(normalUser);

    expect(serviceMocks.getLoginUser).toHaveBeenCalledTimes(2);
    expect(userStore.loginUser).toEqual(normalUser);
  });

  /** 验证会话加载失败时记录为已加载的未登录状态 */
  it('加载失败时统一设置为未登录状态', async () => {
    serviceMocks.getLoginUser.mockRejectedValue(new Error('网络异常'));
    const userStore = useUserStore();

    await expect(userStore.fetchLoginUser()).resolves.toBeNull();

    expect(userStore.loginUser).toBeNull();
    expect(userStore.loaded).toBe(true);
  });

  /** 验证统一退出会清空用户状态 */
  it('退出成功后清空当前用户', async () => {
    const userStore = useUserStore();
    userStore.setLoginUser(adminUser);

    await userStore.logout();

    expect(serviceMocks.logout).toHaveBeenCalledTimes(1);
    expect(userStore.loginUser).toBeNull();
    expect(userStore.loaded).toBe(true);
  });

  /** 验证退出接口失败时保留当前用户状态 */
  it('退出失败时保留当前用户', async () => {
    serviceMocks.logout.mockRejectedValue(new Error('退出接口异常'));
    const userStore = useUserStore();
    userStore.setLoginUser(adminUser);

    await expect(userStore.logout()).rejects.toThrow('退出接口异常');

    expect(userStore.loginUser).toEqual(adminUser);
    expect(userStore.loaded).toBe(true);
  });

  /** 验证退出后的迟到请求不会恢复旧用户 */
  it('忽略退出后才完成的过期用户请求', async () => {
    const deferred = createDeferred<UserVO>();
    serviceMocks.getLoginUser.mockReturnValue(deferred.promise);
    const userStore = useUserStore();

    const pendingRequest = userStore.fetchLoginUser();
    await userStore.logout();
    deferred.resolve(adminUser);
    await pendingRequest;

    expect(userStore.loginUser).toBeNull();
    expect(userStore.loaded).toBe(true);
  });
});
