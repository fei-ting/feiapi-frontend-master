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
}
