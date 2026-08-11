import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuotaConfigView from '../QuotaConfigView.vue';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/services/interfaceQuotaConfig', () => ({
  interfaceQuotaConfigService: {
    list: mocks.list,
    update: mocks.update,
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
    mocks.update.mockResolvedValue(true);
  });

  it('使用共享规则展示配额名称、标签和编辑状态', async () => {
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    const cards = wrapper.findAll('.fei-quota-config-card');
    expect(cards).toHaveLength(3);
    expect(wrapper.find('.fei-card').exists()).toBe(false);
    expect(wrapper.get('.fei-quota-config-grid').exists()).toBe(true);
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
    expect(wrapper.findAll('.fei-quota-config-card__save')).toHaveLength(2);
    expect(cards.map((card) => card.get('.fei-quota-edit-value').text())).toEqual([
      '100',
      '无限次',
      '20',
    ]);
    expect(cards[1].get('.fei-quota-edit-value').text()).toBe('无限次');
    expect(cards[1].find('button').exists()).toBe(false);

    expect(cards[0].get('input').attributes('aria-label')).toBe('基础额度初始额度');
    wrapper.unmount();
  });

  it.each([0, -1, 1.5])('拒绝无效的有限额度 %s', async (initialQuota) => {
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(initialQuota);
    await card.get('button').trigger('click');

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(wrapper.emitted('show-toast')).toContainEqual([
      '初始额度必须是大于 0 的整数',
      'error',
    ]);
    wrapper.unmount();
  });

  it('有效额度只打开确认弹窗且确认前不发送更新请求', async () => {
    const wrapper = mount(QuotaConfigView, { global, attachTo: document.body });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(250);
    await card.get('button').trigger('click');

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain('基础额度');
    expect(dialog.text()).toContain('250');
    expect(mocks.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('取消确认时不发送请求并保留编辑值', async () => {
    const wrapper = mount(QuotaConfigView, { global, attachTo: document.body });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(250);
    await card.get('button').trigger('click');
    await wrapper.get('[role="dialog"] .fei-btn--secondary').trigger('click');

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
    expect((card.get('input').element as HTMLInputElement).value).toBe('250');
    wrapper.unmount();
  });

  it('确认后发送正确请求，成功时关闭弹窗并刷新数据', async () => {
    const updatedConfigs = buildQuotaConfigs();
    updatedConfigs[0]!.initialQuota = 250;
    mocks.list
      .mockResolvedValueOnce(buildQuotaConfigs())
      .mockResolvedValueOnce(updatedConfigs);
    const wrapper = mount(QuotaConfigView, { global, attachTo: document.body });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(250);
    await card.get('button').trigger('click');
    await wrapper.get('[role="dialog"] .fei-btn--primary').trigger('click');
    await flushPromises();

    expect(mocks.update).toHaveBeenCalledWith({
      quotaType: 'BASIC_QUOTA',
      initialQuota: 250,
    });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(wrapper.emitted('show-toast')).toContainEqual(['配额策略已更新', 'success']);
    expect((wrapper.findAll('.fei-quota-config-card')[0]!.get('input').element as HTMLInputElement).value).toBe('250');
    wrapper.unmount();
  });

  it('请求失败时保留确认状态和编辑值并允许重试', async () => {
    mocks.update.mockRejectedValue(new Error('配额服务异常'));
    const wrapper = mount(QuotaConfigView, { global, attachTo: document.body });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(250);
    await card.get('button').trigger('click');
    await wrapper.get('[role="dialog"] .fei-btn--primary').trigger('click');
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect((card.get('input').element as HTMLInputElement).value).toBe('250');
    expect(wrapper.get('[role="dialog"] .fei-btn--primary').attributes('disabled')).toBeUndefined();
    expect(wrapper.emitted('show-toast')).toContainEqual(['配额策略更新失败', 'error']);
    wrapper.unmount();
  });

  it('请求进行期间禁用确认操作并避免重复提交', async () => {
    let resolveUpdate: ((value: boolean) => void) | undefined;
    mocks.update.mockImplementation(() => new Promise<boolean>((resolve) => {
      resolveUpdate = resolve;
    }));
    const wrapper = mount(QuotaConfigView, { global, attachTo: document.body });
    await flushPromises();

    const card = wrapper.findAll('.fei-quota-config-card')[0]!;
    await card.get('input').setValue(250);
    await card.get('button').trigger('click');
    const confirmButton = wrapper.get('[role="dialog"] .fei-btn--primary');
    await confirmButton.trigger('click');
    await confirmButton.trigger('click');

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(confirmButton.attributes('disabled')).toBeDefined();

    resolveUpdate?.(true);
    await flushPromises();
    wrapper.unmount();
  });

  it('点击刷新时重新加载配额配置', async () => {
    const wrapper = mount(QuotaConfigView, { global });
    await flushPromises();

    await wrapper.get('.fei-quota-config__toolbar button').trigger('click');
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
