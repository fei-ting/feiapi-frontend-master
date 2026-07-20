import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthField from '@/components/auth/AuthField.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import LoginView from '../LoginView.vue';
import RegisterView from '../RegisterView.vue';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refreshLoginUser: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/services/user', () => ({
  userService: {
    login: mocks.login,
    register: mocks.register,
  },
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    refreshLoginUser: mocks.refreshLoginUser,
  }),
}));

/** 页面测试公共挂载配置。 */
const global = {
  stubs: {
    RouterLink: { template: '<a><slot /></a>' },
  },
};

/** 填写合法登录表单。 */
const fillLoginForm = async (wrapper: ReturnType<typeof mount<typeof LoginView>>): Promise<void> => {
  const inputs = wrapper.findAll('input');
  await inputs[0].setValue('alice1');
  await inputs[1].setValue('password1');
};

/** 填写合法注册表单。 */
const fillRegisterForm = async (wrapper: ReturnType<typeof mount<typeof RegisterView>>): Promise<void> => {
  const inputs = wrapper.findAll('input');
  await inputs[0].setValue('alice1');
  await inputs[1].setValue('password1');
  await inputs[2].setValue('password1');
};

describe('认证页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.login.mockResolvedValue({ id: 1 });
    mocks.register.mockResolvedValue(1);
    mocks.refreshLoginUser.mockResolvedValue({ id: 1, userRole: 'user' });
    mocks.routerPush.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('登录页复用两个认证字段并拦截非法表单', async () => {
    const wrapper = mount(LoginView, { global });

    expect(wrapper.findAllComponents(AuthField)).toHaveLength(2);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.findAll('.fei-field-error')).toHaveLength(2);
    expect(mocks.login).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('登录页保持合法请求载荷', async () => {
    const wrapper = mount(LoginView, { global });

    await fillLoginForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.login).toHaveBeenCalledWith({
      userAccount: 'alice1',
      userPassword: 'password1',
    });
    await vi.advanceTimersByTimeAsync(1200);
    await flushPromises();
    expect(mocks.refreshLoginUser).toHaveBeenCalledOnce();
    expect(mocks.routerPush).toHaveBeenCalledWith('/home');
    wrapper.unmount();
  });

  it('管理员登录后跳转后台工作台', async () => {
    mocks.refreshLoginUser.mockResolvedValue({ id: 1, userRole: 'admin' });
    const wrapper = mount(LoginView, { global });

    await fillLoginForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1200);
    await flushPromises();

    expect(mocks.routerPush).toHaveBeenCalledTimes(1);
    expect(mocks.routerPush).toHaveBeenCalledWith('/admin/dashboard');
    wrapper.unmount();
  });

  it('登录后刷新用户失败时回退首页', async () => {
    mocks.refreshLoginUser.mockRejectedValue(new Error('用户刷新失败'));
    const wrapper = mount(LoginView, { global });

    await fillLoginForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1200);
    await flushPromises();

    expect(mocks.routerPush).toHaveBeenCalledWith('/home');
    wrapper.unmount();
  });

  it.each([
    [{ code: 40000 }, '账号或密码不正确，请检查后重试'],
    [{ code: 40300 }, '登录失败次数过多，请稍后再试'],
    [{ code: 50000, message: '认证服务异常' }, '认证服务异常'],
  ])('登录失败时映射错误提示 %#', async (error, expectedMessage) => {
    mocks.login.mockRejectedValue(error);
    const wrapper = mount(LoginView, { global });

    await fillLoginForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.findComponent(ToastMessage).props('message')).toBe(expectedMessage);
    expect(wrapper.findComponent(ToastMessage).props('type')).toBe('error');
    expect(mocks.routerPush).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('注册页复用三个认证字段并拦截非法表单', async () => {
    const wrapper = mount(RegisterView, { global });

    expect(wrapper.findAllComponents(AuthField)).toHaveLength(3);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.findAll('.fei-field-error')).toHaveLength(3);
    expect(mocks.register).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('注册页保持合法请求载荷', async () => {
    const wrapper = mount(RegisterView, { global });

    await fillRegisterForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mocks.register).toHaveBeenCalledWith({
      userAccount: 'alice1',
      userPassword: 'password1',
      checkPassword: 'password1',
    });
    await vi.advanceTimersByTimeAsync(1200);
    await flushPromises();
    expect(mocks.routerPush).toHaveBeenCalledWith('/login');
    wrapper.unmount();
  });

  it.each([
    [{ code: 40000, message: '账号已存在' }, '账号已存在'],
    [{ code: 40000 }, '请检查输入内容是否符合要求'],
    [{ code: 50000 }, '注册失败，请稍后重试'],
  ])('注册失败时映射错误提示 %#', async (error, expectedMessage) => {
    mocks.register.mockRejectedValue(error);
    const wrapper = mount(RegisterView, { global });

    await fillRegisterForm(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.findComponent(ToastMessage).props('message')).toBe(expectedMessage);
    expect(wrapper.findComponent(ToastMessage).props('type')).toBe('error');
    expect(mocks.routerPush).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
