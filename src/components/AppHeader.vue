<template>
  <header class="fei-header">
    <div class="fei-container fei-header__inner">
      <a class="fei-brand" href="#/home" aria-label="FeiAPI 首页">
        <span class="fei-brand__icon">F</span>
        <span>FeiAPI</span>
      </a>

      <nav class="fei-nav" aria-label="主导航">
        <a class="fei-nav__link" :class="{ 'is-active': active === 'home' }" href="#/home">接口广场</a>
        <a class="fei-nav__link" :class="{ 'is-active': active === 'profile' }" href="#/profile/records"
          >我的调用</a
        >
        <a
          v-if="loginUser?.userRole === 'admin'"
          class="fei-nav__link"
          :class="{ 'is-active': active === 'admin' }"
          href="#/admin/interfaces"
          >后台管理</a
        >
      </nav>

      <div class="fei-nav__actions">
        <template v-if="loginUser">
          <div class="fei-user">
            <img class="fei-avatar" :src="loginUser.userAvatar || defaultAvatar" alt="" />
            <span class="fei-tag fei-tag--online">{{ loginUser.userRole === 'admin' ? '管理员' : '用户' }}</span>
            <button class="fei-btn fei-btn--secondary" type="button" @click="$emit('logout')">退出登录</button>
          </div>
        </template>
        <template v-else>
          <a class="fei-btn fei-btn--secondary" href="#/login">登录</a>
          <a class="fei-btn fei-btn--primary" href="#/register">注册</a>
        </template>
      </div>

      <button class="fei-btn fei-btn--secondary fei-mobile-toggle" type="button" @click="$emit('toggle-menu')">
        菜单
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { UserVO } from '@/types/api';

defineProps<{
  loginUser: UserVO | null;
  active: 'home' | 'profile' | 'admin' | 'login' | 'register' | 'detail' | 'notfound';
}>();

defineEmits<{
  (event: 'logout'): void;
  (event: 'toggle-menu'): void;
}>();

const defaultAvatar =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=feiapi';
</script>
