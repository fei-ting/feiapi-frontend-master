import http from './http';
import type { ResponseData, InterfaceInfoVO, PageResult } from '@/types/api';
import type {
  DashboardOverview,
  DashboardTrends,
  AlertInterface,
  ChangedInterface,
} from '@/types/dashboard';

// ==================== Mock 数据 ====================

/** 概览统计 Mock 数据 */
const MOCK_OVERVIEW: DashboardOverview = {
  totalInterfaces: 12,
  onlineInterfaces: 8,
  offlineInterfaces: 4,
  todayInvocations: 12580,
  todayErrors: 23,
  abnormalInterfaces: 1,
};

/** 趋势数据 Mock（24 小时，每 4 小时一个点） */
const MOCK_TRENDS: DashboardTrends = {
  successRate: [
    { label: '00:00', value: 99.2 },
    { label: '04:00', value: 99.5 },
    { label: '08:00', value: 98.8 },
    { label: '12:00', value: 99.1 },
    { label: '16:00', value: 99.6 },
    { label: '20:00', value: 99.3 },
  ],
  invocationCount: [
    { label: '00:00', value: 320 },
    { label: '04:00', value: 180 },
    { label: '08:00', value: 2100 },
    { label: '12:00', value: 3200 },
    { label: '16:00', value: 2800 },
    { label: '20:00', value: 1500 },
  ],
  errorRate: [
    { label: '00:00', value: 0.8 },
    { label: '04:00', value: 0.5 },
    { label: '08:00', value: 1.2 },
    { label: '12:00', value: 0.9 },
    { label: '16:00', value: 0.4 },
    { label: '20:00', value: 0.7 },
  ],
  responseTime: [
    { label: '00:00', value: 42 },
    { label: '04:00', value: 38 },
    { label: '08:00', value: 65 },
    { label: '12:00', value: 58 },
    { label: '16:00', value: 45 },
    { label: '20:00', value: 50 },
  ],
};

/** 重点关注 Mock 数据 */
const MOCK_ALERTS: AlertInterface[] = [
  {
    id: 5,
    name: '获取随机情话',
    alertType: 'abnormal',
    description: '最近 1 小时内出现 3 次超时',
    time: '10 分钟前',
  },
  {
    id: 2,
    name: '获取用户信息',
    alertType: 'spike',
    description: '调用量较昨日同期增长 150%',
    time: '30 分钟前',
  },
  {
    id: 8,
    name: '天气查询接口',
    alertType: 'highFailureRate',
    description: '失败率达到 5.2%，超过阈值',
    time: '1 小时前',
  },
  {
    id: 3,
    name: '随机笑话',
    alertType: 'unused',
    description: '已超过 7 天未被调用',
    time: '7 天前',
  },
];

/** 最近变更 Mock 数据 */
const MOCK_CHANGES: ChangedInterface[] = [
  { id: 10, name: 'IP 地址查询', changeType: 'created', time: '2 小时前' },
  { id: 6, name: '随机壁纸', changeType: 'online', time: '5 小时前' },
  { id: 9, name: '快递查询', changeType: 'offline', time: '1 天前' },
  { id: 2, name: '获取用户信息', changeType: 'updated', time: '2 天前' },
];

// ==================== API 服务 ====================

/**
 * Dashboard API 服务
 *
 * 后端接口未实现时自动降级为 Mock 数据
 */
export const dashboardService = {
  /**
   * 获取概览统计
   *
   * 真实接口：GET /analysis/dashboard/overview
   * 降级方案：使用接口列表统计 + Mock 今日数据
   */
  async getOverview(): Promise<DashboardOverview> {
    try {
      // 尝试调用真实接口
      const res = await http.get<ResponseData<DashboardOverview>>('/analysis/dashboard/overview');
      // 确保返回有效数据，如果后端返回 null 则降级
      return res.data.data ?? MOCK_OVERVIEW;
    } catch {
      // 降级：从接口列表统计总数和状态分布
      try {
        const res = await http.get<ResponseData<PageResult<InterfaceInfoVO>>>('/interfaceInfo/list/page', {
          params: { current: 1, pageSize: 100 },
        });
        const records = res.data.data?.records ?? [];
        const totalInterfaces = res.data.data?.total ?? 0;
        const onlineInterfaces = records.filter((r) => r.status === 1).length;
        const offlineInterfaces = records.filter((r) => r.status !== 1).length;

        return {
          totalInterfaces,
          onlineInterfaces,
          offlineInterfaces,
          // 以下字段需要后端接口支持，暂用 Mock
          todayInvocations: MOCK_OVERVIEW.todayInvocations,
          todayErrors: MOCK_OVERVIEW.todayErrors,
          abnormalInterfaces: MOCK_OVERVIEW.abnormalInterfaces,
        };
      } catch {
        // 完全降级为 Mock
        return MOCK_OVERVIEW;
      }
    }
  },

  /**
   * 获取趋势数据
   *
   * 真实接口：GET /analysis/dashboard/trends
   * 降级方案：返回 Mock 数据
   */
  async getTrends(): Promise<DashboardTrends> {
    try {
      const res = await http.get<ResponseData<DashboardTrends>>('/analysis/dashboard/trends');
      return res.data.data ?? MOCK_TRENDS;
    } catch {
      return MOCK_TRENDS;
    }
  },

  /**
   * 获取重点关注接口
   *
   * 真实接口：GET /analysis/dashboard/alerts
   * 降级方案：返回 Mock 数据
   */
  async getAlerts(): Promise<AlertInterface[]> {
    try {
      const res = await http.get<ResponseData<AlertInterface[]>>('/analysis/dashboard/alerts');
      return res.data.data ?? MOCK_ALERTS;
    } catch {
      return MOCK_ALERTS;
    }
  },

  /**
   * 获取最近变更接口
   *
   * 真实接口：GET /analysis/dashboard/changes
   * 降级方案：从接口列表按更新时间排序模拟
   */
  async getChanges(): Promise<ChangedInterface[]> {
    try {
      const res = await http.get<ResponseData<ChangedInterface[]>>('/analysis/dashboard/changes');
      return res.data.data ?? MOCK_CHANGES;
    } catch {
      // 降级：从接口列表按更新时间排序
      try {
        const res = await http.get<ResponseData<PageResult<InterfaceInfoVO>>>('/interfaceInfo/list/page', {
          params: { current: 1, pageSize: 4, sortField: 'updateTime', sortOrder: 'desc' },
        });
        const records = res.data.data?.records ?? [];
        return records.map((r) => ({
          id: r.id,
          name: r.name,
          changeType: 'updated' as const,
          time: r.updateTime ?? '未知',
        }));
      } catch {
        return MOCK_CHANGES;
      }
    }
  },

  /**
   * 获取调用次数 TOP 接口（已有后端接口）
   *
   * 真实接口：GET /analysis/top/interface/invoke
   */
  async getTopInterfaces(): Promise<InterfaceInfoVO[]> {
    try {
      const res = await http.get<ResponseData<InterfaceInfoVO[]>>('/analysis/top/interface/invoke');
      return res.data.data ?? [];
    } catch {
      return [];
    }
  },
};
