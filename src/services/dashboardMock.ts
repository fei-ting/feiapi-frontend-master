/**
 * Dashboard Mock 数据适配层
 *
 * 仅在开发环境下启用，通过环境变量控制。
 * 真实接口失败时返回带有 source 标记的结果，而非静默降级。
 */

import type {
  DashboardOverview,
  DashboardTrends,
  AlertInterface,
  ChangedInterface,
} from '@/types/dashboard';

/** 数据来源标记 */
export type DataSource = 'real' | 'mock' | 'error';

/** 带来源标记的返回结果 */
export interface DataResult<T> {
  data: T;
  source: DataSource;
}

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

/**
 * 判断是否启用 Mock 数据
 * 仅在开发环境下启用
 */
export const isMockEnabled = (): boolean => {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK === 'true';
};

/**
 * 获取 Mock 概览数据
 */
export const getMockOverview = (): DataResult<DashboardOverview> => ({
  data: MOCK_OVERVIEW,
  source: 'mock',
});

/**
 * 获取 Mock 趋势数据
 */
export const getMockTrends = (): DataResult<DashboardTrends> => ({
  data: MOCK_TRENDS,
  source: 'mock',
});

/**
 * 获取 Mock 重点关注数据
 */
export const getMockAlerts = (): DataResult<AlertInterface[]> => ({
  data: MOCK_ALERTS,
  source: 'mock',
});

/**
 * 获取 Mock 最近变更数据
 */
export const getMockChanges = (): DataResult<ChangedInterface[]> => ({
  data: MOCK_CHANGES,
  source: 'mock',
});
