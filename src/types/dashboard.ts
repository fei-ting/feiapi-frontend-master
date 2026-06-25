/**
 * Dashboard 工作台相关类型定义
 */

/** 顶部概览统计 */
export interface DashboardOverview {
  /** 接口总数 */
  totalInterfaces: number;
  /** 在线接口数 */
  onlineInterfaces: number;
  /** 已下线接口数 */
  offlineInterfaces: number;
  /** 今日调用量 */
  todayInvocations: number;
  /** 今日错误数 */
  todayErrors: number;
  /** 最近 24 小时异常接口数 */
  abnormalInterfaces: number;
}

/** 趋势数据点 */
export interface TrendPoint {
  /** 时间标签（如 "00:00", "06:00"） */
  label: string;
  /** 数值 */
  value: number;
}

/** 运行状态趋势数据 */
export interface DashboardTrends {
  /** 成功率趋势 */
  successRate: TrendPoint[];
  /** 调用量趋势 */
  invocationCount: TrendPoint[];
  /** 错误率趋势 */
  errorRate: TrendPoint[];
  /** 响应时间趋势（毫秒） */
  responseTime: TrendPoint[];
}

/** 重点关注接口 */
export interface AlertInterface {
  /** 接口 ID */
  id: number;
  /** 接口名称 */
  name: string;
  /** 告警类型 */
  alertType: 'abnormal' | 'spike' | 'highFailureRate' | 'modified' | 'unused';
  /** 告警描述 */
  description: string;
  /** 发生时间 */
  time: string;
}

/** 最近变更接口 */
export interface ChangedInterface {
  /** 接口 ID */
  id: number;
  /** 接口名称 */
  name: string;
  /** 变更类型 */
  changeType: 'created' | 'online' | 'offline' | 'updated';
  /** 变更时间 */
  time: string;
}

/** Dashboard 完整数据 */
export interface DashboardData {
  /** 概览统计 */
  overview: DashboardOverview;
  /** 趋势数据 */
  trends: DashboardTrends;
  /** 重点关注 */
  alerts: AlertInterface[];
  /** 最近变更 */
  changes: ChangedInterface[];
}
