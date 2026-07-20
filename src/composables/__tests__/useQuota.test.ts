import { describe, expect, it } from 'vitest';
import {
  QUOTA_TYPE_OPTIONS,
  getInitialQuotaText,
  getInterfaceStatusText,
  getQuotaLeftText,
  getQuotaTagClass,
  getQuotaTypeText,
  getUserInterfaceStatusText,
  isFreeUnlimited,
  useQuota,
} from '../useQuota';

describe('配额展示规则', () => {
  it('提供固定顺序的共享配额类型选项', () => {
    expect(QUOTA_TYPE_OPTIONS).toEqual([
      { value: 'BASIC_QUOTA', label: '基础额度' },
      { value: 'FREE_UNLIMITED', label: '免费无限' },
      { value: 'ADVANCED_TRIAL', label: '高级体验' },
    ]);
  });

  it.each([
    ['FREE_UNLIMITED', undefined, '免费无限'],
    ['ADVANCED_TRIAL', undefined, '高级体验'],
    ['BASIC_QUOTA', undefined, '基础额度'],
    ['BASIC_QUOTA', '新手额度', '新手额度'],
    [undefined, '自定义额度', '自定义额度'],
    [undefined, undefined, '基础额度'],
  ])('格式化配额类型文本 %#', (quotaType, quotaTypeText, expected) => {
    expect(getQuotaTypeText(quotaType, quotaTypeText)).toBe(expected);
  });

  it.each([
    ['FREE_UNLIMITED', 'fei-tag--quota-free'],
    ['ADVANCED_TRIAL', 'fei-tag--quota-trial'],
    ['BASIC_QUOTA', 'fei-tag--quota-basic'],
    [undefined, 'fei-tag--quota-basic'],
  ])('格式化配额标签样式 %#', (quotaType, expected) => {
    expect(getQuotaTagClass(quotaType)).toBe(expected);
  });

  it('格式化初始额度和剩余额度', () => {
    expect(isFreeUnlimited('FREE_UNLIMITED')).toBe(true);
    expect(isFreeUnlimited('BASIC_QUOTA')).toBe(false);
    expect(getInitialQuotaText('FREE_UNLIMITED', 10)).toBe('无限次');
    expect(getInitialQuotaText('BASIC_QUOTA', 10)).toBe('10 次');
    expect(getInitialQuotaText()).toBe('0 次');
    expect(getQuotaLeftText('FREE_UNLIMITED', 10)).toBe('无限次');
    expect(getQuotaLeftText('ADVANCED_TRIAL', 5)).toBe('5 次体验');
    expect(getQuotaLeftText('BASIC_QUOTA')).toBe('0 次');
  });

  it('格式化接口状态和用户接口状态', () => {
    expect([1, 2, 0].map(getInterfaceStatusText)).toEqual(['已上线', '发布验证中', '已下线']);
    expect([1, 2, 0].map(getUserInterfaceStatusText)).toEqual(['可调用', '发布验证中', '暂不可调用']);
  });

  it('通过组合式函数暴露全部配额操作', () => {
    expect(useQuota()).toEqual({
      isFreeUnlimited,
      getQuotaTypeText,
      getQuotaTagClass,
      getInitialQuotaText,
      getQuotaLeftText,
      getInterfaceStatusText,
      getUserInterfaceStatusText,
    });
  });
});
