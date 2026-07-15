<template>
  <div class="fei-app-shell">
    <AppHeader
      :login-user="userStore.loginUser"
      :active="active"
      @logout="handleLogout"
      @toggle-menu="toggleMenu"
    />

    <main class="fei-container fei-page">
      <slot />
    </main>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';

/**
 * 应用公共布局组件
 * 统一管理页头、页脚、用户会话和 Toast 通知
 */

/** 组件属性 */
interface AppLayoutProps {
  /** 当前活动的导航项 */
  active: 'home' | 'market' | 'profile' | 'admin' | 'login' | 'register' | 'detail' | 'notfound';
}

const props = defineProps<AppLayoutProps>();

const router = useRouter();
const userStore = useUserStore();

/** Toast 通知状态 */
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

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
 * 处理退出登录
 */
const handleLogout = async () => {
  try {
    await userService.logout();
    userStore.clearLoginUser();
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

onMounted(async () => {
  await userStore.fetchLoginUser();
});
</script>
