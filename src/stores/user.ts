import { defineStore } from 'pinia';
import { ref } from 'vue';
import { userService } from '@/services/user';
import type { UserVO } from '@/types/user';

/**
 * 用户会话 Store
 * 作为当前登录用户的唯一状态来源，并统一管理加载、刷新和退出操作
 */
export const useUserStore = defineStore('user', () => {
  /** 当前登录用户 */
  const loginUser = ref<UserVO | null>(null);

  /** 是否已完成首次会话加载 */
  const loaded = ref(false);

  /** 当前进行中的用户加载请求 */
  let pendingRequest: Promise<UserVO | null> | null = null;

  /** 会话版本，用于防止过期请求覆盖退出后的状态 */
  let sessionVersion = 0;

  /**
   * 设置当前登录用户
   * @param user 当前用户，未登录时为 null
   */
  const setLoginUser = (user: UserVO | null) => {
    sessionVersion += 1;
    loginUser.value = user;
    loaded.value = true;
  };

  /** 清除当前登录用户 */
  const clearLoginUser = () => {
    setLoginUser(null);
  };

  /**
   * 加载当前登录用户
   * 已加载时返回缓存，并发调用复用同一个请求
   * @param force 是否忽略缓存并强制刷新
   * @returns 当前登录用户
   */
  const fetchLoginUser = async (force = false): Promise<UserVO | null> => {
    if (pendingRequest) {
      return pendingRequest;
    }
    if (!force && loaded.value) {
      return loginUser.value;
    }

    const requestVersion = sessionVersion;
    pendingRequest = (async () => {
      try {
        const user = await userService.getLoginUser();
        if (requestVersion === sessionVersion) {
          loginUser.value = user || null;
          loaded.value = true;
        }
      } catch {
        if (requestVersion === sessionVersion) {
          loginUser.value = null;
          loaded.value = true;
        }
      }
      return loginUser.value;
    })();

    try {
      return await pendingRequest;
    } finally {
      pendingRequest = null;
    }
  };

  /**
   * 强制刷新当前登录用户
   * @returns 刷新后的登录用户
   */
  const refreshLoginUser = (): Promise<UserVO | null> => fetchLoginUser(true);

  /** 退出当前会话并清空用户状态 */
  const logout = async () => {
    await userService.logout();
    clearLoginUser();
  };

  return {
    loginUser,
    loaded,
    setLoginUser,
    clearLoginUser,
    fetchLoginUser,
    refreshLoginUser,
    logout,
  };
});
