import http from './http';
import type { ResponseData } from '@/types/api';
import type { HomeStats } from '@/types/home';

/**
 * 首页统计服务。
 */
export const homeStatsService = {
  /**
   * 获取首页统计数据。
   */
  getHomeStats() {
    return http
      .get<ResponseData<HomeStats>>('/analysis/home/stats')
      .then((response) => response.data);
  },
};
