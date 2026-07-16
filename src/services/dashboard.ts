/**
 * Dashboard API 服务
 *
 * 真实接口失败时返回带有 source 标记的结果。
 * 仅在开发环境且 VITE_ENABLE_MOCK=true 时才使用 Mock 数据。
 */

import http from './http';
import type { InterfaceInfoVO } from '@/types/api';
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

export const dashboardService = {
  /**
   * 获取概览统计
   *
   * 真实接口：GET /analysis/dashboard/overview
   */
  async getOverview(): Promise<DataResult<DashboardOverview>> {
    try {
      const data = await http.get<DashboardOverview>('/analysis/dashboard/overview');
      return { data: data ?? getMockOverview().data, source: 'real' };
    } catch {
      if (isMockEnabled()) {
        return getMockOverview();
      }
      return { data: null, source: 'error' };
    }
  },

  /**
   * 获取趋势数据
   *
   * 真实接口：GET /analysis/dashboard/trends
   */
  async getTrends(): Promise<DataResult<DashboardTrends>> {
    try {
      const data = await http.get<DashboardTrends>('/analysis/dashboard/trends');
      return { data: data ?? getMockTrends().data, source: 'real' };
    } catch {
      if (isMockEnabled()) {
        return getMockTrends();
      }
      return { data: null, source: 'error' };
    }
  },

  /**
   * 获取重点关注接口
   *
   * 真实接口：GET /analysis/dashboard/alerts
   */
  async getAlerts(): Promise<DataResult<AlertInterface[]>> {
    try {
      const data = await http.get<AlertInterface[]>('/analysis/dashboard/alerts');
      return { data: data ?? getMockAlerts().data, source: 'real' };
    } catch {
      if (isMockEnabled()) {
        return getMockAlerts();
      }
      return { data: null, source: 'error' };
    }
  },

  /**
   * 获取最近变更接口
   *
   * 真实接口：GET /analysis/dashboard/changes
   */
  async getChanges(): Promise<DataResult<ChangedInterface[]>> {
    try {
      const data = await http.get<ChangedInterface[]>('/analysis/dashboard/changes');
      return { data: data ?? getMockChanges().data, source: 'real' };
    } catch {
      if (isMockEnabled()) {
        return getMockChanges();
      }
      return { data: null, source: 'error' };
    }
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
