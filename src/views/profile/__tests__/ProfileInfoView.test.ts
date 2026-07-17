import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileInfoView from '../ProfileInfoView.vue';

const mocks = vi.hoisted(() => ({
  loginUser: { id: 1, userName: '当前昵称', gender: 1, userRole: 'user' },
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  refreshLoginUser: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  userService: {
    updateCurrentUserProfile: mocks.updateProfile,
    updateCurrentUserPassword: mocks.updatePassword,
  },
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    loginUser: mocks.loginUser,
    refreshLoginUser: mocks.refreshLoginUser,
  }),
}));

/** 挂载个人信息页面。 */
const mountView = () => mount(ProfileInfoView);

/** 获取密码表单的三个输入框。 */
const passwordInputs = (wrapper: ReturnType<typeof mountView>) => wrapper.findAll('input[type="password"]');

/** 填写一组合法且新旧不同的密码。 */
const fillValidPasswords = async (wrapper: ReturnType<typeof mountView>) => {
  const inputs = passwordInputs(wrapper);
  await inputs[0].setValue('oldpass1');
  await inputs[1].setValue('newpass2');
  await inputs[2].setValue('newpass2');
};

describe('ProfileInfoView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProfile.mockResolvedValue(true);
    mocks.updatePassword.mockResolvedValue(true);
    mocks.refreshLoginUser.mockResolvedValue(mocks.loginUser);
  });

  it('立即同步当前用户的昵称和性别', () => {
    const wrapper = mountView();

    expect((wrapper.get('input[autocomplete="nickname"]').element as HTMLInputElement).value).toBe('当前昵称');
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('1');
  });

  it('昵称校验失败时阻止资料请求', async () => {
    const wrapper = mountView();
    await wrapper.get('input[autocomplete="nickname"]').setValue('a');
    await wrapper.findAll('form')[0].trigger('submit');

    expect(wrapper.text()).toContain('昵称长度应为 2-16 个字符');
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(wrapper.emitted('show-toast')).toContainEqual(['昵称长度应为 2-16 个字符', 'error']);
  });

  it('资料更新成功后刷新用户Store并发送成功通知', async () => {
    const wrapper = mountView();
    await wrapper.get('input[autocomplete="nickname"]').setValue('  新昵称  ');
    await wrapper.get('select').setValue('0');
    await wrapper.findAll('form')[0].trigger('submit');
    await flushPromises();

    expect(mocks.updateProfile).toHaveBeenCalledWith({ userName: '新昵称', gender: 0 });
    expect(mocks.refreshLoginUser).toHaveBeenCalledOnce();
    expect(wrapper.emitted('show-toast')).toContainEqual(['个人信息已更新', 'success']);
  });

  it('资料更新失败时展示服务错误', async () => {
    mocks.updateProfile.mockRejectedValue(new Error('资料服务失败'));
    const wrapper = mountView();

    await wrapper.findAll('form')[0].trigger('submit');
    await flushPromises();

    expect(mocks.refreshLoginUser).not.toHaveBeenCalled();
    expect(wrapper.emitted('show-toast')).toContainEqual(['资料服务失败', 'error']);
  });

  it('旧密码实时校验仅检查必填', async () => {
    const wrapper = mountView();
    const oldPassword = passwordInputs(wrapper)[0];

    await oldPassword.setValue('');
    expect(wrapper.text()).toContain('请输入旧密码');
    await oldPassword.setValue('短');
    expect(wrapper.text()).not.toContain('请输入旧密码');
    expect(wrapper.text()).not.toContain('密码长度应为 8-16 位');
  });

  it('新密码实时校验长度和字母数字格式', async () => {
    const wrapper = mountView();
    const newPassword = passwordInputs(wrapper)[1];

    await newPassword.setValue('abc1');
    expect(wrapper.text()).toContain('密码长度应为 8-16 位');
    await newPassword.setValue('abcdefgh');
    expect(wrapper.text()).toContain('密码只能包含字母和数字，且必须同时包含字母和数字');
    await newPassword.setValue('abcd1234');
    expect(wrapper.text()).not.toContain('密码长度应为 8-16 位');
    expect(wrapper.text()).not.toContain('密码只能包含字母和数字，且必须同时包含字母和数字');
  });

  it('确认密码实时校验并随新密码变化重新校验', async () => {
    const wrapper = mountView();
    const inputs = passwordInputs(wrapper);

    await inputs[1].setValue('newpass2');
    await inputs[2].setValue('different3');
    expect(wrapper.text()).toContain('两次输入的新密码不一致');
    await inputs[1].setValue('different3');
    expect(wrapper.text()).not.toContain('两次输入的新密码不一致');
  });

  it('新旧密码相同只在提交时拦截请求', async () => {
    const wrapper = mountView();
    const inputs = passwordInputs(wrapper);
    await inputs[0].setValue('samepass1');
    await inputs[1].setValue('samepass1');
    await inputs[2].setValue('samepass1');

    expect(wrapper.text()).not.toContain('新密码不能与旧密码相同');
    await wrapper.findAll('form')[1].trigger('submit');

    expect(mocks.updatePassword).not.toHaveBeenCalled();
    expect(wrapper.emitted('show-toast')).toContainEqual(['新密码不能与旧密码相同', 'error']);
  });

  it('密码更新成功后清空字段和实时错误', async () => {
    const wrapper = mountView();
    await fillValidPasswords(wrapper);
    await wrapper.findAll('form')[1].trigger('submit');
    await flushPromises();

    expect(mocks.updatePassword).toHaveBeenCalledWith({
      oldPassword: 'oldpass1', newPassword: 'newpass2', checkPassword: 'newpass2',
    });
    expect(passwordInputs(wrapper).map((input) => (input.element as HTMLInputElement).value)).toEqual(['', '', '']);
    expect(wrapper.findAll('.fei-field-error')).toHaveLength(0);
    expect(wrapper.emitted('show-toast')).toContainEqual(['密码已修改', 'success']);
  });

  it('密码更新失败时保留输入并展示服务错误', async () => {
    mocks.updatePassword.mockRejectedValue(new Error('密码服务失败'));
    const wrapper = mountView();
    await fillValidPasswords(wrapper);
    await wrapper.findAll('form')[1].trigger('submit');
    await flushPromises();

    expect(passwordInputs(wrapper).map((input) => (input.element as HTMLInputElement).value)).toEqual([
      'oldpass1', 'newpass2', 'newpass2',
    ]);
    expect(wrapper.emitted('show-toast')).toContainEqual(['密码服务失败', 'error']);
  });
});
