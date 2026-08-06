import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RequestParamDescriptionList from '../RequestParamDescriptionList.vue';

/** 请求参数说明测试数据。 */
const params = [{
  paramKey: 'request-1', paramScene: 'BODY' as const, name: 'userId', type: 'number', required: true,
  description: '用户标识', exampleValue: '1', defaultValue: '', validationRule: '正整数', sortOrder: 1,
}];

describe('RequestParamDescriptionList', () => {
  it('空列表展示运行时参数空状态', () => {
    const wrapper = mount(RequestParamDescriptionList, { props: { params: [] } });
    expect(wrapper.text()).toContain('当前接口没有运行时请求参数');
  });

  it('展示身份信息并发送五类字段更新', async () => {
    const wrapper = mount(RequestParamDescriptionList, { props: { params } });
    const inputs = wrapper.findAll('input');
    expect(wrapper.text()).toContain('userId');
    expect(wrapper.text()).toContain('BODY · number · 必填');

    await inputs[0].setValue('  新说明  ');
    await inputs[1].setValue('2');
    await inputs[2].setValue('1');
    await inputs[3].setValue('  大于零  ');
    await inputs[4].setValue('3');

    expect(wrapper.emitted('update-param')).toEqual([
      ['request-1', 'description', '新说明'],
      ['request-1', 'exampleValue', '2'],
      ['request-1', 'defaultValue', '1'],
      ['request-1', 'validationRule', '大于零'],
      ['request-1', 'sortOrder', 3],
    ]);
  });
});
