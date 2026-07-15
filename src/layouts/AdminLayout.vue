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
          <slot @show-toast="handleShowToast" />
        </div>
      </div>
    </PageContainer>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { h } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import type { UserVO } from '@/types/api';

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

/** 组件属性 */
interface AdminLayoutProps {
  /** 当前活动的标签页 */
  activeTab?: string;
}

const props = withDefaults(defineProps<AdminLayoutProps>(), {
  activeTab: 'dashboard',
});

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

/** Toast 通知状态 */
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

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
 * 显示 Toast 通知
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, 2400);
};

/**
 * 加载当前登录用户
 * 使用用户 Store 统一管理会话状态
 */
const loadLoginUser = async () => {
  try {
    const user = await userStore.fetchLoginUser();

    // 检查管理员权限
    if (!user || user.userRole !== 'admin') {
      showToast('无权访问后台管理', 'error');
      router.replace('/home');
    }
  } catch {
    showToast('加载用户信息失败', 'error');
    router.replace('/home');
  }
};

/**
 * 处理退出登录
 */
const handleLogout = async () => {
  try {
    await userService.logout();
    userStore.clearLoginUser();
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
 * 处理子组件的 Toast 事件
 * @param message 通知消息
 * @param type 通知类型
 */
const handleShowToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  showToast(message, type);
};

// 暴露方法给子组件使用
defineExpose({
  showToast,
  loadLoginUser,
});

onMounted(async () => {
  await loadLoginUser();
});
</script>
