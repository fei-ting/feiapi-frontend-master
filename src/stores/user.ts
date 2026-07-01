import { defineStore } from 'pinia';
import { userService } from '@/services/user';
import type { UserVO } from '@/types/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    loginUser: null as UserVO | null,
    loaded: false,
  }),
  actions: {
    setLoginUser(user: UserVO | null) {
      this.loginUser = user;
      this.loaded = true;
    },
    async fetchLoginUser() {
      try {
        const res = await userService.getLoginUser();
        this.setLoginUser(res.data || null);
      } catch {
        this.clearLoginUser();
      }
      return this.loginUser;
    },
    clearLoginUser() {
      this.loginUser = null;
      this.loaded = true;
    },
  },
});
