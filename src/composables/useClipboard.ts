/** 剪贴板通知类型。 */
type ClipboardToastType = 'success' | 'error' | 'info';

/** 剪贴板通知函数。 */
type ClipboardNotifier = (message: string, type: ClipboardToastType) => void;

/** 复制成功提示。 */
const COPY_SUCCESS_MESSAGE = '已复制';

/** 复制失败提示。 */
const COPY_ERROR_MESSAGE = '复制失败，请手动选择内容复制';

/** 空内容提示。 */
const EMPTY_CONTENT_MESSAGE = '暂无可复制内容';

/**
 * 剪贴板操作组合式函数。
 * 统一管理现代 Clipboard API、降级复制和结果通知。
 *
 * @param showToast 可选的 Toast 显示函数
 * @returns 剪贴板操作方法
 */
export function useClipboard(showToast?: ClipboardNotifier) {
  /**
   * 检查现代剪贴板 API 是否可用。
   *
   * @returns 是否可用
   */
  const isClipboardSupported = (): boolean => (
    typeof navigator !== 'undefined'
    && typeof window !== 'undefined'
    && Boolean(navigator.clipboard)
    && Boolean(window.isSecureContext)
  );

  /**
   * 复制文本到剪贴板。
   * 优先使用 Clipboard API，失败时降级使用 execCommand。
   *
   * @param text 要复制的文本
   * @returns 是否复制成功
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text?.trim()) {
      showToast?.(EMPTY_CONTENT_MESSAGE, 'info');
      return false;
    }

    if (isClipboardSupported()) {
      try {
        await navigator.clipboard.writeText(text);
        showToast?.(COPY_SUCCESS_MESSAGE, 'success');
        return true;
      } catch (error) {
        console.error('[useClipboard] Clipboard API 失败，尝试降级方案:', error);
      }
    }

    let textarea: HTMLTextAreaElement | null = null;
    try {
      textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');

      if (success) {
        showToast?.(COPY_SUCCESS_MESSAGE, 'success');
        return true;
      }
      showToast?.(COPY_ERROR_MESSAGE, 'error');
      return false;
    } catch (error) {
      console.error('[useClipboard] execCommand 降级方案失败:', error);
      showToast?.(COPY_ERROR_MESSAGE, 'error');
      return false;
    } finally {
      textarea?.remove();
    }
  };

  return {
    copyToClipboard,
    isClipboardSupported,
  };
}
