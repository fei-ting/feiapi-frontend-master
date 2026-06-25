export interface ResponseData<T> {
  code: number;
  data: T;
  message: string;
}

export interface UserVO {
  id: number;
  userName?: string;
  userAccount?: string;
  userAvatar?: string;
  userRole?: string;
  accessKey?: string;
  secretKey?: string;
  createTime?: string;
}

export interface InterfaceInfoVO {
  id: number;
  name: string;
  description?: string;
  url?: string;
  path?: string;
  targetHost?: string;
  requestParams?: string;
  requestHeader?: string;
  responseHeader?: string;
  status?: number;
  method?: string;
  createTime?: string;
  updateTime?: string;
  totalNum?: number;
}

export interface UserInterfaceInfoVO {
  id: number;
  userId?: number;
  interfaceInfoId?: number;
  interfaceName?: string;
  totalNum?: number;
  leftNum?: number;
  status?: number;
  userName?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export interface LoginRequest {
  userAccount: string;
  userPassword: string;
}

export interface RegisterRequest {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

export interface InvokeRequest {
  id: number;
  userRequestParams?: string;
}

export interface IdRequest {
  id: number;
}

export interface InterfaceQuery {
  current?: number;
  pageSize?: number;
  status?: number | string;
  /** 接口描述，用于模糊搜索 */
  description?: string;
}

/**
 * 接口信息更新请求
 * 只有 id 必填，其余字段均为可选
 */
export interface InterfaceInfoUpdateRequest {
  /** 接口 ID（必填） */
  id: number;
  /** 接口名称 */
  name?: string;
  /** 接口描述 */
  description?: string;
  /** 接口展示地址 */
  url?: string;
  /** 接口路径（网关匹配） */
  path?: string;
  /** 真实后端服务地址 */
  targetHost?: string;
  /** 请求参数文档 */
  requestParams?: string;
  /** 请求头文档 */
  requestHeader?: string;
  /** 响应头文档 */
  responseHeader?: string;
  /** HTTP 请求方法 */
  method?: string;
}
