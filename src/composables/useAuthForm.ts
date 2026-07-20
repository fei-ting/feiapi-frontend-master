import { computed, getCurrentInstance, nextTick, onBeforeUnmount, reactive } from 'vue';
import { ACCOUNT_PATTERN, AUTH_FIELD_SHAKE_DURATION_MS } from '@/constants/authRules';
import { getPasswordFormatError } from '@/utils/passwordValidation';

/** 认证表单字段。 */
export interface AuthFormState {
  /** 用户账号。 */
  userAccount: string;
  /** 用户密码。 */
  userPassword: string;
  /** 确认密码。 */
  checkPassword: string;
}

/** 认证表单错误字段。 */
export interface AuthFormErrors {
  /** 用户账号错误文本。 */
  userAccount: string;
  /** 用户密码错误文本。 */
  userPassword: string;
  /** 确认密码错误文本。 */
  checkPassword: string;
}

/** 认证表单字段名称。 */
export type AuthFormField = keyof AuthFormErrors;

/** 认证表单字段抖动状态。 */
export interface AuthFormShaking {
  /** 用户账号是否正在抖动。 */
  userAccount: boolean;
  /** 用户密码是否正在抖动。 */
  userPassword: boolean;
  /** 确认密码是否正在抖动。 */
  checkPassword: boolean;
}

/** 认证表单组合式函数配置。 */
export interface AuthFormOptions {
  /** 是否启用确认密码字段。 */
  withCheckPassword?: boolean;
}

/**
 * 认证表单组合式函数。
 * 统一提供登录、注册共用的字段、校验和错误反馈交互。
 *
 * @param options 认证表单配置
 * @returns 认证表单状态和操作方法
 */
export function useAuthForm(options: AuthFormOptions = {}) {
  /** 认证表单值。 */
  const form = reactive<AuthFormState>({
    userAccount: '',
    userPassword: '',
    checkPassword: '',
  });

  /** 认证表单错误。 */
  const errors = reactive<AuthFormErrors>({
    userAccount: '',
    userPassword: '',
    checkPassword: '',
  });

  /** 各字段独立抖动状态。 */
  const shaking = reactive<AuthFormShaking>({
    userAccount: false,
    userPassword: false,
    checkPassword: false,
  });

  /** 各字段抖动清理定时器。 */
  const shakeTimers: Partial<Record<AuthFormField, number>> = {};

  /** 各字段抖动请求版本，用于取消尚未执行的旧回调。 */
  const shakeVersions: Record<AuthFormField, number> = {
    userAccount: 0,
    userPassword: 0,
    checkPassword: 0,
  };

  /** 组合式函数是否已随组件卸载。 */
  let disposed = false;

  /** 是否启用确认密码字段。 */
  const withCheckPassword = computed(() => options.withCheckPassword === true);

  /**
   * 校验账号。
   *
   * @returns 账号是否合法
   */
  const validateAccount = (): boolean => {
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

  /**
   * 校验密码。
   *
   * @returns 密码是否合法
   */
  const validatePassword = (): boolean => {
    const password = form.userPassword;
    if (!password) {
      errors.userPassword = '请输入密码';
      return false;
    }
    const formatError = getPasswordFormatError(password);
    if (formatError) {
      errors.userPassword = formatError;
      return false;
    }
    errors.userPassword = '';
    return true;
  };

  /**
   * 校验确认密码。
   *
   * @returns 确认密码是否合法
   */
  const validateCheckPassword = (): boolean => {
    if (!withCheckPassword.value) {
      errors.checkPassword = '';
      return true;
    }
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

  /**
   * 清理指定字段的抖动定时器。
   *
   * @param field 认证字段名称
   */
  const clearShakeTimer = (field: AuthFormField): void => {
    const timer = shakeTimers[field];
    if (timer !== undefined) {
      window.clearTimeout(timer);
      delete shakeTimers[field];
    }
  };

  /**
   * 触发指定字段的错误抖动。
   *
   * @param field 认证字段名称
   */
  const triggerShake = (field: AuthFormField): void => {
    if (disposed) return;

    clearShakeTimer(field);
    shakeVersions[field] += 1;
    const currentVersion = shakeVersions[field];
    shaking[field] = false;

    void nextTick(() => {
      if (disposed || currentVersion !== shakeVersions[field]) return;

      shaking[field] = true;
      shakeTimers[field] = window.setTimeout(() => {
        if (currentVersion === shakeVersions[field]) {
          shaking[field] = false;
        }
        delete shakeTimers[field];
      }, AUTH_FIELD_SHAKE_DURATION_MS);
    });
  };

  /**
   * 校验完整认证表单并触发全部无效字段反馈。
   *
   * @returns 完整表单是否合法
   */
  const validate = (): boolean => {
    const accountValid = validateAccount();
    const passwordValid = validatePassword();
    const checkPasswordValid = validateCheckPassword();

    if (!accountValid) triggerShake('userAccount');
    if (!passwordValid) triggerShake('userPassword');
    if (!checkPasswordValid) triggerShake('checkPassword');

    return accountValid && passwordValid && checkPasswordValid;
  };

  /** 处理账号输入并实时校验。 */
  const onAccountInput = (): void => {
    validateAccount();
  };

  /** 处理密码输入，并在注册场景同步校验已有的确认密码。 */
  const onPasswordInput = (): void => {
    validatePassword();
    if (withCheckPassword.value && form.checkPassword) {
      validateCheckPassword();
    }
  };

  /** 处理确认密码输入并实时校验。 */
  const onCheckPasswordInput = (): void => {
    validateCheckPassword();
  };

  /** 清空全部表单错误。 */
  const clearErrors = (): void => {
    errors.userAccount = '';
    errors.userPassword = '';
    errors.checkPassword = '';
  };

  /** 清理全部抖动状态和定时器。 */
  const clearShakeState = (): void => {
    disposed = true;
    (Object.keys(shaking) as AuthFormField[]).forEach((field) => {
      shakeVersions[field] += 1;
      clearShakeTimer(field);
      shaking[field] = false;
    });
  };

  if (getCurrentInstance()) {
    onBeforeUnmount(clearShakeState);
  }

  return {
    form,
    errors,
    shaking,
    validateAccount,
    validatePassword,
    validateCheckPassword,
    validate,
    triggerShake,
    onAccountInput,
    onPasswordInput,
    onCheckPasswordInput,
    clearErrors,
  };
}
