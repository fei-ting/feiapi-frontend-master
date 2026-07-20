import { getCurrentInstance, onBeforeUnmount, reactive } from 'vue';

/** Toast 类型。 */
export type ToastType = 'success' | 'error' | 'info';

/** Toast 状态。 */
export interface ToastState {
  /** 是否显示。 */
  visible: boolean;
  /** 通知类型。 */
  type: ToastType;
  /** 通知文本。 */
  message: string;
}

/**
 * Toast 通知组合式函数。
 * 统一管理通知状态、自动关闭和组件卸载清理。
 *
 * @param duration 自动关闭时间，单位毫秒
 * @returns Toast 状态和操作方法
 */
export function useToast(duration = 2400) {
  /** Toast 响应式状态。 */
  const toast = reactive<ToastState>({
    visible: false,
    type: 'info',
    message: '',
  });

  /** 当前自动关闭定时器。 */
  let timer: number | undefined;

  /** 清理当前自动关闭定时器。 */
  const clearTimer = (): void => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  /**
   * 显示 Toast 通知。
   *
   * @param message 通知消息
   * @param type 通知类型
   */
  const showToast = (message: string, type: ToastType = 'info'): void => {
    clearTimer();
    toast.message = message;
    toast.type = type;
    toast.visible = true;
    timer = window.setTimeout(() => {
      toast.visible = false;
      timer = undefined;
    }, duration);
  };

  /** 立即关闭 Toast。 */
  const hideToast = (): void => {
    clearTimer();
    toast.visible = false;
  };

  if (getCurrentInstance()) {
    onBeforeUnmount(hideToast);
  }

  return { toast, showToast, hideToast };
}
