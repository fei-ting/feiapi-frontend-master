<template>
  <section class="fei-profile-form-section">
    <h3 class="fei-profile-form-title">基础资料</h3>
    <form class="fei-form" @submit.prevent="submitForm">
      <label class="fei-field">
        <span class="fei-label">昵称</span>
        <input
          class="fei-input"
          :class="{ 'fei-input--error': Boolean(nicknameError) }"
          :value="modelValue.userName"
          maxlength="16"
          placeholder="请输入昵称"
          autocomplete="nickname"
          @input="updateUserName"
        />
        <span v-if="nicknameError" class="fei-field-error">{{ nicknameError }}</span>
      </label>
      <label class="fei-field">
        <span class="fei-label">性别</span>
        <select class="fei-select" :value="modelValue.gender" @change="updateGender">
          <option :value="0">男</option>
          <option :value="1">女</option>
        </select>
      </label>
      <div class="fei-toolbar">
        <button
          class="fei-btn fei-btn--primary"
          type="submit"
          :disabled="submitting || Boolean(nicknameError)"
        >
          {{ submitting ? '修改中' : '修改资料' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { ProfileFormModel } from '@/types/profile';

/** 个人资料表单组件属性。 */
interface ProfileFormProps {
  /** 当前个人资料表单值。 */
  modelValue: ProfileFormModel;
  /** 昵称校验错误文本。 */
  nicknameError: string;
  /** 是否正在提交资料。 */
  submitting: boolean;
}

/** 个人资料表单组件事件。 */
interface ProfileFormEmits {
  /** 更新昵称。 */
  (event: 'update:userName', value: string): void;
  /** 更新性别。 */
  (event: 'update:gender', value: 0 | 1): void;
  /** 提交个人资料。 */
  (event: 'submit'): void;
}

defineProps<ProfileFormProps>();
const emit = defineEmits<ProfileFormEmits>();

/** 将去除首尾空白后的昵称发送给父页面。 */
const updateUserName = (event: Event): void => {
  emit('update:userName', (event.target as HTMLInputElement).value.trim());
};

/** 将选择的性别发送给父页面。 */
const updateGender = (event: Event): void => {
  const value = Number((event.target as HTMLSelectElement).value);
  emit('update:gender', value === 1 ? 1 : 0);
};

/** 请求父页面提交个人资料。 */
const submitForm = (): void => {
  emit('submit');
};
</script>
