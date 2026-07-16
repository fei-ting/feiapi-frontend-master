import { describe, expect, it, vi } from 'vitest';
import {
  createErrorReport,
  registerGlobalErrorHandlers,
  reportError,
} from '../errorReporter';

describe('统一错误上报服务', () => {
  it('生成包含来源和页面上下文的脱敏报告', () => {
    const report = createErrorReport(new Error('请求失败'), {
      source: 'vue-global',
      component: 'BrokenView',
      info: 'render function',
    });

    expect(report).toMatchObject({
      name: 'Error',
      message: '请求失败',
      source: 'vue-global',
      component: 'BrokenView',
      info: 'render function',
      environment: 'test',
    });
    expect(report).not.toHaveProperty('password');
    expect(report).not.toHaveProperty('secretKey');
  });

  it('Reporter 自身日志失败时不向外抛出', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('日志不可用');
    });

    expect(() => reportError(new Error('原始错误'), { source: 'vue-global' })).not.toThrow();

    consoleError.mockRestore();
  });

  it('注册并处理 window.error 和 unhandledrejection', () => {
    const reportSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerGlobalErrorHandlers();

    window.dispatchEvent(new ErrorEvent('error', { error: new Error('脚本失败') }));
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: '异步失败',
    }));

    expect(reportSpy).toHaveBeenCalledTimes(2);
    expect(reportSpy.mock.calls[0][1]).toMatchObject({ source: 'window-error' });
    expect(reportSpy.mock.calls[1][1]).toMatchObject({ source: 'unhandled-rejection' });

    reportSpy.mockRestore();
  });
});
