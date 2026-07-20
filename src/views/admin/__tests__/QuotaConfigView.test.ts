import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuotaConfigView from '../QuotaConfigView.vue';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock('@/services/interfaceQuotaConfig', () => ({
  interfaceQuotaConfigService: {
    list: mocks.list,
  },
}));

/** 配额配置页面公共挂载配置。 */
const global = {
  stubs: {
    ReloadOutlined: true,
  },
};

/** 构造三种配额配置。 */
const buildQuotaConfigs = () => [
  {
    quotaType: 'BASIC_QUOTA',
    quotaTypeText: '后端基础额度',
    initialQuota: 100,
    limited: true,
    updateTime: '2026-07-20T10:00:00',
  },
  {
    quotaType: 'FREE_UNLIMITED',
    initialQuota: 0,
    limited: false,
    updateTime: '2026-07-20T10:00:00',
  },
  {
    quotaType: 'ADVANCED_TRIAL',
    initialQuota: 20,
    limited: true,
    updateTime: '2026-07-20T10:00:00',
  },
];

describe('配额策略配置页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue(buildQuotaConfigs());
  });

  it('使用共享规则展示配额名称、标签和编辑状态', async () => {
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    const cards = wrapper.findAll('.fei-quota-config-card');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.get('.fei-tag').text())).toEqual([
      '基础额度',
      '免费无限',
      '高级体验',
    ]);
    expect(cards.map((card) => card.get('.fei-tag').classes())).toEqual([
      ['fei-tag', 'fei-tag--quota-basic'],
      ['fei-tag', 'fei-tag--quota-free'],
      ['fei-tag', 'fei-tag--quota-trial'],
    ]);
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    expect(cards[1].get('.fei-quota-edit-value').text()).toBe('无限次');

    await cards[0].get('button').trigger('click');
    expect(wrapper.emitted('show-toast')).toContainEqual([
      '保存配额策略: BASIC_QUOTA',
      'info',
    ]);
    wrapper.unmount();
  });

  it('点击刷新时重新加载配额配置', async () => {
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    await wrapper.get('.fei-card-header button').trigger('click');
    await flushPromises();

    expect(mocks.list).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('空响应时展示空状态', async () => {
    mocks.list.mockResolvedValue(null);
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    expect(wrapper.findAll('.fei-quota-config-card')).toHaveLength(0);
    expect(wrapper.get('.fei-empty').text()).toBe('暂无配额策略数据');
    wrapper.unmount();
  });

  it('加载失败时清空列表并发送错误通知', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.list.mockRejectedValue(new Error('配额服务异常'));
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    expect(wrapper.findAll('.fei-quota-config-card')).toHaveLength(0);
    expect(wrapper.emitted('show-toast')).toEqual([
      ['配额策略加载失败', 'error'],
    ]);

    consoleError.mockRestore();
    wrapper.unmount();
  });
});
