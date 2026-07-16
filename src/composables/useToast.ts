import { onBeforeUnmount, reactive } from 'vue';

/** Toast 类型 */
export type ToastType = 'success' | 'error' | 'info';

/** Toast 状态 */
export interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

/**
 * Toast 通知组合式函数
 * 统一管理通知状态、自动关闭和组件卸载清理
 * @param duration 自动关闭时间，单位毫秒
 */
export function useToast(duration = 2400) {
  const toast = reactive<ToastState>({
    visible: false,
    type: 'info',
    message: '',
  });
  let timer: number | undefined;

  /**
   * 显示 Toast 通知
   * @param message 通知消息
   * @param type 通知类型
   */
  const showToast = (message: string, type: ToastType = 'info') => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    toast.message = message;
    toast.type = type;
    toast.visible = true;
    timer = window.setTimeout(() => {
      toast.visible = false;
      timer = undefined;
    }, duration);
  };

  /** 立即关闭 Toast */
  const hideToast = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    toast.visible = false;
  };

  onBeforeUnmount(hideToast);

  return { toast, showToast, hideToast };
}
