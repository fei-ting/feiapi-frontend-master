import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TrendChart from '../TrendChart.vue';
import type { DashboardTrends } from '@/types/dashboard';

/** 创建包含四类数据的趋势测试数据。 */
const createTrends = (): DashboardTrends => ({
  successRate: [
    { label: '00:00', value: 10 },
    { label: '06:00', value: 20 },
  ],
  invocationCount: [{ label: '00:00', value: 125 }],
  errorRate: [{ label: '00:00', value: 5 }],
  responseTime: [{ label: '00:00', value: 320 }],
});

/** 创建四类趋势均为空的测试数据。 */
const createEmptyTrends = (): DashboardTrends => ({
  successRate: [],
  invocationCount: [],
  errorRate: [],
  responseTime: [],
});

describe('TrendChart', () => {
  it('展示当前趋势最新值、Y 轴刻度和柱状图高度', () => {
    const wrapper = mount(TrendChart, {
      props: { trends: createTrends(), activeTrend: 'successRate' },
    });

    expect(wrapper.find('.fei-trend-tab.is-active').text()).toBe('成功率');
    expect(wrapper.find('.fei-trend-summary__value').text()).toBe('20%');
    expect(wrapper.find('.fei-chart-y-axis span').text()).toBe('20');
    expect(wrapper.findAll('.fei-chart-bar')).toHaveLength(2);
    expect(wrapper.findAll('.fei-chart-bar')[0].attributes('style')).toContain('height: 50%');
    expect(wrapper.findAll('.fei-chart-bar')[1].attributes('style')).toContain('height: 100%');
  });

  it('点击趋势标签时发送类型安全的切换事件', async () => {
    const wrapper = mount(TrendChart, {
      props: { trends: createTrends(), activeTrend: 'successRate' },
    });

    await wrapper.findAll('.fei-trend-tab')[1].trigger('click');

    expect(wrapper.emitted('update:activeTrend')).toEqual([['invocationCount']]);
  });

  it('调用量超过一百时将Y轴向上取整到百位', () => {
    const wrapper = mount(TrendChart, {
      props: { trends: createTrends(), activeTrend: 'invocationCount' },
    });

    expect(wrapper.find('.fei-chart-y-axis span').text()).toBe('200');
    expect(wrapper.find('.fei-trend-summary__value').text()).toBe('125');
  });

  it('趋势为空时显示默认刻度且不渲染数据柱', () => {
    const wrapper = mount(TrendChart, {
      props: { trends: createEmptyTrends(), activeTrend: 'successRate' },
    });

    expect(wrapper.find('.fei-trend-summary__value').text()).toBe('-%');
    expect(wrapper.find('.fei-chart-y-axis span').text()).toBe('100');
    expect(wrapper.findAll('.fei-chart-bar')).toHaveLength(0);
    expect(wrapper.findAll('.fei-chart-x-axis span')).toHaveLength(0);
  });
});
