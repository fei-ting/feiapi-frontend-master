/**
 * 首页统计数据。
 */
export interface HomeStats {
  /** 平台已上线接口数量 */
  platformInterfaceCount: number;
  /** 全部已记录真实接口调用次数 */
  totalInvocations: number;
  /** 全部调用日志成功率百分比，无调用数据时为空 */
  successRate: number | null;
  /** 全部调用日志平均响应耗时，单位毫秒，无调用数据时为空 */
  averageResponseTimeMs: number | null;
}
