import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useAuthForm } from '../useAuthForm';
import { useInterfaceInvoke } from '../useInterfaceInvoke';
import { useToast } from '../useToast';
import type { InterfaceDocDetailVO } from '@/types/api';
import { getPasswordFormatError } from '@/utils/passwordValidation';

/** 构造在线调用测试文档 */
const buildDoc = (): InterfaceDocDetailVO => ({
  interfaceInfo: { id: 1, name: '类型接口', method: 'POST', status: 1 },
  doc: {},
  gatewayUrl: '/api/type',
  structuredDocMissing: false,
  requestHeaders: [],
  requestParams: [
    { id: 1, name: 'age', paramScene: 'BODY', type: 'number', required: true, exampleValue: '18' },
    { id: 2, name: 'enabled', paramScene: 'BODY', type: 'boolean', required: true, exampleValue: 'true' },
    { id: 3, name: 'meta', paramScene: 'BODY', type: 'object', required: true, exampleValue: '{"level":2}' },
    { id: 4, name: 'tags', paramScene: 'BODY', type: 'array', required: true, exampleValue: '["vip"]' },
  ],
  responseParams: [],
  errorCodes: [],
  curlExample: '',
});

describe('页面业务组合式函数', () => {
  it('复用认证表单校验规则', () => {
    const { form, errors, validateAccount, validatePassword, validateCheckPassword } = useAuthForm({ withCheckPassword: true });

    form.userAccount = '1bad';
    expect(validateAccount()).toBe(false);
    expect(errors.userAccount).toContain('账号');

    form.userAccount = 'alice1';
    form.userPassword = 'password1';
    form.checkPassword = 'password2';
    expect(validateAccount()).toBe(true);
    expect(validatePassword()).toBe(true);
    expect(validateCheckPassword()).toBe(false);
    expect(errors.checkPassword).toBe('两次输入的密码不一致');
  });

  it('完整认证校验不短路并同时反馈全部无效字段', async () => {
    vi.useFakeTimers();
    const { errors, shaking, validate } = useAuthForm({ withCheckPassword: true });

    expect(validate()).toBe(false);
    await nextTick();

    expect(errors).toEqual({
      userAccount: '请输入账号',
      userPassword: '请输入密码',
      checkPassword: '请再次输入密码',
    });
    expect(shaking).toEqual({
      userAccount: true,
      userPassword: true,
      checkPassword: true,
    });

    vi.advanceTimersByTime(400);
    await nextTick();
    expect(shaking).toEqual({
      userAccount: false,
      userPassword: false,
      checkPassword: false,
    });
    vi.useRealTimers();
  });

  it('注册密码变化时重新校验已有的确认密码', () => {
    const { form, errors, onPasswordInput, onCheckPasswordInput } = useAuthForm({ withCheckPassword: true });

    form.userPassword = 'password1';
    form.checkPassword = 'password2';
    onCheckPasswordInput();
    expect(errors.checkPassword).toBe('两次输入的密码不一致');

    form.userPassword = 'password2';
    onPasswordInput();
    expect(errors.checkPassword).toBe('');
  });

  it('同一字段可以重新触发抖动并按最新时间清理', async () => {
    vi.useFakeTimers();
    const { shaking, triggerShake } = useAuthForm();

    triggerShake('userAccount');
    await nextTick();
    expect(shaking.userAccount).toBe(true);

    vi.advanceTimersByTime(200);
    triggerShake('userAccount');
    await nextTick();
    vi.advanceTimersByTime(399);
    expect(shaking.userAccount).toBe(true);

    vi.advanceTimersByTime(1);
    expect(shaking.userAccount).toBe(false);
    vi.useRealTimers();
  });

  it('复用密码长度和字母数字格式规则', () => {
    expect(getPasswordFormatError('abc1234')).toBe('密码长度应为 8-16 位');
    expect(getPasswordFormatError('12345678')).toBe('密码只能包含字母和数字，且必须同时包含字母和数字');
    expect(getPasswordFormatError('abcdefgh')).toBe('密码只能包含字母和数字，且必须同时包含字母和数字');
    expect(getPasswordFormatError('abcd123!')).toBe('密码只能包含字母和数字，且必须同时包含字母和数字');
    expect(getPasswordFormatError('abcd1234')).toBe('');
    expect(getPasswordFormatError('abcdefgh12345678')).toBe('');
    expect(getPasswordFormatError('abcdefgh123456789')).toBe('密码长度应为 8-16 位');
  });

  it('转换结构化参数并拒绝错误类型', () => {
    const doc = ref<InterfaceDocDetailVO | null>(buildDoc());
    const invoke = useInterfaceInvoke(doc);
    invoke.syncFromDocument();

    expect(invoke.structuredParams.value).toHaveLength(4);
    expect(JSON.parse(invoke.requestParams.value)).toEqual({
      age: 18,
      enabled: true,
      meta: { level: 2 },
      tags: ['vip'],
    });

    invoke.paramValues.age = 'not-number';
    expect(invoke.validateRequestParams()).toBe(false);
    expect(invoke.requestParamError.value).toContain('age');
  });

  it('显示 Toast 并在持续时间后自动关闭', async () => {
    vi.useFakeTimers();
    const { toast, showToast } = useToast(1000);

    showToast('保存成功', 'success');
    expect(toast.visible).toBe(true);
    expect(toast.message).toBe('保存成功');
    expect(toast.type).toBe('success');

    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(toast.visible).toBe(false);
    vi.useRealTimers();
  });
});
