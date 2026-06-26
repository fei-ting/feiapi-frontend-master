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
            <a href="#/login">返回登录</a>
            <a href="#/home">返回首页</a>
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

/** 可校验的字段名类型 */
type ValidatableField = 'userAccount' | 'userPassword' | 'checkPassword';

const router = useRouter();

const form = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
});

/** 各字段的错误提示信息 */
const errors = reactive({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
});

/** 各字段的抖动动画状态 */
const shake = reactive({
  userAccount: false,
  userPassword: false,
  checkPassword: false,
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
const triggerShake = (field: ValidatableField) => {
  shake[field] = false;
  requestAnimationFrame(() => {
    shake[field] = true;
  });
};

/**
 * 账号输入时实时校验
 */
const onAccountInput = () => {
  shake.userAccount = false;
  validateAccount();
};

/**
 * 密码输入时实时校验
 */
const onPasswordInput = () => {
  shake.userPassword = false;
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
  shake.checkPassword = false;
  validateCheckPassword();
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
 * 校验确认密码：只校验是否与密码一致，格式规则已在密码字段校验
 * @returns 是否合法
 */
const validateCheckPassword = (): boolean => {
  const checkPassword = form.checkPassword;
  if (!checkPassword) {
    errors.checkPassword = '请输入确认密码';
    return false;
  }
  if (form.userPassword !== checkPassword) {
    errors.checkPassword = '两次输入的密码不一致';
    return false;
  }
  errors.checkPassword = '';
  return true;
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
