import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RequestParameterForm from '../RequestParameterForm.vue';
import type { RequestParamField } from '@/composables/useInterfaceInvoke';

/** 请求参数字段测试数据。 */
const structuredParams: RequestParamField[] = [
  { name: 'name', type: 'string', example: 'alice', required: true },
  { name: 'age', type: 'number', example: 18, required: false },
];

/** 创建请求参数表单测试包装器。 */
const mountForm = (overrides: Record<string, unknown> = {}) => mount(RequestParameterForm, {
  props: {
    structuredParams,
    paramValues: { name: 'alice', age: '18' },
    invokeLoading: false,
    canFillExample: true,
    emptyParamText: '此接口无需请求参数',
    ...overrides,
  },
});

describe('RequestParameterForm', () => {
  it('渲染字段类型、必填标记和当前输入值', () => {
    const wrapper = mountForm();

    expect(wrapper.findAll('.fei-invoke-param')).toHaveLength(2);
    expect(wrapper.get('#invoke-param-name').attributes('type')).toBe('text');
    expect(wrapper.get('#invoke-param-age').attributes('type')).toBe('number');
    expect((wrapper.get('#invoke-param-name').element as HTMLInputElement).value).toBe('alice');
    expect(wrapper.findAll('.fei-invoke-param__required')).toHaveLength(1);
  });

  it('输入参数时发送字段名和值', async () => {
    const wrapper = mountForm();

    await wrapper.get('#invoke-param-age').setValue('21');

    expect(wrapper.emitted('update-param')).toEqual([['age', '21']]);
  });

  it('发送请求和填充示例按钮发送对应事件', async () => {
    const wrapper = mountForm();

    await wrapper.findAll('button')[0].trigger('click');
    await wrapper.findAll('button')[1].trigger('click');

    expect(wrapper.emitted('invoke')).toHaveLength(1);
    expect(wrapper.emitted('fill-example')).toHaveLength(1);
  });

  it('无参数时显示指定文案并按状态控制按钮', () => {
    const wrapper = mountForm({
      structuredParams: [],
      paramValues: {},
      invokeLoading: true,
      canFillExample: false,
      emptyParamText: '暂无结构化请求参数',
    });

    expect(wrapper.text()).toContain('暂无结构化请求参数');
    expect(wrapper.findAll('.fei-invoke-param')).toHaveLength(0);
    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled');
    expect(wrapper.get('button').text()).toBe('调用中...');
  });
});
