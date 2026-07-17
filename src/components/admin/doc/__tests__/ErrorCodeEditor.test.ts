import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ErrorCodeEditor from '../ErrorCodeEditor.vue';

/** 错误码编辑器测试数据。 */
const errorCodes = [{
  clientKey: 'error-1', errorCode: 'A001', errorMessage: '参数错误', sortOrder: 1,
  description: '公开说明', solution: '检查参数',
}];

describe('ErrorCodeEditor', () => {
  it('空列表展示空状态并支持新增', async () => {
    const wrapper = mount(ErrorCodeEditor, { props: { errorCodes: [] } });
    expect(wrapper.text()).toContain('当前接口没有专属错误码');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('展示排序占位并发送删除事件', async () => {
    const wrapper = mount(ErrorCodeEditor, { props: { errorCodes } });
    expect(wrapper.find('input[type="number"]').attributes('placeholder')).toBe('1');
    await wrapper.get('.fei-action-btn--danger').trigger('click');
    expect(wrapper.emitted('remove')).toEqual([['error-1']]);
  });

  it('五类字段发送更新事件', async () => {
    const wrapper = mount(ErrorCodeEditor, { props: { errorCodes } });
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('  B002  ');
    await inputs[1].setValue('  服务异常  ');
    await inputs[2].setValue('2');
    await inputs[3].setValue('  说明  ');
    await inputs[4].setValue('  重试  ');

    expect(wrapper.emitted('update-error-code')).toEqual([
      ['error-1', 'errorCode', 'B002'],
      ['error-1', 'errorMessage', '服务异常'],
      ['error-1', 'sortOrder', 2],
      ['error-1', 'description', '说明'],
      ['error-1', 'solution', '重试'],
    ]);
  });
});
