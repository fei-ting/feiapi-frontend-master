import { computed, reactive, ref } from 'vue';

/** 认证表单字段 */
export interface AuthFormState {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

/** 认证表单错误字段 */
export interface AuthFormErrors {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

const ACCOUNT_PATTERN = /^[a-zA-Z][a-zA-Z0-9]{3,9}$/;
const PASSWORD_LETTER_PATTERN = /[a-zA-Z]/;
const PASSWORD_DIGIT_PATTERN = /\d/;

/**
 * 认证表单组合式函数
 * 统一提供登录、注册共用的账号密码字段及校验逻辑
 */
export function useAuthForm(options: { withCheckPassword?: boolean } = {}) {
  const form = reactive<AuthFormState>({
    userAccount: '',
    userPassword: '',
    checkPassword: '',
  });
  const errors = reactive<AuthFormErrors>({
    userAccount: '',
    userPassword: '',
    checkPassword: '',
  });
  const shakingField = ref<keyof AuthFormErrors | ''>('');
  const withCheckPassword = computed(() => options.withCheckPassword === true);

  /** 校验账号 */
  const validateAccount = () => {
    const account = form.userAccount.trim();
    if (!account) {
      errors.userAccount = '请输入账号';
      return false;
    }
    if (!ACCOUNT_PATTERN.test(account)) {
      errors.userAccount = '账号必须以字母开头，只能包含大小写字母和数字';
      return false;
    }
    errors.userAccount = '';
    return true;
  };

  /** 校验密码 */
  const validatePassword = () => {
    const password = form.userPassword;
    if (!password) {
      errors.userPassword = '请输入密码';
      return false;
    }
    if (password.length < 8 || password.length > 16) {
      errors.userPassword = '密码长度应为 8-16 位';
      return false;
    }
    if (!PASSWORD_LETTER_PATTERN.test(password) || !PASSWORD_DIGIT_PATTERN.test(password) || !/^[a-zA-Z\d]+$/.test(password)) {
      errors.userPassword = '密码只能包含字母和数字，且必须同时包含字母和数字';
      return false;
    }
    errors.userPassword = '';
    return true;
  };

  /** 校验确认密码 */
  const validateCheckPassword = () => {
    if (!withCheckPassword.value) return true;
    if (!form.checkPassword) {
      errors.checkPassword = '请再次输入密码';
      return false;
    }
    if (form.userPassword !== form.checkPassword) {
      errors.checkPassword = '两次输入的密码不一致';
      return false;
    }
    errors.checkPassword = '';
    return true;
  };

  /** 校验完整认证表单 */
  const validate = () => validateAccount() && validatePassword() && validateCheckPassword();

  /** 触发表单错误抖动 */
  const triggerShake = (field: keyof AuthFormErrors) => {
    shakingField.value = field;
    window.setTimeout(() => {
      if (shakingField.value === field) shakingField.value = '';
    }, 400);
  };

  /** 清空表单错误 */
  const clearErrors = () => {
    errors.userAccount = '';
    errors.userPassword = '';
    errors.checkPassword = '';
  };

  return { form, errors, shakingField, validateAccount, validatePassword, validateCheckPassword, validate, triggerShake, clearErrors };
}
