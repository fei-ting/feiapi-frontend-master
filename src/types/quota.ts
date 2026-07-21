/**
 * 配额领域类型定义，包含配额类型、用户接口信息和配额配置。
 */

/** 接口配额类型 */
export type InterfaceQuotaType = 'FREE_UNLIMITED' | 'BASIC_QUOTA' | 'ADVANCED_TRIAL';

/** 用户接口信息视图对象 */
export interface UserInterfaceInfoVO {
  /** 主键 */
  id?: number;
  /** 用户 ID */
  userId?: number;
  /** 接口信息 ID */
  interfaceInfoId?: number;
  /** 接口名称 */
  interfaceName?: string;
  /** 接口路径 */
  interfacePath?: string;
  /** HTTP 请求方法 */
  method?: string;
  /** 接口状态 */
  interfaceStatus?: number;
  /** 配额类型 */
  quotaType?: InterfaceQuotaType;
  /** 配额类型说明 */
  quotaTypeText?: string;
  /** 初始额度 */
  initialQuota?: number;
  /** 累计调用次数 */
  totalNum?: number;
  /** 剩余额度 */
  leftNum?: number;
  /** 用户接口状态 */
  status?: number;
  /** 用户名 */
  userName?: string;
  /** 更新时间 */
  updateTime?: string;
}

/** 接口配额配置视图对象 */
export interface InterfaceQuotaConfigVO {
  /** 主键 */
  id?: number;
  /** 配额类型 */
  quotaType: InterfaceQuotaType;
  /** 配额类型说明 */
  quotaTypeText?: string;
  /** 初始发放额度 */
  initialQuota: number;
  /** 配额说明 */
  description?: string;
  /** 是否受限 */
  limited?: boolean;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
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
