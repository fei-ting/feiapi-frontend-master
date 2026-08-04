import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../http', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
  },
}));

import { interfaceService } from '../interfaceInfo';

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
});

describe('接口信息服务', () => {
  /** 发布请求必须覆盖全局超时，以接收后端结构化探测结果。 */
  it('发布接口使用 20 秒独立超时', () => {
    const request = { id: 1 };

    interfaceService.online(request);

    expect(mocks.post).toHaveBeenCalledWith('/interfaceInfo/online', request, {
      timeout: 20000,
    });
  });

  /** 其他写操作继续沿用全局 HTTP 超时配置。 */
  it('下线接口不覆盖全局超时', () => {
    const request = { id: 1 };

    interfaceService.offline(request);

    expect(mocks.post).toHaveBeenCalledWith('/interfaceInfo/offline', request);
  });
});
