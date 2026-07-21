/**
 * 在线调用页面相关类型定义。
 */

/** 在线调用结果区域的活动标签。 */
export type InvokeTab = 'result' | 'doc';

/** 接口调用请求参数 */
export interface InvokeRequest {
  /** 接口 ID */
  id: number;
  /** 用户请求参数 */
  userRequestParams?: string;
}
