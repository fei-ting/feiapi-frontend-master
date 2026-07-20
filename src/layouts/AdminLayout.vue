<template>
  <div class="fei-app-shell">
    <AppHeader
      :login-user="userStore.loginUser"
      active="admin"
      @logout="handleLogout"
      @toggle-menu="toggleMenu"
    />

    <PageContainer>
      <div class="fei-admin-layout">
        <!-- 桌面端和移动端共用同一组导航，布局由 CSS 响应式切换 -->
        <nav class="fei-admin-navigation" aria-label="管理后台导航">
          <RouterLink
            v-for="item in adminNavItems"
            :key="item.key"
            class="fei-admin-navigation__link"
            :class="{ 'is-active': activeTab === item.key }"
            :to="`/admin/${item.key}`"
          >
            <component :is="item.icon" class="fei-admin-navigation__icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <!-- 内容区 -->
        <div class="fei-admin-content">
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
 * 后台管理布局组件
 * 统一管理后台导航、页头、页脚、用户会话和 Toast 通知
 */

/** 导航项配置 */
interface AdminNavItem {
  key: string;
  label: string;
  icon: () => ReturnType<typeof h>;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { toast, showToast } = useToast();

/** 当前后台导航项 */
const activeTab = computed(() => route.path.split('/')[2] || 'dashboard');

/** 后台导航项 */
const adminNavItems: AdminNavItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
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
      h('rect', { x: '3', y: '3', width: '7', height: '7' }),
      h('rect', { x: '14', y: '3', width: '7', height: '7' }),
      h('rect', { x: '14', y: '14', width: '7', height: '7' }),
      h('rect', { x: '3', y: '14', width: '7', height: '7' }),
    ]),
  },
  {
    key: 'interfaces',
    label: '接口管理',
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
      h('path', { d: 'M4 17.5 10 20l10-8-6-2.5' }),
      h('path', { d: 'M4 12.5 10 15l10-8-10-3-6 4.5 6 2.5' }),
    ]),
  },
  {
    key: 'quotas',
    label: '配额策略',
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
      h('path', { d: 'M12 20V10' }),
      h('path', { d: 'M18 20V4' }),
      h('path', { d: 'M6 20v-4' }),
    ]),
  },
];

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

// 暴露方法给子组件使用
defineExpose({
  showToast,
});
</script>
