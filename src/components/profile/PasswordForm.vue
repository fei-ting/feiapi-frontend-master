<template>
  <section class="fei-profile-form-section">
    <h3 class="fei-profile-form-title">修改密码</h3>
    <form class="fei-form" @submit.prevent="submitForm">
      <label class="fei-field">
        <span class="fei-label">旧密码</span>
        <input
          class="fei-input"
          :class="{ 'fei-input--error': Boolean(errors.oldPassword) }"
          type="password"
          :value="modelValue.oldPassword"
          placeholder="请输入旧密码"
          autocomplete="current-password"
          @input="updateOldPassword"
          @blur="validateField('oldPassword')"
        />
        <span v-if="errors.oldPassword" class="fei-field-error">{{ errors.oldPassword }}</span>
      </label>
      <label class="fei-field">
        <span class="fei-label">新密码</span>
        <input
          class="fei-input"
          :class="{ 'fei-input--error': Boolean(errors.newPassword) }"
          type="password"
          :value="modelValue.newPassword"
          placeholder="8-16位字母和数字"
          autocomplete="new-password"
          @input="updateNewPassword"
          @blur="validateField('newPassword')"
        />
        <span v-if="errors.newPassword" class="fei-field-error">{{ errors.newPassword }}</span>
      </label>
      <label class="fei-field">
        <span class="fei-label">确认密码</span>
        <input
          class="fei-input"
          :class="{ 'fei-input--error': Boolean(errors.checkPassword) }"
          type="password"
          :value="modelValue.checkPassword"
          placeholder="请再次输入新密码"
          autocomplete="new-password"
          @input="updateCheckPassword"
          @blur="validateField('checkPassword')"
        />
        <span v-if="errors.checkPassword" class="fei-field-error">{{ errors.checkPassword }}</span>
      </label>
      <div class="fei-toolbar">
        <button class="fei-btn fei-btn--primary" type="submit" :disabled="submitting">
          {{ submitting ? '修改中' : '修改密码' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { PasswordFormErrors, PasswordFormModel } from '@/types/profile';

/** 密码修改表单组件属性。 */
interface PasswordFormProps {
  /** 当前密码表单值。 */
  modelValue: PasswordFormModel;
  /** 当前密码表单错误。 */
  errors: PasswordFormErrors;
  /** 是否正在提交密码。 */
  submitting: boolean;
}

/** 密码修改表单组件事件。 */
interface PasswordFormEmits {
  /** 更新当前密码。 */
  (event: 'update:oldPassword', value: string): void;
  /** 更新新密码。 */
  (event: 'update:newPassword', value: string): void;
  /** 更新确认密码。 */
  (event: 'update:checkPassword', value: string): void;
  /** 请求父页面校验指定字段。 */
  (event: 'validate-field', field: keyof PasswordFormModel): void;
  /** 提交密码修改。 */
  (event: 'submit'): void;
}

defineProps<PasswordFormProps>();
const emit = defineEmits<PasswordFormEmits>();

/** 更新当前密码。 */
const updateOldPassword = (event: Event): void => {
  emit('update:oldPassword', (event.target as HTMLInputElement).value);
};

/** 更新新密码。 */
const updateNewPassword = (event: Event): void => {
  emit('update:newPassword', (event.target as HTMLInputElement).value);
};

/** 更新确认密码。 */
const updateCheckPassword = (event: Event): void => {
  emit('update:checkPassword', (event.target as HTMLInputElement).value);
};

/** 请求父页面校验指定字段。 */
const validateField = (field: keyof PasswordFormModel): void => {
  emit('validate-field', field);
};

/** 请求父页面提交密码修改。 */
const submitForm = (): void => {
  emit('submit');
};
</script>

<style scoped>
.fei-input--error {
  border-color: var(--fei-error);
}

.fei-input--error:focus {
  border-color: var(--fei-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

.fei-field-error {
  display: block;
  color: var(--fei-error);
  font-size: 13px;
  line-height: 1.5;
}
</style>
