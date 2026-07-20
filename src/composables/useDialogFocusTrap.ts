/**
 * 弹窗焦点陷阱组合式函数
 * 提供统一的弹窗焦点管理功能
 */

import { type Ref, nextTick } from 'vue';

/**
 * 弹窗焦点陷阱组合式函数
 * @param dialogRef 弹窗容器的引用
 * @returns 焦点管理方法
 */
export function useDialogFocusTrap(dialogRef: Ref<HTMLElement | null>) {
  /**
   * 获取弹窗内所有可聚焦元素
   * @param container 弹窗容器
   * @returns 可聚焦元素列表
   */
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return Array.from(container.querySelectorAll(selectors.join(', ')));
  };

  /**
   * 处理键盘事件，实现焦点陷阱
   * 弹窗打开时聚焦第一个元素，Tab 键循环焦点
   * @param event 键盘事件
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.value) {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.value);
    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab：从第一个元素跳到最后一个
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab：从最后一个元素跳到第一个
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  /**
   * 聚焦弹窗内的第一个可聚焦元素
   * 通常在弹窗打开后调用
   */
  const focusFirst = () => {
    nextTick(() => {
      if (dialogRef.value) {
        const firstButton = dialogRef.value.querySelector('button') as HTMLElement;
        firstButton?.focus();
      }
    });
  };

  /**
   * 聚焦弹窗内的指定元素
   * @param selector CSS 选择器
   */
  const focusElement = (selector: string) => {
    nextTick(() => {
      if (dialogRef.value) {
        const element = dialogRef.value.querySelector(selector) as HTMLElement;
        element?.focus();
      }
    });
  };

  return {
    handleKeydown,
    focusFirst,
    focusElement,
    getFocusableElements,
  };
}
