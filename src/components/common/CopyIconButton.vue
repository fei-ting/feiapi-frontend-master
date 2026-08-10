<template>
  <button
    class="fei-copy-button"
    :class="{ 'fei-copy-button--top-right': placement === 'top-right' }"
    type="button"
    :aria-label="label"
    :title="label"
    :data-tooltip="tooltip"
    :disabled="disabled"
    @click="handleClick"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 8.5C8 7.67 8.67 7 9.5 7h8C18.33 7 19 7.67 19 8.5v8c0 .83-.67 1.5-1.5 1.5h-8C8.67 18 8 17.33 8 16.5v-8Z" />
      <path d="M5 14.5v-8C5 5.67 5.67 5 6.5 5h8" />
    </svg>
  </button>
</template>

<script setup lang="ts">
/** 公共复制按钮定位模式。 */
type CopyIconButtonPlacement = 'inline' | 'top-right';

/** 公共复制图标按钮属性。 */
interface CopyIconButtonProps {
  /** 无障碍名称和原生提示文本。 */
  label?: string;
  /** 悬停时展示的简短提示文本。 */
  tooltip?: string;
  /** 按钮在业务容器中的定位模式。 */
  placement?: CopyIconButtonPlacement;
  /** 是否禁用复制按钮。 */
  disabled?: boolean;
}

/** 公共复制图标按钮事件。 */
interface CopyIconButtonEmits {
  /** 用户点击复制按钮。 */
  (event: 'click', mouseEvent: MouseEvent): void;
}

withDefaults(defineProps<CopyIconButtonProps>(), {
  label: '复制',
  tooltip: '复制',
  placement: 'inline',
  disabled: false,
});
const emit = defineEmits<CopyIconButtonEmits>();

/**
 * 将原生点击事件转发给业务组件。
 *
 * @param mouseEvent 鼠标点击事件
 */
const handleClick = (mouseEvent: MouseEvent): void => {
  emit('click', mouseEvent);
};
</script>

<style scoped>
.fei-copy-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  color: var(--fei-text-secondary);
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--fei-border);
  border-radius: 8px;
  box-shadow: var(--fei-shadow-soft);
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
}

.fei-copy-button--top-right {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.fei-copy-button:not(:disabled):hover {
  color: var(--fei-primary);
  border-color: var(--fei-primary-light);
  transform: translateY(-1px);
}

.fei-copy-button:focus-visible {
  outline: 2px solid var(--fei-primary);
  outline-offset: 2px;
}

.fei-copy-button:disabled {
  color: var(--fei-text-muted);
  cursor: not-allowed;
  transform: none;
}

.fei-copy-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fei-copy-button::after {
  position: absolute;
  top: 50%;
  right: calc(100% + 8px);
  padding: 5px 8px;
  color: #fff;
  background: #111827;
  border-radius: 6px;
  content: attr(data-tooltip);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateX(4px) translateY(-50%);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fei-copy-button:hover::after,
.fei-copy-button:focus-visible::after {
  opacity: 1;
  transform: translateX(0) translateY(-50%);
}
</style>
