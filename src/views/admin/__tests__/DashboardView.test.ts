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

vi.mock('@/services/dashboard', () => ({ dashboardService: dashboardMocks }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ loginUser: null }) }));
vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRouter: () => ({ push: dashboardMocks.push }),
}));

const emptyTrends = { successRate: [], invocationCount: [], errorRate: [], responseTime: [] };

const mockSuccessfulResponses = () => {
  dashboardMocks.getOverview.mockResolvedValue({
    totalInterfaces: 6,
    onlineInterfaces: 4,
    offlineInterfaces: 2,
    todayInvocations: 12580,
    todayErrors: 3,
    abnormalInterfaces: 1,
  });
  dashboardMocks.getTrends.mockResolvedValue(emptyTrends);
  dashboardMocks.getAlerts.mockResolvedValue([]);
  dashboardMocks.getChanges.mockResolvedValue([]);
};

describe('DashboardView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('后端失败时显示占位符，不显示伪造数值', async () => {
    dashboardMocks.getOverview.mockRejectedValue(new Error('服务异常'));
    dashboardMocks.getTrends.mockRejectedValue(new Error('服务异常'));
    dashboardMocks.getAlerts.mockRejectedValue(new Error('服务异常'));
    dashboardMocks.getChanges.mockRejectedValue(new Error('服务异常'));

    const wrapper = mount(DashboardView, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
    await flushPromises();

    expect(wrapper.findAll('.fei-overview-card__value').map((item) => item.text()))
      .toEqual(['--', '--', '--', '--', '--', '--']);
    expect(wrapper.text()).toContain('概览统计、运行趋势、重点关注、最近变更加载失败');
    expect(wrapper.text()).not.toContain('12580');
  });

  it('挂载时请求四个真实工作台区块', async () => {
    mockSuccessfulResponses();
    const wrapper = mount(DashboardView, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
    await flushPromises();

    expect(dashboardMocks.getOverview).toHaveBeenCalledOnce();
    expect(dashboardMocks.getTrends).toHaveBeenCalledOnce();
    expect(dashboardMocks.getAlerts).toHaveBeenCalledOnce();
    expect(dashboardMocks.getChanges).toHaveBeenCalledOnce();
    expect(wrapper.text()).not.toContain('模拟数据');
  });

  it('单个区块失败时保留其他真实区块数据', async () => {
    mockSuccessfulResponses();
    dashboardMocks.getAlerts.mockRejectedValue(new Error('告警服务异常'));

    const wrapper = mount(DashboardView, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
    await flushPromises();

    expect(wrapper.findAll('.fei-overview-card__value').map((item) => item.text()))
      .toEqual(['6', '4', '2', '12.6k', '3', '1']);
    expect(wrapper.text()).toContain('重点关注加载失败');
  });

  it('点击刷新时重新请求四个区块', async () => {
    mockSuccessfulResponses();
    const wrapper = mount(DashboardView, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
    await flushPromises();
    await wrapper.find('button.fei-quick-action').trigger('click');
    await flushPromises();

    expect(dashboardMocks.getOverview).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getTrends).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getAlerts).toHaveBeenCalledTimes(2);
    expect(dashboardMocks.getChanges).toHaveBeenCalledTimes(2);
  });

  it('点击告警时跳转接口详情', async () => {
    mockSuccessfulResponses();
    dashboardMocks.getAlerts.mockResolvedValue([
      { id: 7, name: '异常接口', alertType: 'abnormal', description: '状态异常', time: new Date().toISOString() },
    ]);
    const wrapper = mount(DashboardView, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });
    await flushPromises();
    await wrapper.find('.fei-alert-item').trigger('click');

    expect(dashboardMocks.push).toHaveBeenCalledWith('/interface/7');
  });
});
