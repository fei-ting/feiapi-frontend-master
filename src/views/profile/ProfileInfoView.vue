<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <div>
        <h2 class="fei-section-title">修改个人信息</h2>
      </div>
    </div>
    <div class="fei-card-body">
      <div class="fei-profile-form-grid">
        <section class="fei-profile-form-section">
          <h3 class="fei-profile-form-title">基础资料</h3>
          <form class="fei-form" @submit.prevent="handleProfileSubmit">
            <label class="fei-field">
              <span class="fei-label">昵称</span>
              <input
                v-model.trim="profileForm.userName"
                class="fei-input"
                :class="{ 'fei-input--error': Boolean(nicknameError) }"
                maxlength="16"
                placeholder="请输入昵称"
                autocomplete="nickname"
              />
              <span v-if="nicknameError" class="fei-field-error">{{ nicknameError }}</span>
            </label>
            <label class="fei-field">
              <span class="fei-label">性别</span>
              <select v-model.number="profileForm.gender" class="fei-select">
                <option :value="0">男</option>
                <option :value="1">女</option>
              </select>
            </label>
            <div class="fei-toolbar">
              <button
                class="fei-btn fei-btn--primary"
                type="submit"
                :disabled="profileSubmitting || Boolean(nicknameError)"
              >
                {{ profileSubmitting ? '修改中' : '修改资料' }}
              </button>
            </div>
          </form>
        </section>

        <section class="fei-profile-form-section">
          <h3 class="fei-profile-form-title">修改密码</h3>
          <form class="fei-form" @submit.prevent="handlePasswordSubmit">
            <label class="fei-field">
              <span class="fei-label">旧密码</span>
              <input
                v-model="passwordForm.oldPassword"
                class="fei-input"
                type="password"
                placeholder="请输入旧密码"
                autocomplete="current-password"
              />
            </label>
            <label class="fei-field">
              <span class="fei-label">新密码</span>
              <input
                v-model="passwordForm.newPassword"
                class="fei-input"
                type="password"
                placeholder="8-16位字母和数字"
                autocomplete="new-password"
              />
            </label>
            <label class="fei-field">
              <span class="fei-label">确认密码</span>
              <input
                v-model="passwordForm.checkPassword"
                class="fei-input"
                type="password"
                placeholder="请再次输入新密码"
                autocomplete="new-password"
              />
            </label>
            <div class="fei-toolbar">
              <button class="fei-btn fei-btn--primary" type="submit" :disabled="passwordSubmitting">
                {{ passwordSubmitting ? '修改中' : '修改密码' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import type { UserVO } from '@/types/api';

/**
 * 个人信息页面组件
 * 提供用户资料修改和密码修改功能
 */

const userStore = useUserStore();

/** 个人资料表单 */
const profileForm = reactive({
  userName: '',
  gender: 0 as 0 | 1,
});

/** 密码表单 */
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  checkPassword: '',
});

/** 个人资料提交状态 */
const profileSubmitting = ref(false);

/** 密码提交状态 */
const passwordSubmitting = ref(false);

/** 密码正则：8-16 位字母和数字 */
const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/;

/** 昵称正则：不允许纯空白或特殊符号 */
const nicknamePattern = /^[a-zA-Z0-9一-龥_-]+$/;

/**
 * 昵称校验错误信息
 * 仅在用户输入后校验，初始为空字符串表示未校验
 */
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

/**
 * 获取错误消息
 * @param error 错误对象
 * @param fallback 默认错误消息
 * @returns 错误消息字符串
 */
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

/**
 * 同步个人资料表单
 * @param user 用户信息
 */
const syncProfileForm = (user: UserVO | null) => {
  profileForm.userName = user?.userName || '';
  profileForm.gender = user?.gender === 1 ? 1 : 0;
};

/**
 * 显示 Toast 通知（通过父组件）
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // 通过事件向父组件发送通知
  emit('show-toast', message, type);
};

/** 组件事件 */
const emit = defineEmits<{
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

/**
 * 提交个人资料修改
 */
const handleProfileSubmit = async () => {
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
    await userService.updateCurrentUserProfile({
      userName,
      gender: profileForm.gender,
    });
    showToast('个人信息已更新', 'success');
    await userStore.refreshLoginUser();
  } catch (error) {
    showToast(getErrorMessage(error, '个人信息更新失败'), 'error');
  } finally {
    profileSubmitting.value = false;
  }
};

/**
 * 清空密码表单
 */
const clearPasswordForm = () => {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.checkPassword = '';
};

/**
 * 提交密码修改
 */
const handlePasswordSubmit = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.checkPassword) {
    showToast('请完整填写密码信息', 'error');
    return;
  }
  if (!passwordPattern.test(passwordForm.newPassword)) {
    showToast('新密码需为 8-16 位字母和数字组合', 'error');
    return;
  }
  if (passwordForm.newPassword !== passwordForm.checkPassword) {
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
