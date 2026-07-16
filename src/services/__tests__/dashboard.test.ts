import { describe, expect, it, vi } from 'vitest';
import { dashboardService } from '../dashboard';
import { getMockOverview } from '../dashboardMock';

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('../http', () => ({ default: httpMocks }));

describe('dashboard 服务数据来源契约', () => {
  it('真实接口成功时返回真实数据', async () => {
    const overview = { totalInterfaces: 1 };
    httpMocks.get.mockResolvedValueOnce(overview);

    const result = await dashboardService.getOverview();

    expect(result).toEqual({ data: overview, source: 'real' });
  });

  it('未启用 Mock 且接口失败时不返回伪造数据', async () => {
    httpMocks.get.mockRejectedValueOnce(new Error('服务不可用'));

    const result = await dashboardService.getOverview();

    expect(result).toEqual({ data: null, source: 'error' });
    expect(result.data).not.toEqual(getMockOverview().data);
  });

  it('接口返回空值时使用真实来源的空值保护', async () => {
    httpMocks.get.mockResolvedValueOnce(null);

    const result = await dashboardService.getOverview();

    expect(result.source).toBe('real');
    expect(result.data).toEqual(getMockOverview().data);
  });
});
