import { describe, expect, it, vi } from 'vitest';
import { dashboardService } from '../dashboard';

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}));
const mockEnabled = vi.hoisted(() => ({ value: false }));

vi.mock('../http', () => ({ default: httpMocks }));
vi.mock('../dashboardMock', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../dashboardMock')>();
  return {
    ...actual,
    isMockEnabled: vi.fn(() => mockEnabled.value),
  };
});

describe('dashboard 服务数据来源契约', () => {
  it('真实接口成功时返回真实数据', async () => {
    mockEnabled.value = false;
    const overview = { totalInterfaces: 1 };
    httpMocks.get.mockResolvedValueOnce(overview);

    const result = await dashboardService.getOverview();

    expect(result).toEqual({ data: overview, source: 'real' });
  });

  it('未启用 Mock 且接口失败时不返回伪造数据', async () => {
    mockEnabled.value = false;
    httpMocks.get.mockRejectedValueOnce(new Error('服务不可用'));

    const result = await dashboardService.getOverview();

    expect(result).toEqual({ data: null, source: 'error' });
    expect(result.data).toBeNull();
  });

  it('未启用 Mock 且接口返回空值时进入错误状态', async () => {
    mockEnabled.value = false;
    httpMocks.get.mockResolvedValueOnce(null);

    const result = await dashboardService.getOverview();

    expect(result).toEqual({ data: null, source: 'error' });
  });

  it('开发环境接口异常时降级为 Mock 数据', async () => {
    mockEnabled.value = true;
    httpMocks.get.mockRejectedValueOnce(new Error('服务不可用'));

    const result = await dashboardService.getOverview();

    expect(result.source).toBe('mock');
    expect(result.data).not.toBeNull();
  });

  it('开发环境接口返回空值时降级为 Mock 数据', async () => {
    mockEnabled.value = true;
    httpMocks.get.mockResolvedValueOnce(null);

    const result = await dashboardService.getOverview();

    expect(result.source).toBe('mock');
    expect(result.data).not.toBeNull();
  });

  it('真实接口返回空数组时保留真实空数组', async () => {
    mockEnabled.value = true;
    httpMocks.get.mockResolvedValueOnce([]);

    const result = await dashboardService.getAlerts();

    expect(result).toEqual({ data: [], source: 'real' });
  });
});
