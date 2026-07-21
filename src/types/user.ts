/**
 * 用户领域类型定义，包含用户信息、密钥、登录注册等请求结构。
 */

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

/** 登录请求参数 */
export interface LoginRequest {
  /** 用户账号 */
  userAccount: string;
  /** 用户密码 */
  userPassword: string;
}

/** 注册请求参数 */
export interface RegisterRequest {
  /** 用户账号 */
  userAccount: string;
  /** 用户密码 */
  userPassword: string;
  /** 确认密码 */
  checkPassword: string;
}

/** 当前用户资料更新请求 */
export interface CurrentUserProfileUpdateRequest {
  /** 用户名 */
  userName: string;
  /** 性别 */
  gender: number;
}

/** 当前用户密码更新请求 */
export interface CurrentUserPasswordUpdateRequest {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认密码 */
  checkPassword: string;
}
