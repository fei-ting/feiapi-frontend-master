import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DashboardView from '../DashboardView.vue';

const dashboardMocks = vi.hoisted(() => ({
  getOverview: vi.fn(),
  getTrends: vi.fn(),
  getAlerts: vi.fn(),
  getChanges: vi.fn(),
}));

vi.mock('@/services/dashboard', () => ({
  dashboardService: dashboardMocks,
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ loginUser: null }),
}));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRouter: () => ({ push: vi.fn() }),
}));

describe('DashboardView', () => {
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
});
