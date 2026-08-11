<template>
  <main class="fei-auth-page">
    <section class="fei-auth-card fei-auth-card--register" aria-labelledby="register-title">
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

      <h1 id="register-title" class="fei-auth-title">创建账户</h1>
      <div class="fei-auth-mode">账户密码注册</div>

      <form class="fei-form fei-auth-form" @submit.prevent="handleSubmit">
        <AuthField
          id="userAccount"
          v-model="form.userAccount"
          icon="user"
          label="用户名"
          placeholder="请输入账号"
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
        <AuthField
          id="checkPassword"
          v-model="form.checkPassword"
          icon="lock"
          label="确认密码"
          type="password"
          placeholder="请确认密码"
          :error="errors.checkPassword"
          :shaking="shaking.checkPassword"
          @blur="validateCheckPassword"
          @input="onCheckPasswordInput"
        />
        <button class="fei-btn fei-btn--primary fei-auth-submit" type="submit">注册</button>
      </form>

      <div class="fei-auth-links">
        <span>已经拥有账户？ <RouterLink to="/login">返回登录</RouterLink></span>
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
import { useAuthForm } from '@/composables/useAuthForm';
import { useToast } from '@/composables/useToast';
import '@/styles/pages/auth.css';

const router = useRouter();
const {
  form,
  errors,
  shaking,
  validateAccount,
  validatePassword,
  validateCheckPassword,
  validate,
  onAccountInput,
  onPasswordInput,
  onCheckPasswordInput,
} = useAuthForm({ withCheckPassword: true });
const { toast, showToast } = useToast(2200);

/**
 * 提交注册表单
 */
const handleSubmit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await userService.register({
      userAccount: form.userAccount.trim(),
      userPassword: form.userPassword,
      checkPassword: form.checkPassword,
    });
    showToast('注册成功', 'success');
    // 延迟跳转，让用户看到成功提示
    await new Promise(resolve => setTimeout(resolve, 1200));
    await router.push('/login');
  } catch (error) {
    // 根据后端错误码映射用户友好的提示信息
    const err = error as Error & { code?: number };
    let message = '注册失败，请稍后重试';
    if (err.code === 40000) {
      // 注册时 40000 可能是"账号已存在"等业务错误，直接展示后端信息帮助用户定位
      message = err.message || '请检查输入内容是否符合要求';
    }
    showToast(message, 'error');
  }
};
</script>
