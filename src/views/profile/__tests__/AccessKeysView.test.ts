import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AccessKeysView from '../AccessKeysView.vue';

const mocks = vi.hoisted(() => ({
  getCurrentUserKeys: vi.fn(),
  loginUser: { id: 1, userRole: 'user' } as { id: number; userRole: string } | null,
}));

vi.mock('@/services/user', () => ({
  userService: {
    getCurrentUserKeys: mocks.getCurrentUserKeys,
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
});
