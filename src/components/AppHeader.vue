<template>
  <header class="fei-header">
    <div class="fei-container fei-header__inner">
      <RouterLink class="fei-brand" to="/home" aria-label="FeiAPI 首页">
        <div class="fei-brand__icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <span>FeiAPI</span>
      </RouterLink>

      <nav class="fei-nav" aria-label="主导航">
        <RouterLink class="fei-nav__link" :class="{ 'is-active': active === 'home' }" to="/home">主页</RouterLink>
        <RouterLink class="fei-nav__link" :class="{ 'is-active': active === 'market' }" to="/market">接口广场</RouterLink>
        <RouterLink
          v-if="loginUser?.userRole === 'admin'"
          class="fei-nav__link"
          :class="{ 'is-active': active === 'admin' }"
          to="/admin/dashboard"
        >
          后台管理
        </RouterLink>
      </nav>

      <div class="fei-nav__actions">
        <!-- 已登录：头像 + 昵称 + 下拉菜单 -->
        <template v-if="loginUser">
          <div class="fei-user-menu" @mouseenter="openDropdown" @mouseleave="closeDropdown">
            <button
              class="fei-user-trigger"
              type="button"
              :aria-expanded="showDropdown"
              @click="toggleDropdown"
            >
              <UserAvatar class="fei-avatar--sm" :src="loginUser.userAvatar" alt="" />
              <span>{{ loginUser.userName || '用户' }}</span>
              <svg
                class="fei-user-arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div v-show="showDropdown" class="fei-dropdown">
              <RouterLink class="fei-dropdown__item" to="/profile/records">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                个人主页
              </RouterLink>
              <RouterLink
                v-if="loginUser.userRole === 'admin'"
                class="fei-dropdown__item"
                to="/admin/interfaces"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                后台管理
              </RouterLink>
              <div class="fei-dropdown__divider"></div>
              <button class="fei-dropdown__item fei-dropdown__item--danger" type="button" @click="handleLogoutClick">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                退出登录
              </button>
            </div>
          </div>
        </template>

        <!-- 未登录：登录 / 注册 按钮 -->
        <template v-else>
          <RouterLink class="fei-btn fei-btn--ghost fei-btn--sm" to="/login">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>登录 / 注册</span>
          </RouterLink>
        </template>
      </div>

      <button class="fei-btn fei-btn--secondary fei-mobile-toggle" type="button" @click="$emit('toggle-menu')">
        菜单
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserAvatar from '@/components/UserAvatar.vue';
import type { UserVO } from '@/types/user';

defineProps<{
  loginUser: UserVO | null;
  active: 'home' | 'market' | 'profile' | 'admin' | 'login' | 'register' | 'detail' | 'notfound';
}>();

const emit = defineEmits<{
  (event: 'logout'): void;
  (event: 'toggle-menu'): void;
}>();

/** 下拉菜单显示状态 */
const showDropdown = ref(false);

/** 展开用户下拉菜单 */
const openDropdown = () => {
  showDropdown.value = true;
};

/** 关闭用户下拉菜单 */
const closeDropdown = () => {
  showDropdown.value = false;
};

/** 点击头像区域切换下拉菜单，兼容触屏和自动化测试场景 */
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

/** 触发退出登录并关闭下拉菜单 */
const handleLogoutClick = () => {
  closeDropdown();
  emit('logout');
};
</script>
