import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  responseSuccess: vi.fn(),
  responseError: vi.fn(),
  use: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        response: {
          use: mocks.use,
        },
      },
    })),
  },
}));

import '../http';

const successInterceptor = mocks.use.mock.calls[0]?.[0] as (response: unknown) => unknown;
const errorInterceptor = mocks.use.mock.calls[0]?.[1] as (error: unknown) => unknown;

describe('http 服务返回契约', () => {
  /** 验证成功响应在 HTTP 边界直接解包为领域数据。 */
  it('成功响应返回 data 字段', () => {
    expect(successInterceptor({ data: { code: 0, message: 'ok', data: { id: 1 } } })).toEqual({ id: 1 });
  });

  /** 验证业务错误码转换为带 code 的异常。 */
  it('业务错误码拒绝并保留错误码', async () => {
    const error = await successInterceptor({ data: { code: 1001, message: '未登录', data: null } }).catch((reason: Error & { code?: number }) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(1001);
    expect(error.message).toBe('未登录');
  });

  /** 验证网络层错误不被 HTTP 封装吞掉。 */
  it('网络错误原样透传', async () => {
    const networkError = new Error('网络不可用');
    await expect(errorInterceptor(networkError)).rejects.toBe(networkError);
  });
});
