<template>
  <div
    v-if="open"
    ref="dialogRef"
    class="fei-modal-mask"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @keyup.esc="cancel"
    @keydown="handleKeydown"
  >
    <div class="fei-confirm-dialog">
      <h2 :id="titleId">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="fei-confirm-dialog__footer">
        <button class="fei-btn fei-btn--primary" type="button" @click="confirm">
          {{ primaryText }}
        </button>
        <button class="fei-btn fei-btn--secondary" type="button" @click="cancel">
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDialogFocusTrap } from '@/composables/useDialogFocusTrap';

/** 通用确认弹窗组件属性。 */
interface ConfirmDialogProps {
  /** 是否显示弹窗。 */
  open: boolean;
  /** 弹窗标题。 */
  title: string;
  /** 弹窗正文。 */
  message: string;
  /** 主操作按钮文本。 */
  primaryText: string;
  /** 取消按钮文本。 */
  cancelText?: string;
  /** 标题元素 ID。 */
  titleId?: string;
}

/** 通用确认弹窗组件事件。 */
interface ConfirmDialogEmits {
  /** 用户确认主操作。 */
  (event: 'confirm'): void;
  /** 用户取消弹窗。 */
  (event: 'cancel'): void;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  cancelText: '取消',
  titleId: 'confirm-dialog-title',
});
const emit = defineEmits<ConfirmDialogEmits>();

/** 弹窗容器引用。 */
const dialogRef = ref<HTMLElement | null>(null);
const { handleKeydown, focusFirst } = useDialogFocusTrap(dialogRef);

/** 通知父组件确认主操作。 */
const confirm = (): void => {
  emit('confirm');
};

/** 通知父组件取消弹窗。 */
const cancel = (): void => {
  emit('cancel');
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      focusFirst();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.fei-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(3px);
}

.fei-confirm-dialog {
  width: min(420px, 100%);
  padding: 24px;
  background: #fff;
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-lg);
  box-shadow: var(--fei-shadow);
}

.fei-confirm-dialog h2 {
  margin: 0;
  color: var(--fei-text);
  font-size: 20px;
  font-weight: 800;
}

.fei-confirm-dialog p {
  margin: 12px 0 0;
  color: var(--fei-text-secondary);
  line-height: 1.8;
}

.fei-confirm-dialog__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
}
</style>
