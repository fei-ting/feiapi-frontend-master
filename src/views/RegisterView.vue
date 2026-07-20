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
            <button class="fei-tab is-active" type="button">账户密码注册</button>
          </div>

          <form class="fei-form" @submit.prevent="handleSubmit">
            <AuthField
              id="userAccount"
              v-model="form.userAccount"
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
              label="确认密码"
              type="password"
              placeholder="请确认密码"
              :error="errors.checkPassword"
              :shaking="shaking.checkPassword"
              @blur="validateCheckPassword"
              @input="onCheckPasswordInput"
            />
            <button class="fei-btn fei-btn--primary" type="submit">注册</button>
          </form>

          <div class="fei-toolbar" style="margin-top: 18px; justify-content: space-between">
            <RouterLink to="/login">返回登录</RouterLink>
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
import { useAuthForm } from '@/composables/useAuthForm';
import { useToast } from '@/composables/useToast';

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
