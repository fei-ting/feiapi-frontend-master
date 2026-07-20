/**
 * 配额相关组合式函数
 * 提供配额类型、状态格式化等纯函数
 */

import type { InterfaceQuotaType } from '@/types/api';

/** 配额类型选项。 */
export interface QuotaTypeOption {
  /** 配额类型。 */
  readonly value: InterfaceQuotaType;
  /** 配额类型中文名称。 */
  readonly label: string;
}

/** 配额类型只读选项。 */
export const QUOTA_TYPE_OPTIONS: readonly QuotaTypeOption[] = Object.freeze([
  Object.freeze({ value: 'BASIC_QUOTA', label: '基础额度' }),
  Object.freeze({ value: 'FREE_UNLIMITED', label: '免费无限' }),
  Object.freeze({ value: 'ADVANCED_TRIAL', label: '高级体验' }),
]);

/** 默认配额类型选项。 */
const DEFAULT_QUOTA_TYPE_OPTION = QUOTA_TYPE_OPTIONS[0];

/**
 * 判断是否为免费无限配额
 * @param quotaType 配额类型
 * @returns 是否为免费无限
 */
export const isFreeUnlimited = (quotaType?: string): boolean => {
  return quotaType === 'FREE_UNLIMITED';
};

/**
 * 获取配额类型文本
 * @param quotaType 配额类型
 * @param quotaTypeText 可选的配额类型文本
 * @returns 配额类型文本
 */
export const getQuotaTypeText = (quotaType?: string, quotaTypeText?: string): string => {
  const quotaTypeOption = QUOTA_TYPE_OPTIONS.find((option) => option.value === quotaType);
  if (quotaTypeOption && quotaTypeOption.value !== 'BASIC_QUOTA') {
    return quotaTypeOption.label;
  }
  return quotaTypeText || quotaTypeOption?.label || DEFAULT_QUOTA_TYPE_OPTION.label;
};

/**
 * 获取配额标签样式类
 * @param quotaType 配额类型
 * @returns 样式类名
 */
export const getQuotaTagClass = (quotaType?: string): string => {
  if (quotaType === 'FREE_UNLIMITED') return 'fei-tag--quota-free';
  if (quotaType === 'ADVANCED_TRIAL') return 'fei-tag--quota-trial';
  return 'fei-tag--quota-basic';
};

/**
 * 获取初始额度文本
 * @param quotaType 配额类型
 * @param initialQuota 初始额度
 * @returns 初始额度文本
 */
export const getInitialQuotaText = (quotaType?: string, initialQuota?: number): string => {
  if (isFreeUnlimited(quotaType)) return '无限次';
  return `${initialQuota ?? 0} 次`;
};

/**
 * 获取剩余额度文本
 * @param quotaType 配额类型
 * @param leftNum 剩余额度
 * @returns 剩余额度文本
 */
export const getQuotaLeftText = (quotaType?: string, leftNum?: number): string => {
  if (isFreeUnlimited(quotaType)) return '无限次';
  if (quotaType === 'ADVANCED_TRIAL') return `${leftNum ?? 0} 次体验`;
  return `${leftNum ?? 0} 次`;
};

/**
 * 获取接口状态文本
 * @param status 接口状态
 * @returns 状态文本
 */
export const getInterfaceStatusText = (status?: number): string => {
  if (status === 1) return '已上线';
  if (status === 2) return '发布验证中';
  return '已下线';
};

/**
 * 获取用户接口状态文本
 * @param status 接口状态
 * @returns 状态文本
 */
export const getUserInterfaceStatusText = (status?: number): string => {
  if (status === 1) return '可调用';
  if (status === 2) return '发布验证中';
  return '暂不可调用';
};

/**
 * 配额组合式函数
 * 提供配额相关的格式化方法
 */
export function useQuota() {
  return {
    isFreeUnlimited,
    getQuotaTypeText,
    getQuotaTagClass,
    getInitialQuotaText,
    getQuotaLeftText,
    getInterfaceStatusText,
    getUserInterfaceStatusText,
  };
}
