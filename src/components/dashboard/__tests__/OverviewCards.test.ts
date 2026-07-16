import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import OverviewCards from '../OverviewCards.vue';
import type { DashboardOverview } from '@/types/dashboard';

/** 完整概览测试数据。 */
const overview: DashboardOverview = {
  totalInterfaces: 6,
  onlineInterfaces: 4,
  offlineInterfaces: 2,
  todayInvocations: 12580,
  todayErrors: 3,
  abnormalInterfaces: 1,
};

describe('OverviewCards', () => {
  it('按固定顺序展示六项概览数据并格式化调用量', () => {
    const wrapper = mount(OverviewCards, { props: { overview } });

    const values = wrapper.findAll('.fei-overview-card__value').map((item) => item.text());
    expect(values).toEqual(['6', '4', '2', '12.6k', '3', '1']);
  });

  it('概览为空时六张卡片全部显示占位符', () => {
    const wrapper = mount(OverviewCards, { props: { overview: null } });

    const values = wrapper.findAll('.fei-overview-card__value').map((item) => item.text());
    expect(values).toEqual(['--', '--', '--', '--', '--', '--']);
  });

  it('运行时字段缺失时仅缺失项显示占位符', () => {
    const partialOverview = { totalInterfaces: 6 } as DashboardOverview;
    const wrapper = mount(OverviewCards, { props: { overview: partialOverview } });

    const values = wrapper.findAll('.fei-overview-card__value').map((item) => item.text());
    expect(values).toEqual(['6', '--', '--', '--', '--', '--']);
  });
});
