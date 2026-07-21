/**
 * 接口文档领域类型定义，包含文档视图对象、参数、错误码和保存请求。
 */

import type { InterfaceQuotaType } from '@/types/quota';

/**
 * 接口文档页面使用的接口基础信息
 */
export interface InterfaceDocInterfaceInfoVO {
  /** 主键 */
  id: number;
  /** 接口名称 */
  name: string;
  /** SDK 方法名 */
  sdkMethodName?: string;
  /** 接口描述 */
  description?: string;
  /** 接口展示地址，仅管理员可见 */
  url?: string;
  /** 网关匹配路径 */
  path?: string;
  /** 真实后端服务地址，仅管理员可见 */
  targetHost?: string;
  /** 接口状态 */
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
 * 接口文档主信息
 */
export interface InterfaceDocVO {
  /** 主键 */
  id?: number;
  /** 接口信息 ID */
  interfaceInfoId?: number;
  /** 文档版本 */
  docVersion?: string;
  /** 请求内容类型 */
  requestContentType?: string;
  /** 响应内容类型 */
  responseContentType?: string;
  /** 鉴权说明 */
  authDescription?: string;
  /** 成功响应示例 */
  successExample?: string;
  /** 失败响应示例 */
  failExample?: string;
  /** 文档备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 接口文档参数
 */
export interface InterfaceDocParamVO {
  /** 主键 */
  id?: number;
  /** 接口信息 ID */
  interfaceInfoId?: number;
  /** 参数场景 */
  paramScene?: 'HEADER' | 'QUERY' | 'BODY' | 'RESPONSE' | string;
  /** 父级字段 ID */
  parentId?: number;
  /** 参数名称 */
  name?: string;
  /** 参数类型 */
  type?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否允许为空 */
  nullable?: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 示例值 */
  exampleValue?: string;
  /** 参数说明 */
  description?: string;
  /** 校验规则 */
  validationRule?: string;
  /** 排序值 */
  sortOrder?: number;
}

/**
 * 接口文档错误码
 */
export interface InterfaceDocErrorCodeVO {
  /** 主键 */
  id?: number;
  /** 接口信息 ID */
  interfaceInfoId?: number;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 错误说明 */
  description?: string;
  /** 解决建议 */
  solution?: string;
  /** 排序值 */
  sortOrder?: number;
}

/**
 * 接口文档聚合详情
 */
export interface InterfaceDocDetailVO {
  /** 接口基础信息 */
  interfaceInfo: InterfaceDocInterfaceInfoVO;
  /** 文档主信息 */
  doc?: InterfaceDocVO;
  /** 网关调用地址 */
  gatewayUrl?: string;
  /** 是否缺少结构化文档 */
  structuredDocMissing?: boolean;
  /** 请求 Header 列表 */
  requestHeaders?: InterfaceDocParamVO[];
  /** 请求参数列表 */
  requestParams?: InterfaceDocParamVO[];
  /** 响应参数列表 */
  responseParams?: InterfaceDocParamVO[];
  /** 错误码列表 */
  errorCodes?: InterfaceDocErrorCodeVO[];
  /** curl 示例 */
  curlExample?: string;
}

/** 接口文档参数保存请求 */
export interface InterfaceDocParamSaveRequest {
  /** 本次保存中的参数唯一键 */
  paramKey: string;
  /** 父级参数键 */
  parentParamKey?: string;
  /** 参数场景 */
  paramScene: 'QUERY' | 'BODY' | 'RESPONSE';
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: string;
  /** 是否必填 */
  required: boolean;
  /** 是否允许为空 */
  nullable?: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 示例值 */
  exampleValue?: string;
  /** 参数说明 */
  description?: string;
  /** 校验规则 */
  validationRule?: string;
  /** 排序值 */
  sortOrder: number;
}

/** 接口文档错误码保存请求 */
export interface InterfaceDocErrorCodeSaveRequest {
  /** 错误码 */
  errorCode: string;
  /** 错误信息 */
  errorMessage: string;
  /** 公开错误说明 */
  description?: string;
  /** 解决建议 */
  solution?: string;
  /** 排序值 */
  sortOrder: number;
}

/** 接口文档聚合保存请求 */
export interface InterfaceDocSaveRequest {
  /** 接口信息 ID */
  interfaceInfoId: number;
  /** 文档版本 */
  docVersion: string;
  /** 请求内容类型 */
  requestContentType: string;
  /** 响应内容类型 */
  responseContentType: string;
  /** 成功响应示例 */
  successExample?: string;
  /** 失败响应示例 */
  failExample?: string;
  /** 公开备注 */
  remark?: string;
  /** 全量文档参数 */
  params: InterfaceDocParamSaveRequest[];
  /** 全量错误码 */
  errorCodes: InterfaceDocErrorCodeSaveRequest[];
}
