/**
 * 接口信息领域类型定义，包含接口视图对象、查询参数和增改请求。
 */

import type { InterfaceQuotaType } from '@/types/quota';
import type { SortOrder } from '@/types/common';

/** 接口信息视图对象 */
export interface InterfaceInfoVO {
  /** 主键 */
  id: number;
  /** 接口名称 */
  name: string;
  /** SDK 方法名 */
  sdkMethodName?: string;
  /** 接口描述 */
  description?: string;
  /** 接口展示地址 */
  url?: string;
  /** 网关匹配路径 */
  path?: string;
  /** 真实后端服务地址 */
  targetHost?: string;
  /** 请求参数模板 */
  requestParams?: string;
  /** 请求头文档 */
  requestHeader?: string;
  /** 响应头文档 */
  responseHeader?: string;
  /** 接口状态（0-下线，1-上线，2-发布验证中） */
  status?: number;
  /** HTTP 请求方法 */
  method?: string;
  /** 配额类型 */
  quotaType?: InterfaceQuotaType;
  /** 配额类型说明 */
  quotaTypeText?: string;
  /** 初始额度 */
  initialQuota?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 累计调用次数 */
  totalNum?: number;
}

/**
 * 接口分页查询参数
 */
export interface InterfaceQuery {
  /** 当前页码，从 1 开始 */
  current?: number;
  /** 每页大小，默认 10 */
  pageSize?: number;
  /** 接口名称，模糊搜索 */
  name?: string;
  /** 接口状态（0-下线，1-上线，2-发布验证中） */
  status?: number | string;
  /** 配额类型 */
  quotaType?: InterfaceQuotaType;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: SortOrder;
  /** 接口描述，模糊搜索 */
  description?: string;
}

/**
 * 接口信息新增请求
 */
export interface InterfaceInfoAddRequest {
  /** 接口名称，最大 50 字符 */
  name: string;
  /** 接口描述，最大 512 字符 */
  description?: string;
  /** 接口展示地址，最大 512 字符 */
  url?: string;
  /** 接口路径（网关匹配），如 /api/xxx，最大 512 字符 */
  path: string;
  /** 真实后端服务地址，如 http://localhost:8080，最大 512 字符 */
  targetHost: string;
  /** 请求参数文档 */
  requestParams?: string;
  /** 请求头文档 */
  requestHeader?: string;
  /** 响应头文档 */
  responseHeader?: string;
  /** HTTP 请求方法（GET/POST/PUT/DELETE） */
  method: string;
  /** 接口配额类型 */
  quotaType?: InterfaceQuotaType;
  /** SDK 方法名 */
  sdkMethodName?: string;
}

/**
 * 接口信息更新请求
 * 只有 id 必填，其余字段均为可选
 */
export interface InterfaceInfoUpdateRequest {
  /** 接口 ID（必填） */
  id: number;
  /** 接口名称，最大 50 字符 */
  name?: string;
  /** 接口描述，最大 512 字符 */
  description?: string;
  /** 接口展示地址，最大 512 字符 */
  url?: string;
  /** 接口路径（网关匹配），最大 512 字符 */
  path?: string;
  /** 真实后端服务地址，最大 512 字符 */
  targetHost?: string;
  /** 请求参数文档 */
  requestParams?: string;
  /** 请求头文档 */
  requestHeader?: string;
  /** 响应头文档 */
  responseHeader?: string;
  /** HTTP 请求方法（GET/POST/PUT/DELETE） */
  method?: string;
  /** 接口配额类型 */
  quotaType?: InterfaceQuotaType;
  /** SDK 方法名 */
  sdkMethodName?: string;
}
