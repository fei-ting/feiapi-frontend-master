<template>
  <main class="fei-auth-page">
    <section class="fei-auth-card" aria-labelledby="login-title">
      <RouterLink class="fei-auth-brand" to="/home" aria-label="FeiAPI 首页">
        <span class="fei-auth-brand__icon" aria-hidden="true">
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
        </span>
        <span>FeiAPI</span>
      </RouterLink>

      <h1 id="login-title" class="fei-auth-title">欢迎回来</h1>
      <div class="fei-auth-mode">账户密码登录</div>

      <form class="fei-form fei-auth-form" @submit.prevent="handleSubmit">
        <AuthField
          id="userAccount"
          v-model="form.userAccount"
          icon="user"
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
          icon="lock"
          label="密码"
          type="password"
          placeholder="请输入密码"
          :error="errors.userPassword"
          :shaking="shaking.userPassword"
          @blur="validatePassword"
          @input="onPasswordInput"
        />
        <button class="fei-btn fei-btn--primary fei-auth-submit" type="submit">登录</button>
      </form>

      <div class="fei-auth-links">
        <span>还没有账户？ <RouterLink to="/register">新用户注册</RouterLink></span>
        <RouterLink class="fei-auth-links__home" to="/home">返回首页</RouterLink>
      </div>
      <p class="fei-auth-footer">FeiAPI 在线接口开放平台</p>
    </section>
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ToastMessage from '@/components/ToastMessage.vue';
import AuthField from '@/components/auth/AuthField.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { useAuthForm } from '@/composables/useAuthForm';
import { useToast } from '@/composables/useToast';
import '@/styles/pages/auth.css';

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
