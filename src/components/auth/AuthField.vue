<template>
  <div class="fei-field">
    <label class="fei-label" :for="id">{{ label }}</label>
    <div class="fei-auth-field__control" :class="{ 'fei-auth-field__control--icon': icon }">
      <UserOutlined v-if="icon === 'user'" class="fei-auth-field__icon" aria-hidden="true" />
      <LockOutlined v-if="icon === 'lock'" class="fei-auth-field__icon" aria-hidden="true" />
      <input
        :id="id"
        class="fei-input"
        :class="{ 'fei-input--error': Boolean(error) }"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? errorId : undefined"
        @input="handleInput"
        @blur="emit('blur')"
      />
    </div>
    <span
      v-if="error"
      :id="errorId"
      class="fei-field-error"
      :class="{ 'fei-field-error--shake': shaking }"
      role="alert"
    >
      {{ error }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';

/** 认证字段组件属性。 */
interface AuthFieldProps {
  /** 字段标识，同时用于标签和错误文本关联。 */
  id: string;
  /** 字段标签。 */
  label: string;
  /** 当前字段值。 */
  modelValue: string;
  /** 输入框类型。 */
  type?: 'text' | 'password';
  /** 输入占位文本。 */
  placeholder: string;
  /** 当前错误文本。 */
  error?: string;
  /** 是否显示抖动反馈。 */
  shaking?: boolean;
  /** 输入框前置图标。 */
  icon?: 'user' | 'lock' | undefined;
}

/** 认证字段组件事件。 */
interface AuthFieldEmits {
  /** 更新字段值。 */
  (event: 'update:modelValue', value: string): void;
  /** 字段输入后请求父级处理实时校验。 */
  (event: 'input'): void;
  /** 字段失焦后请求父级重新校验。 */
  (event: 'blur'): void;
}

const props = withDefaults(defineProps<AuthFieldProps>(), {
  type: 'text',
  error: '',
  shaking: false,
  icon: undefined,
});
const emit = defineEmits<AuthFieldEmits>();

/** 错误文本元素标识。 */
const errorId = computed(() => `${props.id}-error`);

/**
 * 处理原生输入事件并转发新值及实时校验请求。
 *
 * @param event 原生输入事件
 */
const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
  emit('input');
};
</script>

<style scoped>
/* 输入框图标容器。 */
.fei-auth-field__control {
  position: relative;
}

.fei-auth-field__control--icon .fei-input {
  padding-left: 48px;
}

.fei-auth-field__icon {
  position: absolute;
  top: 50%;
  left: 17px;
  z-index: 1;
  color: var(--fei-text-muted);
  font-size: 18px;
  pointer-events: none;
  transform: translateY(-50%);
}

/* 输入框错误状态。 */
.fei-input--error {
  border-color: var(--fei-error);
}

.fei-input--error:focus {
  border-color: var(--fei-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

/* 错误提示文本。 */
.fei-field-error {
  display: block;
  font-size: 13px;
  color: var(--fei-error);
  line-height: 1.5;
}

/* 字段错误抖动动画。 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.fei-field-error--shake {
  animation: shake 0.4s ease-in-out;
}
</style>
