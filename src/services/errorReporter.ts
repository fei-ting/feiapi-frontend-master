/**
 * 前端统一错误上报服务。
 * 当前默认输出脱敏后的结构化日志，后续可在此处替换为远程监控实现。
 */

/** 错误来源。 */
export type ErrorReportSource = 'vue-global' | 'window-error' | 'unhandled-rejection';

/** 错误上报上下文。 */
export interface ErrorReportContext {
  /** 错误来源。 */
  source: ErrorReportSource;
  /** Vue 组件名称。 */
  component?: string;
  /** Vue 错误阶段说明。 */
  info?: string;
}

/** 结构化错误报告。 */
export interface ErrorReport {
  /** 错误名称。 */
  name: string;
  /** 错误消息。 */
  message: string;
  /** 错误堆栈。 */
  stack?: string;
  /** 错误来源。 */
  source: ErrorReportSource;
  /** Vue 组件名称。 */
  component?: string;
  /** Vue 错误阶段说明。 */
  info?: string;
  /** 当前页面地址。 */
  url: string;
  /** 当前运行环境。 */
  environment: 'development' | 'production' | 'test';
  /** 错误发生时间。 */
  timestamp: string;
}

/** 将任意拒绝原因转换为 Error。 */
const toError = (value: unknown): Error => {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);

  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error('未知错误');
  }
};

/**
 * 生成脱敏的结构化错误报告。
 * 只读取错误元数据，不上传请求参数、响应体、密钥或密码。
 */
export const createErrorReport = (error: unknown, context: ErrorReportContext): ErrorReport => {
  const normalizedError = toError(error);
  return {
    name: normalizedError.name || 'Error',
    message: normalizedError.message || '未知错误',
    stack: normalizedError.stack,
    source: context.source,
    component: context.component,
    info: context.info,
    url: typeof window === 'undefined' ? '' : window.location.href,
    environment: import.meta.env.MODE === 'test'
      ? 'test'
      : (import.meta.env.DEV ? 'development' : 'production'),
    timestamp: new Date().toISOString(),
  };
};

/**
 * 上报错误。
 * Reporter 自身异常不会向外抛出，避免影响页面降级和应用运行。
 */
export const reportError = (error: unknown, context: ErrorReportContext): void => {
  try {
    const report = createErrorReport(error, context);
    console.error('[统一错误上报]', report);
  } catch {
    // 错误上报失败时保持静默，避免产生二次异常。
  }
};

/** 注册浏览器级错误监听器。 */
export const registerGlobalErrorHandlers = (): void => {
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, { source: 'window-error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandled-rejection' });
  });
};
