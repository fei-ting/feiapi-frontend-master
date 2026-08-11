/**
 * 管理员工作台真实接口服务。
 */

import http from './http';
import type {
  AlertInterface,
  ChangedInterface,
  DashboardOverview,
  DashboardTrends,
} from '@/types/dashboard';

/**
 * 工作台真实数据服务。
 */
export const dashboardService = {
  /**
   * 获取概览统计。
   *
   * @returns 概览统计
   */
  getOverview(): Promise<DashboardOverview> {
    return http.get<DashboardOverview>('/analysis/dashboard/overview');
  },

  /**
   * 获取最近24小时趋势。
   *
   * @returns 趋势数据
   */
  getTrends(): Promise<DashboardTrends> {
    return http.get<DashboardTrends>('/analysis/dashboard/trends');
  },

  /**
   * 获取重点关注接口。
   *
   * @returns 告警列表
   */
  getAlerts(): Promise<AlertInterface[]> {
    return http.get<AlertInterface[]>('/analysis/dashboard/alerts');
  },

  /**
   * 获取最近变更接口。
   *
   * @returns 变更列表
   */
  getChanges(): Promise<ChangedInterface[]> {
    return http.get<ChangedInterface[]>('/analysis/dashboard/changes');
  },
};
