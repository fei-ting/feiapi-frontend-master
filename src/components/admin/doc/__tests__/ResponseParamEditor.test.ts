import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ResponseParamEditor from '../ResponseParamEditor.vue';

/** 响应字段编辑器测试数据。 */
const params = [
  {
    paramKey: 'response-1', paramScene: 'RESPONSE' as const, name: 'data', type: 'object',
    parentParamKey: '', sortOrder: 1, required: true, nullable: false,
    description: '响应数据', exampleValue: '{}', defaultValue: '', validationRule: '',
  },
  {
    paramKey: 'response-2', paramScene: 'RESPONSE' as const, name: 'name', type: 'string',
    parentParamKey: 'response-1', sortOrder: 2, required: false, nullable: true,
    description: '名称', exampleValue: 'alice', defaultValue: '', validationRule: '',
  },
];

describe('ResponseParamEditor', () => {
  it('空列表展示空状态并支持新增', async () => {
    const wrapper = mount(ResponseParamEditor, { props: { params: [], paramTypes: ['string'] } });
    expect(wrapper.text()).toContain('暂未维护响应字段');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('删除事件携带稳定键且父字段排除自身', async () => {
    const wrapper = mount(ResponseParamEditor, { props: { params, paramTypes: ['string', 'object'] } });
    const parentOptions = wrapper.findAll('select')[1].findAll('option').map((option) => option.text());
    expect(parentOptions).toEqual(['根节点', 'name']);

    await wrapper.findAll('.fei-action-btn--danger')[0].trigger('click');
    expect(wrapper.emitted('remove')).toEqual([['response-1']]);
  });

  it('发送文本、选择、数字、布尔和说明字段更新', async () => {
    const wrapper = mount(ResponseParamEditor, { props: { params: [params[0]], paramTypes: ['string', 'object'] } });
    const inputs = wrapper.findAll('input');
    const selects = wrapper.findAll('select');

    await inputs[0].setValue('  result  ');
    await selects[0].setValue('string');
    await selects[1].setValue('');
    await inputs[1].setValue('4');
    await inputs[2].setValue(false);
    await inputs[3].setValue(true);
    await inputs[4].setValue('  新说明  ');
    await inputs[5].setValue('value');
    await inputs[6].setValue('default');
    await inputs[7].setValue('  非空  ');

    expect(wrapper.emitted('update-param')).toEqual([
      ['response-1', 'name', 'result'],
      ['response-1', 'type', 'string'],
      ['response-1', 'parentParamKey', ''],
      ['response-1', 'sortOrder', 4],
      ['response-1', 'required', false],
      ['response-1', 'nullable', true],
      ['response-1', 'description', '新说明'],
      ['response-1', 'exampleValue', 'value'],
      ['response-1', 'defaultValue', 'default'],
      ['response-1', 'validationRule', '非空'],
    ]);
  });
});
