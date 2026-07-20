<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <div>
        <h2 class="fei-section-title">修改个人信息</h2>
      </div>
    </div>
    <div class="fei-card-body">
      <div class="fei-profile-form-grid">
        <ProfileForm
          :model-value="profileForm"
          :nickname-error="nicknameError"
          :submitting="profileSubmitting"
          @update:user-name="updateUserName"
          @update:gender="updateGender"
          @submit="handleProfileSubmit"
        />
        <PasswordForm
          :model-value="passwordForm"
          :errors="passwordErrors"
          :submitting="passwordSubmitting"
          @update:old-password="updateOldPassword"
          @update:new-password="updateNewPassword"
          @update:check-password="updateCheckPassword"
          @validate-field="validatePasswordField"
          @submit="handlePasswordSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import PasswordForm from '@/components/profile/PasswordForm.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import type { UserVO } from '@/types/api';
import type { PasswordFormErrors, PasswordFormModel, ProfileFormModel } from '@/types/profile';
import { getPasswordFormatError } from '@/utils/passwordValidation';
const userStore = useUserStore();

/** 个人资料表单。 */
const profileForm = reactive<ProfileFormModel>({ userName: '', gender: 0 });
/** 密码修改表单。 */
const passwordForm = reactive<PasswordFormModel>({ oldPassword: '', newPassword: '', checkPassword: '' });
/** 密码修改表单实时错误。 */
const passwordErrors = reactive<PasswordFormErrors>({ oldPassword: '', newPassword: '', checkPassword: '' });
/** 个人资料提交状态。 */
const profileSubmitting = ref(false);

/** 密码提交状态。 */
const passwordSubmitting = ref(false);

/** 昵称正则，不允许纯空白或特殊符号。 */
const nicknamePattern = /^[a-zA-Z0-9一-龥_-]+$/;

/** 昵称实时校验错误。 */
const nicknameError = computed(() => {
  const value = profileForm.userName.trim();
  if (!value) return '';
  if (value.length < 2 || value.length > 16) {
    return '昵称长度应为 2-16 个字符';
  }
  if (!nicknamePattern.test(value)) {
    return '昵称包含不允许使用的内容';
  }
  return '';
});

/** 个人信息页面事件。 */
const emit = defineEmits<{
  /** 将 Toast 通知交给父布局展示。 */
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

/**
 * 获取可展示的异常消息。
 *
 * @param error 错误对象
 * @param fallback 默认错误消息
 * @returns 可展示的错误文本
 */
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/**
 * 显示 Toast 通知。
 *
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info'): void => {
  emit('show-toast', message, type);
};

/** 同步当前登录用户的个人资料。 */
const syncProfileForm = (user: UserVO | null): void => {
  Object.assign(profileForm, { userName: user?.userName || '', gender: user?.gender === 1 ? 1 : 0 });
};

/** 更新昵称。 */
const updateUserName = (value: string): void => { profileForm.userName = value; };

/** 更新性别。 */
const updateGender = (value: 0 | 1): void => { profileForm.gender = value; };

/** 更新旧密码并实时校验必填。 */
const updateOldPassword = (value: string): void => {
  passwordForm.oldPassword = value;
  validateOldPassword();
};

/** 更新新密码并实时校验格式和确认密码。 */
const updateNewPassword = (value: string): void => {
  passwordForm.newPassword = value;
  validateNewPassword();
  if (passwordForm.checkPassword) {
    validateCheckPassword();
  }
};

/** 更新确认密码并实时校验一致性。 */
const updateCheckPassword = (value: string): void => {
  passwordForm.checkPassword = value;
  validateCheckPassword();
};

/** 校验旧密码必填，不校验格式。 */
const validateOldPassword = (): boolean => {
  passwordErrors.oldPassword = passwordForm.oldPassword ? '' : '请输入旧密码';
  return !passwordErrors.oldPassword;
};

/** 校验新密码必填和共享格式规则。 */
const validateNewPassword = (): boolean => {
  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = '请输入新密码';
  } else {
    passwordErrors.newPassword = getPasswordFormatError(passwordForm.newPassword);
  }
  return !passwordErrors.newPassword;
};

/** 校验确认密码必填及其与新密码的一致性。 */
const validateCheckPassword = (): boolean => {
  if (!passwordForm.checkPassword) {
    passwordErrors.checkPassword = '请再次输入新密码';
  } else if (passwordForm.newPassword !== passwordForm.checkPassword) {
    passwordErrors.checkPassword = '两次输入的新密码不一致';
  } else {
    passwordErrors.checkPassword = '';
  }
  return !passwordErrors.checkPassword;
};

/** 校验密码表单的指定字段。 */
const validatePasswordField = (field: keyof PasswordFormModel): void => {
  if (field === 'oldPassword') {
    validateOldPassword();
  } else if (field === 'newPassword') {
    validateNewPassword();
  } else {
    validateCheckPassword();
  }
};

/** 提交个人资料修改。 */
const handleProfileSubmit = async (): Promise<void> => {
  const userName = profileForm.userName.trim();
  if (nicknameError.value) {
    showToast(nicknameError.value, 'error');
    return;
  }
  if (![0, 1].includes(profileForm.gender)) {
    showToast('请选择正确的性别', 'error');
    return;
  }
  profileSubmitting.value = true;
  try {
    await userService.updateCurrentUserProfile({ userName, gender: profileForm.gender });
    showToast('个人信息已更新', 'success');
    await userStore.refreshLoginUser();
  } catch (error) {
    showToast(getErrorMessage(error, '个人信息更新失败'), 'error');
  } finally {
    profileSubmitting.value = false;
  }
};

/** 清空密码表单和实时错误。 */
const clearPasswordForm = (): void => {
  Object.assign(passwordForm, { oldPassword: '', newPassword: '', checkPassword: '' });
  Object.assign(passwordErrors, { oldPassword: '', newPassword: '', checkPassword: '' });
};

/** 提交密码修改。 */
const handlePasswordSubmit = async (): Promise<void> => {
  const oldPasswordValid = validateOldPassword();
  const newPasswordValid = validateNewPassword();
  const checkPasswordValid = validateCheckPassword();

  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.checkPassword) {
    showToast('请完整填写密码信息', 'error');
    return;
  }
  if (!oldPasswordValid || !newPasswordValid) {
    showToast('新密码需为 8-16 位字母和数字组合', 'error');
    return;
  }
  if (!checkPasswordValid) {
    showToast('两次输入的新密码不一致', 'error');
    return;
  }
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    showToast('新密码不能与旧密码相同', 'error');
    return;
  }

  passwordSubmitting.value = true;
  try {
    await userService.updateCurrentUserPassword({ ...passwordForm });
    clearPasswordForm();
    showToast('密码已修改', 'success');
  } catch (error) {
    showToast(getErrorMessage(error, '密码修改失败'), 'error');
  } finally {
    passwordSubmitting.value = false;
  }
};

watch(
  () => userStore.loginUser,
  (user) => syncProfileForm(user),
  { immediate: true },
);
</script>
