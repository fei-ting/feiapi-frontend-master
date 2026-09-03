import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AccessKeysView from '../AccessKeysView.vue';

const mocks = vi.hoisted(() => ({
  getCurrentUserKeys: vi.fn(),
  resetCurrentUserSecretKey: vi.fn(),
  loginUser: { id: 1, userRole: 'user' } as { id: number; userRole: string } | null,
}));

vi.mock('@/services/user', () => ({
  userService: {
    getCurrentUserKeys: mocks.getCurrentUserKeys,
    resetCurrentUserSecretKey: mocks.resetCurrentUserSecretKey,
  },
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    loginUser: mocks.loginUser,
  }),
}));

/** 当前测试使用的剪贴板写入函数。 */
let writeText: ReturnType<typeof vi.fn>;

/** 挂载访问密钥页面并等待密钥加载完成。 */
const mountView = async () => {
  const wrapper = mount(AccessKeysView);
  await flushPromises();
  return wrapper;
};

describe('AccessKeysView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginUser = { id: 1, userRole: 'user' };
    mocks.getCurrentUserKeys.mockResolvedValue({
      accessKey: 'access-key-value',
      secretKey: 'secret-key-value',
    });
    writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('访问密钥、Secret Key 和 SDK 示例使用统一复制提示', async () => {
    const wrapper = await mountView();
    const keyCards = wrapper.findAll('.fei-key-card');

    await keyCards[0].get('button').trigger('click');
    await keyCards[1].findAll('button')[1].trigger('click');
    await wrapper.get('.fei-sdk-snippet button').trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenNthCalledWith(1, 'access-key-value');
    expect(writeText).toHaveBeenNthCalledWith(2, 'secret-key-value');
    expect(writeText).toHaveBeenNthCalledWith(3, expect.stringContaining('FeiApiClient'));
    expect(wrapper.emitted('show-toast')).toEqual([
      ['已复制', 'success'],
      ['已复制', 'success'],
      ['已复制', 'success'],
    ]);
    wrapper.unmount();
  });

  it('密钥未加载时保留页面前置校验提示', async () => {
    mocks.getCurrentUserKeys.mockResolvedValue(null);
    const wrapper = await mountView();

    await wrapper.findAll('.fei-key-card')[0].get('button').trigger('click');

    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.emitted('show-toast')).toContainEqual(['密钥暂未加载完成', 'error']);
    wrapper.unmount();
  });

  it('重置成功后展示新密钥并提示旧密钥失效', async () => {
    mocks.resetCurrentUserSecretKey.mockResolvedValue({
      accessKey: 'access-key-value',
      secretKey: 'new-secret-key-value',
    });
    const wrapper = await mountView();

    // Secret Key 卡片的第 3 个按钮为重置入口
    await wrapper.findAll('.fei-key-card')[1].findAll('button')[2].trigger('click');
    expect(wrapper.find('.fei-reset-dialog').exists()).toBe(true);

    await wrapper.get('#reset-secret-password').setValue('password123');
    await wrapper.get('.fei-reset-dialog__footer button').trigger('click');
    await flushPromises();

    expect(mocks.resetCurrentUserSecretKey).toHaveBeenCalledWith({ userPassword: 'password123' });
    expect(wrapper.find('.fei-reset-dialog').exists()).toBe(false);
    // 重置成功后直接展示新密钥明文
    expect(wrapper.text()).toContain('new-secret-key-value');
    expect(wrapper.emitted('show-toast')).toContainEqual(['Secret Key 已重置，旧密钥已失效', 'success']);
    wrapper.unmount();
  });

  it('密码为空时确认按钮禁用', async () => {
    const wrapper = await mountView();

    await wrapper.findAll('.fei-key-card')[1].findAll('button')[2].trigger('click');
    const confirmButton = wrapper.get('.fei-reset-dialog__footer button');

    expect(confirmButton.attributes('disabled')).toBeDefined();

    await wrapper.get('#reset-secret-password').setValue('  ');
    expect(confirmButton.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('重置失败时提示错误并保留弹窗', async () => {
    mocks.resetCurrentUserSecretKey.mockRejectedValue(new Error('当前密码错误'));
    const wrapper = await mountView();

    await wrapper.findAll('.fei-key-card')[1].findAll('button')[2].trigger('click');
    await wrapper.get('#reset-secret-password').setValue('wrongpass1');
    await wrapper.get('.fei-reset-dialog__footer button').trigger('click');
    await flushPromises();

    expect(wrapper.find('.fei-reset-dialog').exists()).toBe(true);
    expect(wrapper.emitted('show-toast')).toContainEqual(['当前密码错误', 'error']);
    wrapper.unmount();
  });
});
