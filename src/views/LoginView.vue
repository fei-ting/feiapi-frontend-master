<template>
  <div class="fei-app-shell">
    <div class="fei-page" style="display: flex; align-items: center; min-height: calc(100vh - 64px)">
      <div class="fei-container" style="max-width: 480px">
        <div class="fei-panel">
          <div class="fei-empty" style="padding: 0 0 24px">
            <h1 class="fei-detail__title" style="font-size: 28px; margin-bottom: 8px">FeiAPI</h1>
            <p class="fei-section-desc">API 开放平台</p>
          </div>

          <div class="fei-tabbar">
            <button class="fei-tab is-active" type="button">账户密码登录</button>
          </div>

          <form class="fei-form" @submit.prevent="handleSubmit">
            <AuthField
              id="userAccount"
              v-model="form.userAccount"
              label="用户名"
              placeholder="请输入用户名"
              :error="errors.userAccount"
              :shaking="shaking.userAccount"
              @blur="validateAccount"
              @input="onAccountInput"
            />
            <AuthField
              id="userPassword"
              v-model="form.userPassword"
              label="密码"
              type="password"
              placeholder="请输入密码"
              :error="errors.userPassword"
              :shaking="shaking.userPassword"
              @blur="validatePassword"
              @input="onPasswordInput"
            />
            <button class="fei-btn fei-btn--primary" type="submit">登录</button>
          </form>

          <div class="fei-toolbar" style="margin-top: 18px; justify-content: space-between">
            <RouterLink to="/register">新用户注册</RouterLink>
            <RouterLink to="/home">返回首页</RouterLink>
          </div>
        </div>
      </div>
    </div>
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ToastMessage from '@/components/ToastMessage.vue';
import AuthField from '@/components/auth/AuthField.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { useAuthForm } from '@/composables/useAuthForm';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const userStore = useUserStore();
const {
  form,
  errors,
  shaking,
  validateAccount,
  validatePassword,
  validate,
  onAccountInput,
  onPasswordInput,
} = useAuthForm();
const { toast, showToast } = useToast(2200);

/**
 * 提交登录表单
 */
const handleSubmit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await userService.login({
      userAccount: form.userAccount.trim(),
      userPassword: form.userPassword,
    });
    showToast('登录成功', 'success');

    // 延迟跳转，让用户看到成功提示
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 刷新统一会话状态，管理员跳转后台工作台
    try {
      const user = await userStore.refreshLoginUser();
      if (user?.userRole === 'admin') {
        await router.push('/admin/dashboard');
        return;
      }
    } catch {
      // 获取用户信息失败时使用默认跳转
    }

    await router.push('/home');
  } catch (error) {
    // 根据后端错误码映射用户友好的提示信息
    const loginError = error as Error & { code?: number; message?: string };
    const code = loginError.code;
    let message = loginError.message || '登录失败，请稍后重试';
    if (code === 40000 && !loginError.message) {
      message = '账号或密码不正确，请检查后重试';
    } else if (code === 40300) {
      message = '登录失败次数过多，请稍后再试';
    }
    showToast(message, 'error');
  }
};
</script>
