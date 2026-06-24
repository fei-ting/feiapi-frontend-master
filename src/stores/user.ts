import { defineStore } from 'pinia';
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
    clearLoginUser() {
      this.loginUser = null;
      this.loaded = true;
    },
  },
});
