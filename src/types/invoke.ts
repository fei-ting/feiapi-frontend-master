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

/** 在线调用响应结果。 */
export interface InvokeResponse {
  /** 下游 HTTP 响应是否为 2xx。 */
  successful: boolean;
  /** 下游 HTTP 状态码，未收到响应时为空。 */
  statusCode?: number;
  /** 调用耗时，单位为毫秒。 */
  durationMs: number;
  /** 响应媒体类型。 */
  contentType?: string;
  /** 下游响应正文。 */
  body?: string;
  /** 未收到 HTTP 响应时的安全错误信息。 */
  errorMessage?: string;
}
