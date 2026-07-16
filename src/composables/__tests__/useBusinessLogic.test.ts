import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useAuthForm } from '../useAuthForm';
import { useInterfaceInvoke } from '../useInterfaceInvoke';
import { useToast } from '../useToast';
import type { InterfaceDocDetailVO } from '@/types/api';

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
