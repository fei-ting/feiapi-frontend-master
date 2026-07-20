<template>
  <div class="fei-app-shell">
    <AppHeader
      :login-user="userStore.loginUser"
      :active="active"
      @logout="handleLogout"
      @toggle-menu="toggleMenu"
    />

    <main class="fei-container fei-page">
      <RouterView v-slot="{ Component }">
        <ErrorBoundary>
          <component :is="Component" @show-toast="showToast" />
        </ErrorBoundary>
      </RouterView>
    </main>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { useToast } from '@/composables/useToast';
import { useUserStore } from '@/stores/user';

/**
 * 应用公共布局组件
 * 统一管理页头、页脚、用户会话和 Toast 通知
 */

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { toast, showToast } = useToast();

/** 当前主导航项 */
const active = computed<'home' | 'market'>(() => (
  route.path === '/home' ? 'home' : 'market'
));

/**
 * 处理退出登录
 */
const handleLogout = async () => {
  try {
    await userStore.logout();
    showToast('已安全退出', 'success');
    // 延迟跳转到首页，让用户看到提示
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
