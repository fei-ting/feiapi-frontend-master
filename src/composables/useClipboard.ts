/**
 * 剪贴板操作组合式函数
 * 提供统一的剪贴板复制功能，支持降级方案
 */

/**
 * 剪贴板组合式函数
 * @param showToast 可选的 Toast 显示函数
 * @returns 剪贴板操作方法
 */
export function useClipboard(showToast?: (message: string, type: 'success' | 'error' | 'info') => void) {
  /**
   * 复制文本到剪贴板
   * 优先使用 Clipboard API，失败时降级使用 execCommand
   * @param text 要复制的文本
   * @param successMessage 成功提示消息
   * @param errorMessage 失败提示消息
   * @returns 是否复制成功
   */
  const copyToClipboard = async (
    text: string,
    successMessage = '已复制到剪贴板',
    errorMessage = '复制失败，请手动复制'
  ): Promise<boolean> => {
    if (!text?.trim()) {
      showToast?.('暂无可复制内容', 'info');
      return false;
    }

    // 优先使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast?.(successMessage, 'success');
        return true;
      } catch (error) {
        console.error('[useClipboard] Clipboard API 失败，尝试降级方案:', error);
      }
    }

    // 降级方案：使用 textarea + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        showToast?.(successMessage, 'success');
        return true;
      } else {
        showToast?.(errorMessage, 'error');
        return false;
      }
    } catch (error) {
      console.error('[useClipboard] execCommand 降级方案失败:', error);
      showToast?.(errorMessage, 'error');
      return false;
    }
  };

  /**
   * 检查剪贴板 API 是否可用
   * @returns 是否可用
   */
  const isClipboardSupported = (): boolean => {
    return Boolean(navigator.clipboard && window.isSecureContext);
  };

  return {
    copyToClipboard,
    isClipboardSupported,
  };
}
