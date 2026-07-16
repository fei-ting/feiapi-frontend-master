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
            <div class="fei-field">
              <label class="fei-label" for="userAccount">用户名</label>
              <input
                id="userAccount"
                v-model="form.userAccount"
                class="fei-input"
                :class="{ 'fei-input--error': errors.userAccount }"
                placeholder="请输入账号"
                @blur="validateAccount"
                @input="onAccountInput"
              />
              <span
                v-if="errors.userAccount"
                class="fei-field-error"
                :class="{ 'fei-field-error--shake': shake.userAccount }"
              >
                {{ errors.userAccount }}
              </span>
            </div>
            <div class="fei-field">
              <label class="fei-label" for="userPassword">密码</label>
              <input
                id="userPassword"
                v-model="form.userPassword"
                class="fei-input"
                :class="{ 'fei-input--error': errors.userPassword }"
                type="password"
                placeholder="请输入密码"
                @blur="validatePassword"
                @input="onPasswordInput"
              />
              <span
                v-if="errors.userPassword"
                class="fei-field-error"
                :class="{ 'fei-field-error--shake': shake.userPassword }"
              >
                {{ errors.userPassword }}
              </span>
            </div>
            <div class="fei-field">
              <label class="fei-label" for="checkPassword">确认密码</label>
              <input
                id="checkPassword"
                v-model="form.checkPassword"
                class="fei-input"
                :class="{ 'fei-input--error': errors.checkPassword }"
                type="password"
                placeholder="请确认密码"
                @blur="validateCheckPassword"
                @input="onCheckPasswordInput"
              />
              <span
                v-if="errors.checkPassword"
                class="fei-field-error"
                :class="{ 'fei-field-error--shake': shake.checkPassword }"
              >
                {{ errors.checkPassword }}
              </span>
            </div>
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
import { userService } from '@/services/user';
import { useAuthForm } from '@/composables/useAuthForm';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { form, errors, shakingField, validateAccount, validatePassword, validateCheckPassword } = useAuthForm({ withCheckPassword: true });
const { toast, showToast } = useToast(2200);

/** 各字段的抖动状态，保持注册页原有模板契约 */
const shake = {
  get userAccount() { return shakingField.value === 'userAccount'; },
  get userPassword() { return shakingField.value === 'userPassword'; },
  get checkPassword() { return shakingField.value === 'checkPassword'; },
};

/** 触发指定字段的抖动动画 */
const triggerShake = (field: 'userAccount' | 'userPassword' | 'checkPassword') => {
  shakingField.value = '';
  requestAnimationFrame(() => {
    shakingField.value = field;
  });
};

/**
 * 账号输入时实时校验
 */
const onAccountInput = () => {
  validateAccount();
};

/**
 * 密码输入时实时校验
 */
const onPasswordInput = () => {
  validatePassword();
  // 密码变化时，如果确认密码已有内容，同步校验确认密码
  if (form.checkPassword) {
    validateCheckPassword();
  }
};

/**
 * 确认密码输入时实时校验
 */
const onCheckPasswordInput = () => {
  validateCheckPassword();
};

/**
 * 提交注册表单
 */
const handleSubmit = async () => {
  const isAccountValid = validateAccount();
  const isPasswordValid = validatePassword();
  const isCheckPasswordValid = validateCheckPassword();

  // 校验不通过时触发对应字段的抖动动画，不发送请求
  if (!isAccountValid) {
    triggerShake('userAccount');
  }
  if (!isPasswordValid) {
    triggerShake('userPassword');
  }
  if (!isCheckPasswordValid) {
    triggerShake('checkPassword');
  }
  if (!isAccountValid || !isPasswordValid || !isCheckPasswordValid) {
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

<style scoped>
/* 输入框错误状态 */
.fei-input--error {
  border-color: var(--fei-error);
}

.fei-input--error:focus {
  border-color: var(--fei-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

/* 错误提示文字 */
.fei-field-error {
  display: block;
  font-size: 13px;
  color: var(--fei-error);
  line-height: 1.5;
}

/* 抖动动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.fei-field-error--shake {
  animation: shake 0.4s ease-in-out;
}
</style>
