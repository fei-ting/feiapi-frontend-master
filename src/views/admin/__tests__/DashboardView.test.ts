import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardView from '../DashboardView.vue';

const dashboardMocks = vi.hoisted(() => ({
  getOverview: vi.fn(),
  getTrends: vi.fn(),
  getAlerts: vi.fn(),
  getChanges: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/services/dashboard', () => ({
  dashboardService: dashboardMocks,
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ loginUser: null }),
}));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRouter: () => ({ push: dashboardMocks.push }),
}));

/** 创建四类趋势均为空的响应数据。 */
const emptyTrends = {
  successRate: [],
  invocationCount: [],
  errorRate: [],
  responseTime: [],
};

/** 设置四个 Dashboard 服务的成功响应。 */
const mockSuccessfulResponses = (source: 'real' | 'mock' = 'real') => {
  dashboardMocks.getOverview.mockResolvedValue({
    data: {
      totalInterfaces: 6,
      onlineInterfaces: 4,
      offlineInterfaces: 2,
      todayInvocations: 12580,
      todayErrors: 3,
      abnormalInterfaces: 1,
    },
    source,
  });
  dashboardMocks.getTrends.mockResolvedValue({ data: emptyTrends, source });
  dashboardMocks.getAlerts.mockResolvedValue({ data: [], source });
  dashboardMocks.getChanges.mockResolvedValue({ data: [], source });
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('错误状态下概览指标显示占位符而不显示伪造数值', async () => {
    dashboardMocks.getOverview.mockResolvedValue({ data: null, source: 'error' });
    dashboardMocks.getTrends.mockResolvedValue({ data: null, source: 'error' });
    dashboardMocks.getAlerts.mockResolvedValue({ data: null, source: 'error' });
    dashboardMocks.getChanges.mockResolvedValue({ data: null, source: 'error' });

    const wrapper = mount(DashboardView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    const overviewValues = wrapper.findAll('.fei-overview-card__value');
    expect(overviewValues).toHaveLength(6);
    expect(overviewValues.map((item) => item.text())).toEqual(['--', '--', '--', '--', '--', '--']);
    expect(wrapper.text()).toContain('数据加载失败');
    expect(wrapper.text()).toContain('当前未显示不可用指标');
    expect(wrapper.text()).not.toContain('12');
    expect(wrapper.text()).not.toContain('12580');
  });

  it('挂载时调用四个服务并按优先级显示Mock提示', async () => {
    mockSuccessfulResponses();
    dashboardMocks.getTrends.mockResolvedValue({ data: emptyTrends, source: 'mock' });

    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    expect(dashboardMocks.getOverview).toHaveBeenCalledOnce();
    expect(dashboardMocks.getTrends).toHaveBeenCalledOnce();
    expect(dashboardMocks.getAlerts).toHaveBeenCalledOnce();
    expect(dashboardMocks.getChanges).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('当前为开发模式，显示模拟数据');
    expect(wrapper.text()).not.toContain('数据加载失败');
  });

  it('错误来源优先于Mock来源', async () => {
    mockSuccessfulResponses('mock');
    dashboardMocks.getAlerts.mockResolvedValue({ data: [], source: 'error' });

    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('数据加载失败');
    expect(wrapper.text()).not.toContain('当前为开发模式，显示模拟数据');
    expect(wrapper.findAll('.fei-overview-card__value').map((item) => item.text())).toEqual([
      '6', '4', '2', '12.6k', '3', '1',
    ]);
  });

  it('服务抛出异常时清空数据并显示错误提示', async () => {
    mockSuccessfulResponses();
    dashboardMocks.getOverview.mockRejectedValue(new Error('服务异常'));

    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    expect(wrapper.findAll('.fei-overview-card__value').map((item) => item.text())).toEqual([
      '--', '--', '--', '--', '--', '--',
    ]);
    expect(wrapper.text()).toContain('数据加载失败');
  });

  it('点击刷新操作时重新调用四个服务', async () => {
    mockSuccessfulResponses();
    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    await wrapper.find('button.fei-quick-action').trigger('click');
    await flushPromises();

    expect(dashboardMocks.getOverview).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getTrends).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getAlerts).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getChanges).toHaveBeenCalledTimes(2);
  });

  it('点击告警时由父页面跳转到接口详情', async () => {
    mockSuccessfulResponses();
    dashboardMocks.getAlerts.mockResolvedValue({
      data: [{ id: 7, name: '异常接口', alertType: 'abnormal', description: '状态异常', time: '刚刚' }],
      source: 'real',
    });
    const wrapper = mount(DashboardView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    });
    await flushPromises();

    await wrapper.find('.fei-alert-item').trigger('click');

    expect(dashboardMocks.push).toHaveBeenCalledWith('/interface/7');
  });
});
