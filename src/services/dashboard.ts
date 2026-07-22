/**
 * Dashboard API 服务
 *
 * 真实接口失败时返回带有 source 标记的结果。
 * 仅在开发环境且 VITE_ENABLE_MOCK=true 时才使用 Mock 数据。
 */

import http from './http';
import type { InterfaceInfoVO } from '@/types/interface';
import type {
  DashboardOverview,
  DashboardTrends,
  AlertInterface,
  ChangedInterface,
} from '@/types/dashboard';
import type { DataResult } from './dashboardMock';
import {
  isMockEnabled,
  getMockOverview,
  getMockTrends,
  getMockAlerts,
  getMockChanges,
} from './dashboardMock';

/**
 * 请求 Dashboard 数据，并根据开发环境开关处理临时 Mock 降级。
 * @param request 真实接口请求
 * @param mockFactory Mock 数据工厂
 * @returns 带数据来源标记的结果
 */
const requestDashboardData = async <T>(
  request: () => Promise<T | null | undefined>,
  mockFactory: () => DataResult<T>,
): Promise<DataResult<T>> => {
  try {
    const data = await request();
    if (data !== null && data !== undefined) {
      return { data, source: 'real' };
    }
  } catch {
    // 真实接口暂不可用时，按环境开关决定是否使用过渡 Mock 数据。
  }

  if (isMockEnabled()) {
    return mockFactory();
  }

  return { data: null, source: 'error' };
};

export const dashboardService = {
  /**
   * 获取概览统计
   *
   * 真实接口：GET /analysis/dashboard/overview
   */
  async getOverview(): Promise<DataResult<DashboardOverview>> {
    return requestDashboardData(
      () => http.get<DashboardOverview>('/analysis/dashboard/overview'),
      getMockOverview,
    );
  },

  /**
   * 获取趋势数据
   *
   * 真实接口：GET /analysis/dashboard/trends
   */
  async getTrends(): Promise<DataResult<DashboardTrends>> {
    return requestDashboardData(
      () => http.get<DashboardTrends>('/analysis/dashboard/trends'),
      getMockTrends,
    );
  },

  /**
   * 获取重点关注接口
   *
   * 真实接口：GET /analysis/dashboard/alerts
   */
  async getAlerts(): Promise<DataResult<AlertInterface[]>> {
    return requestDashboardData(
      () => http.get<AlertInterface[]>('/analysis/dashboard/alerts'),
      getMockAlerts,
    );
  },

  /**
   * 获取最近变更接口
   *
   * 真实接口：GET /analysis/dashboard/changes
   */
  async getChanges(): Promise<DataResult<ChangedInterface[]>> {
    return requestDashboardData(
      () => http.get<ChangedInterface[]>('/analysis/dashboard/changes'),
      getMockChanges,
    );
  },

  /**
   * 获取调用次数 TOP 接口
   *
   * 真实接口：GET /analysis/top/interface/invoke
   */
  async getTopInterfaces(): Promise<InterfaceInfoVO[]> {
    try {
      return await http.get<InterfaceInfoVO[]>('/analysis/top/interface/invoke');
    } catch {
      return [];
    }
  },
};
