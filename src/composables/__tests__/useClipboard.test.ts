import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboard } from '../useClipboard';

/** 原始 execCommand 自有属性描述。 */
const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');

/** 当前测试使用的降级复制函数。 */
let execCommandMock: ReturnType<typeof vi.fn>;

/**
 * 设置现代剪贴板测试环境。
 *
 * @param secureContext 是否为安全上下文
 * @param writeText 写入剪贴板函数
 */
const setClipboardEnvironment = (
  secureContext: boolean,
  writeText?: ReturnType<typeof vi.fn>,
): void => {
  vi.stubGlobal('navigator', {
    clipboard: writeText ? { writeText } : undefined,
  });
  vi.stubGlobal('isSecureContext', secureContext);
};

describe('剪贴板操作组合式函数', () => {
  beforeEach(() => {
    execCommandMock = vi.fn();
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommandMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.querySelectorAll('textarea').forEach((textarea) => textarea.remove());
    if (originalExecCommandDescriptor) {
      Object.defineProperty(document, 'execCommand', originalExecCommandDescriptor);
    } else {
      Reflect.deleteProperty(document, 'execCommand');
    }
  });

  it('安全上下文中使用 Clipboard API 并保留原始文本', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    setClipboardEnvironment(true, writeText);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('  保留空白  ');

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('  保留空白  ');
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('已复制', 'success');
  });

  it('空内容不调用剪贴板能力并发送统一提示', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    setClipboardEnvironment(true, writeText);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('   ');

    expect(copied).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('暂无可复制内容', 'info');
  });

  it('非安全上下文直接使用降级复制并清理临时元素', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    execCommandMock.mockReturnValue(true);
    setClipboardEnvironment(false, writeText);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('降级文本');

    expect(copied).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(showToast).toHaveBeenCalledWith('已复制', 'success');
  });

  it('Clipboard API 异常后继续降级复制', async () => {
    const clipboardError = new Error('现代剪贴板不可用');
    const writeText = vi.fn().mockRejectedValue(clipboardError);
    const showToast = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execCommandMock.mockReturnValue(true);
    setClipboardEnvironment(true, writeText);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('降级成功');

    expect(copied).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      '[useClipboard] Clipboard API 失败，尝试降级方案:',
      clipboardError,
    );
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(showToast).toHaveBeenCalledWith('已复制', 'success');
  });

  it('降级复制返回失败时发送统一失败提示', async () => {
    const showToast = vi.fn();
    execCommandMock.mockReturnValue(false);
    setClipboardEnvironment(false);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('复制失败');

    expect(copied).toBe(false);
    expect(showToast).toHaveBeenCalledWith('复制失败，请手动选择内容复制', 'error');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('降级复制抛出异常时清理临时元素并返回失败', async () => {
    const fallbackError = new Error('降级复制异常');
    const showToast = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    execCommandMock.mockImplementation(() => {
      throw fallbackError;
    });
    setClipboardEnvironment(false);

    const { copyToClipboard } = useClipboard(showToast);
    const copied = await copyToClipboard('异常文本');

    expect(copied).toBe(false);
    expect(consoleError).toHaveBeenCalledWith('[useClipboard] execCommand 降级方案失败:', fallbackError);
    expect(showToast).toHaveBeenCalledWith('复制失败，请手动选择内容复制', 'error');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('正确判断现代剪贴板 API 支持状态', () => {
    const writeText = vi.fn();
    setClipboardEnvironment(true, writeText);
    const { isClipboardSupported } = useClipboard();

    expect(isClipboardSupported()).toBe(true);

    setClipboardEnvironment(false, writeText);
    expect(isClipboardSupported()).toBe(false);

    setClipboardEnvironment(true);
    expect(isClipboardSupported()).toBe(false);
  });
});
