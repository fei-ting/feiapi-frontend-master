import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardService } from '../dashboard';

const httpMocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../http', () => ({ default: httpMocks }));

describe('dashboard 真实接口服务', () => {
  beforeEach(() => vi.clearAllMocks());

  it('概览请求直接返回后端数据', async () => {
    const overview = {
      totalInterfaces: 3,
      onlineInterfaces: 2,
      offlineInterfaces: 1,
      todayInvocations: 20,
      todayErrors: 1,
      abnormalInterfaces: 1,
    };
    httpMocks.get.mockResolvedValueOnce(overview);

    await expect(dashboardService.getOverview()).resolves.toEqual(overview);
    expect(httpMocks.get).toHaveBeenCalledWith('/analysis/dashboard/overview');
  });

  it('后端失败时向页面传播异常，不生成伪造数据', async () => {
    const error = new Error('服务不可用');
    httpMocks.get.mockRejectedValueOnce(error);

    await expect(dashboardService.getOverview()).rejects.toBe(error);
  });

  it('趋势、告警和变更请求使用真实接口路径', async () => {
    httpMocks.get
      .mockResolvedValueOnce({ successRate: [], invocationCount: [], errorRate: [], responseTime: [] })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await dashboardService.getTrends();
    await dashboardService.getAlerts();
    await dashboardService.getChanges();

    expect(httpMocks.get).toHaveBeenNthCalledWith(1, '/analysis/dashboard/trends');
    expect(httpMocks.get).toHaveBeenNthCalledWith(2, '/analysis/dashboard/alerts');
    expect(httpMocks.get).toHaveBeenNthCalledWith(3, '/analysis/dashboard/changes');
  });
});
