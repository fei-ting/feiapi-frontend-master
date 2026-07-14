/**
 * 统一响应数据结构。
 *
 * @template T 响应数据类型
 */
export interface ResponseData<T> {
  /** 响应状态码，0 表示成功 */
  code: number;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

/** 用户视图对象 */
export interface UserVO {
  /** 主键 */
  id: number;
  /** 用户名 */
  userName?: string;
  /** 用户账号 */
  userAccount?: string;
  /** 用户头像 */
  userAvatar?: string;
  /** 性别（0-未知，1-男，2-女） */
  gender?: number;
  /** 用户角色（user/admin） */
  userRole?: string;
  /** 访问密钥 */
  accessKey?: string;
  /** 密钥 */
  secretKey?: string;
  /** 创建时间 */
  createTime?: string;
}

/** 用户密钥视图对象 */
export interface UserKeyVO {
  /** 访问密钥 */
  accessKey?: string;
  /** 密钥 */
  secretKey?: string;
}

/** 接口配额类型 */
export type InterfaceQuotaType = 'FREE_UNLIMITED' | 'BASIC_QUOTA' | 'ADVANCED_TRIAL';

/** 接口信息视图对象 */
export interface InterfaceInfoVO {
  /** 主键 */
  id: number;
  /** 接口名称 */
  name: string;
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
 * 接口文档页面使用的接口基础信息
 */
export interface InterfaceDocInterfaceInfoVO {
  /** 主键 */
  id: number;
  /** 接口名称 */
  name: string;
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

export interface UserInterfaceInfoVO {
  id?: number;
  userId?: number;
  interfaceInfoId?: number;
  interfaceName?: string;
  interfacePath?: string;
  method?: string;
  interfaceStatus?: number;
  quotaType?: InterfaceQuotaType;
  quotaTypeText?: string;
  initialQuota?: number;
  totalNum?: number;
  leftNum?: number;
  status?: number;
  userName?: string;
  updateTime?: string;
}

export interface InterfaceQuotaConfigVO {
  id?: number;
  quotaType: InterfaceQuotaType;
  quotaTypeText?: string;
  initialQuota: number;
  description?: string;
  limited?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export type SortOrder = 'ascend' | 'descend';

export interface LoginRequest {
  userAccount: string;
  userPassword: string;
}

export interface RegisterRequest {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

export interface CurrentUserProfileUpdateRequest {
  userName: string;
  gender: number;
}

export interface CurrentUserPasswordUpdateRequest {
  oldPassword: string;
  newPassword: string;
  checkPassword: string;
}

export interface InvokeRequest {
  id: number;
  userRequestParams?: string;
}

export interface IdRequest {
  id: number;
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

/**
 * 接口配额配置更新请求
 */
export interface InterfaceQuotaConfigUpdateRequest {
  /** 配额类型 */
  quotaType: InterfaceQuotaType;
  /** 初始发放额度，必须大于 0 */
  initialQuota: number;
}
