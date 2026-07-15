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
            <div class="fei-field">
              <label class="fei-label" for="userAccount">用户名</label>
              <input
                id="userAccount"
                v-model="form.userAccount"
                class="fei-input"
                :class="{ 'fei-input--error': errors.userAccount }"
                placeholder="请输入用户名"
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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';

/**
 * 账号格式正则：4-10 位，第一位必须是字母，只能包含大小写字母和数字
 * 自动排除纯数字（因为第一位必须是字母）
 */
const ACCOUNT_REGEX = /^[a-zA-Z][a-zA-Z0-9]{3,9}$/;
/** 密码格式正则：8-16位，仅大小写字母和数字 */
const PASSWORD_CHAR_REGEX = /^[a-zA-Z0-9]{8,16}$/;
/** 必须包含至少一个字母 */
const LETTER_REGEX = /[a-zA-Z]/;
/** 必须包含至少一个数字 */
const DIGIT_REGEX = /[0-9]/;

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  userAccount: '',
  userPassword: '',
});

/** 各字段的错误提示信息 */
const errors = reactive({
  userAccount: '',
  userPassword: '',
});

/** 各字段的抖动动画状态 */
const shake = reactive({
  userAccount: false,
  userPassword: false,
});

const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, 2200);
};

/**
 * 触发指定字段的抖动动画
 */
const triggerShake = (field: 'userAccount' | 'userPassword') => {
  shake[field] = false;
  requestAnimationFrame(() => {
    shake[field] = true;
  });
};

/**
 * 账号输入时实时校验：任何输入都触发校验，让用户第一时间知道格式规范
 */
const onAccountInput = () => {
  shake.userAccount = false;
  validateAccount();
};

/**
 * 密码输入时实时校验：任何输入都触发校验
 */
const onPasswordInput = () => {
  shake.userPassword = false;
  validatePassword();
};

/**
 * 校验账号格式
 * @returns 是否合法
 */
const validateAccount = (): boolean => {
  const account = form.userAccount.trim();
  if (!account) {
    errors.userAccount = '请输入账号';
    return false;
  }
  if (account.length < 4) {
    errors.userAccount = '账号长度至少 4 位';
    return false;
  }
  if (account.length > 10) {
    errors.userAccount = '账号长度不能超过 10 位';
    return false;
  }
  if (!ACCOUNT_REGEX.test(account)) {
    errors.userAccount = '账号必须以字母开头，只能包含大小写字母和数字';
    return false;
  }
  errors.userAccount = '';
  return true;
};

/**
 * 校验密码格式
 * @returns 是否合法
 */
const validatePassword = (): boolean => {
  const password = form.userPassword;
  if (!password) {
    errors.userPassword = '请输入密码';
    return false;
  }
  if (password.length < 8) {
    errors.userPassword = '密码长度至少 8 位';
    return false;
  }
  if (password.length > 16) {
    errors.userPassword = '密码长度不能超过 16 位';
    return false;
  }
  if (!PASSWORD_CHAR_REGEX.test(password) || !LETTER_REGEX.test(password) || !DIGIT_REGEX.test(password)) {
    errors.userPassword = '密码只能包含大小写字母和数字，且必须同时包含字母和数字';
    return false;
  }
  errors.userPassword = '';
  return true;
};

/**
 * 提交登录表单
 */
const handleSubmit = async () => {
  const isAccountValid = validateAccount();
  const isPasswordValid = validatePassword();

  // 校验不通过时触发抖动动画，不发送请求
  if (!isAccountValid) {
    triggerShake('userAccount');
  }
  if (!isPasswordValid) {
    triggerShake('userPassword');
  }
  if (!isAccountValid || !isPasswordValid) {
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

    // 获取登录用户信息，管理员跳转后台工作台
    try {
      const user = await userService.getLoginUser();
      userStore.setLoginUser(user || null);
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
