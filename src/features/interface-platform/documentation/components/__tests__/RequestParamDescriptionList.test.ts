import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RequestParamDescriptionList from '../RequestParamDescriptionList.vue';

/** 请求参数说明测试数据。 */
const params = [{
  paramKey: 'request-1', paramScene: 'BODY' as const, name: 'userId', type: 'number', required: true,
  description: '用户标识', exampleValue: '1', validationRule: '正整数', sortOrder: 1,
}];

describe('RequestParamDescriptionList', () => {
  it('空列表展示运行时参数空状态', () => {
    const wrapper = mount(RequestParamDescriptionList, { props: { params: [] } });
    expect(wrapper.text()).toContain('当前接口没有运行时请求参数');
  });

  it('以卡片展示参数身份、数量和字符计数', () => {
    const wrapper = mount(RequestParamDescriptionList, { props: { params } });

    expect(wrapper.get('.fei-doc-request-params__count').text()).toBe('当前 1 / 100');
    expect(wrapper.findAll('.fei-doc-request-params__item')).toHaveLength(1);
    expect(wrapper.text()).toContain('userId');
    expect(wrapper.findAll('.fei-doc-request-params__tag').map((tag) => tag.text())).toEqual(['BODY', 'number', '必填']);
    expect(wrapper.findAll('.fei-doc-request-params__label-row')).toHaveLength(3);
    expect(wrapper.findAll('.fei-boundary-remaining')).toHaveLength(3);
    expect(wrapper.find('input[type="number"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('排序');
  });

  it('发送三类说明字段更新并保留原有文本处理规则', async () => {
    const wrapper = mount(RequestParamDescriptionList, { props: { params } });
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(3);

    await inputs[0].setValue('  新说明  ');
    await inputs[1].setValue('2');
    await inputs[2].setValue('  大于零  ');

    expect(wrapper.emitted('update-param')).toEqual([
      ['request-1', 'description', '新说明'],
      ['request-1', 'exampleValue', '2'],
      ['request-1', 'validationRule', '大于零'],
    ]);
  });
});
