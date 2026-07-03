/**
 * 首页统计数据。
 */
export interface HomeStats {
  /** 平台已上线接口数量 */
  platformInterfaceCount: number;
  /** 今日接口调用次数 */
  todayInvocations: number;
  /** 今日服务可用性百分比，无调用数据时为空 */
  availabilityRate: number | null;
  /** 今日平均响应耗时，单位毫秒，无调用数据时为空 */
  averageResponseTimeMs: number | null;
}
