<template>
  <div class="fei-app-shell">
    <AppHeader
      :login-user="userStore.loginUser"
      active="profile"
      @logout="handleLogout"
      @toggle-menu="toggleMenu"
    />

    <PageContainer>
      <!-- 个人信息头部卡片 -->
      <div v-if="userStore.loginUser" class="fei-profile-header">
        <img
          class="fei-profile-avatar"
          :src="userStore.loginUser.userAvatar || defaultAvatar"
          :alt="userStore.loginUser.userName || '用户'"
        />
        <div class="fei-profile-info">
          <h1 class="fei-profile-name">{{ userStore.loginUser.userName || '未设置昵称' }}</h1>
          <p class="fei-profile-account">账号：{{ userStore.loginUser.userAccount }}</p>
          <div class="fei-profile-meta">
            <span class="fei-user-role-badge">
              {{ userStore.loginUser.userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
            <span>ID: {{ userStore.loginUser.id }}</span>
            <span>性别：{{ genderText }}</span>
          </div>
        </div>
      </div>

      <!-- 侧边栏 + 内容区布局 -->
      <div class="fei-admin-layout">
        <!-- 桌面端侧边栏 -->
        <aside class="fei-admin-sidebar">
          <div class="fei-card">
            <nav class="fei-admin-sidebar-nav" style="padding: 8px">
              <RouterLink
                v-for="item in profileNavItems"
                :key="item.key"
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === item.key }"
                :to="`/profile/${item.key}`"
              >
                <component :is="item.icon" class="fei-admin-navigation__icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </RouterLink>
            </nav>
          </div>
        </aside>

        <!-- 内容区 -->
        <div class="fei-admin-content">
          <!-- 移动端 Tab 导航 -->
          <div class="fei-admin-tabs">
            <button
              v-for="item in profileNavItems"
              :key="item.key"
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === item.key }"
              @click="switchTab(item.key)"
            >
              {{ item.label }}
            </button>
          </div>

          <!-- 内容插槽 -->
          <RouterView v-slot="{ Component }">
            <ErrorBoundary>
              <component :is="Component" @show-toast="showToast" />
            </ErrorBoundary>
          </RouterView>
        </div>
      </div>
    </PageContainer>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { useToast } from '@/composables/useToast';
import { useUserStore } from '@/stores/user';

/**
 * 个人中心布局组件
 * 统一管理个人中心导航、页头、页脚、用户会话和 Toast 通知
 */

/** 导航项配置 */
interface ProfileNavItem {
  key: string;
  label: string;
  icon: () => ReturnType<typeof h>;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { toast, showToast } = useToast();

/** 当前个人中心导航项 */
const activeTab = computed(() => route.path.split('/')[2] || 'info');

/** 默认头像地址 */
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=feiapi';

/** 个人中心导航项 */
const profileNavItems: ProfileNavItem[] = [
  {
    key: 'info',
    label: '个人信息',
    icon: () => h('svg', {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
      h('circle', { cx: '12', cy: '7', r: '4' }),
    ]),
  },
  {
    key: 'records',
    label: '我的额度/调用',
    icon: () => h('svg', {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
      h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
    ]),
  },
  {
    key: 'keys',
    label: '密钥管理',
    icon: () => h('svg', {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('path', { d: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' }),
    ]),
  },
];

/** 性别文本 */
const genderText = computed(() => {
  if (!userStore.loginUser) return '未设置';
  const gender = userStore.loginUser.gender;
  if (gender === 0) return '男';
  if (gender === 1) return '女';
  return '未设置';
});

/**
 * 处理退出登录
 */
const handleLogout = async () => {
  try {
    await userStore.logout();
    showToast('已安全退出', 'success');
    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  } catch {
    showToast('退出失败', 'error');
  }
};

/**
 * 切换移动端菜单（占位实现）
 */
const toggleMenu = () => {
  showToast('移动端菜单已保留为简洁模式', 'info');
};

/**
 * 切换标签页
 * @param tab 标签页名称
 */
const switchTab = (tab: string) => {
  router.push(`/profile/${tab}`);
};

// 暴露方法给子组件使用
defineExpose({
  showToast,
});
</script>
