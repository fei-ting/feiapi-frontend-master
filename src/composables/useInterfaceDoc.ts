/**
 * 接口文档共享 composable。
 *
 * 抽取 InterfaceDetailView 和 InterfaceInvokeView 共享的工具函数，
 * 消除重复代码，提高可维护性。
 */
import type { InterfaceDocInterfaceInfoVO, InterfaceDocParamVO } from '@/types/api';

/** Toast 通知类型 */
type ToastType = 'success' | 'error' | 'info';

/** Toast 通知函数 */
type ToastNotifier = (message: string, type: ToastType) => void;

/**
 * 接口文档共享逻辑。
 * @param notifyToast 将 Toast 通知交给应用布局处理
 */
export function useInterfaceDoc(notifyToast?: ToastNotifier) {
  /**
   * 显示 Toast 提示。
   * @param message 提示消息
   * @param type 提示类型
   */
  const showToast = (message: string, type: ToastType = 'info') => {
    notifyToast?.(message, type);
  };

  /**
   * 带 fallback 的文本复制。
   * 优先使用 Clipboard API，失败时降级使用 execCommand。
   * @param text 要复制的文本
   */
  const copyText = async (text: string) => {
    if (!text.trim()) {
      showToast('暂无可复制内容', 'info');
      return;
    }

    // 优先使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('已复制', 'success');
        return;
      } catch (error) {
        console.error('[useInterfaceDoc] Clipboard API 失败，尝试降级方案:', error);
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
        showToast('已复制', 'success');
      } else {
        showToast('复制失败，请手动选择内容复制', 'error');
      }
    } catch (error) {
      console.error('[useInterfaceDoc] execCommand 降级方案失败:', error);
      showToast('复制失败，请手动选择内容复制', 'error');
    }
  };

  /**
   * 判断数组是否有数据。
   * @param rows 数组
   * @returns 是否有数据
   */
  const hasRows = <T>(rows?: T[]) => Boolean(rows?.length);

  /**
   * 判断文本是否有内容。
   * @param value 文本
   * @returns 是否有内容
   */
  const hasText = (value?: string) => Boolean(value?.trim());

  /**
   * 格式化必填字段显示。
   * @param required 是否必填
   * @returns 显示文本
   */
  const requiredText = (required?: boolean) => (required ? '是' : '否');

  /**
   * 格式化可空字段显示。
   * @param nullable 是否可空
   * @returns 显示文本
   */
  const nullableText = (nullable?: boolean) => (nullable ? '是' : '否');

  /**
   * 生成参数行唯一标识。
   * @param param 参数对象
   * @returns 唯一标识
   */
  const rowKey = (param: InterfaceDocParamVO) =>
    `${param.id || 'legacy'}-${param.paramScene || ''}-${param.name || ''}`;

  /**
   * 获取参数值（优先示例值，其次默认值）。
   * @param param 参数对象
   * @returns 参数值
   */
  const paramValue = (param: InterfaceDocParamVO) =>
    param.exampleValue || param.defaultValue || '-';

  /**
   * 格式化 Header 必填状态。
   * Content-Type 有值时视为必填。
   * @param param Header 参数
   * @returns 必填状态文本
   */
  const headerRequiredText = (param: InterfaceDocParamVO) => {
    if (param.required) return '是';
    if (param.name?.toLowerCase() === 'content-type' && paramValue(param) !== '-') return '是';
    return '否';
  };

  /**
   * 格式化 Header 描述。
   * 过滤旧字段自动转换的提示，补充 Content-Type 说明。
   * @param param Header 参数
   * @returns 描述文本
   */
  const headerDescription = (param: InterfaceDocParamVO) => {
    if (param.description && !param.description.includes('旧请求头字段自动转换')) {
      return param.description;
    }
    if (param.name?.toLowerCase() === 'content-type' && paramValue(param) === 'application/json') {
      return '请求体为 JSON 格式时必须设置';
    }
    return param.description || '-';
  };

  /**
   * 格式化请求参数描述。
   * 拼接描述、示例值、默认值、校验规则。
   * @param param 请求参数
   * @returns 描述文本
   */
  const requestParamDescription = (param: InterfaceDocParamVO) => {
    const parts = [
      param.description && !param.description.includes('旧字段自动转换') ? param.description : '',
      param.exampleValue ? `例如：${param.exampleValue}` : '',
      param.defaultValue ? `默认值：${param.defaultValue}` : '',
      param.validationRule ? param.validationRule : '',
    ].filter(Boolean);
    return parts.length ? parts.join('。') : '-';
  };

  /**
   * 格式化 JSON 显示。
   * @param value JSON 字符串
   * @param fallback 默认值
   * @returns 格式化后的 JSON
   */
  const prettyJson = (value: string | undefined, fallback: string) => {
    const content = value?.trim();
    if (!content) {
      return fallback;
    }
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  };

  /**
   * 获取接口摘要。
   * @param item 接口信息
   * @returns 摘要文本
   */
  const interfaceSummary = (item: InterfaceDocInterfaceInfoVO) =>
    item.description || '暂无接口描述';

  return {
    showToast,
    copyText,
    hasRows,
    hasText,
    requiredText,
    nullableText,
    rowKey,
    paramValue,
    headerRequiredText,
    headerDescription,
    requestParamDescription,
    prettyJson,
    interfaceSummary,
  };
}
