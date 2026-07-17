import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DocumentMainInfoForm from '../DocumentMainInfoForm.vue';

/** 挂载文档主信息表单。 */
const mountForm = () => mount(DocumentMainInfoForm, {
  props: {
    modelValue: {
      docVersion: 'v1', requestContentType: 'application/json', responseContentType: 'text/plain',
      successExample: '', failExample: '', remark: '公开备注',
    },
    contentTypes: ['application/json', 'text/plain'],
  },
});

describe('DocumentMainInfoForm', () => {
  it('展示当前值、选项和字段约束', () => {
    const wrapper = mountForm();

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('v1');
    expect(wrapper.get('input').attributes('maxlength')).toBe('64');
    expect(wrapper.get('input').attributes()).toHaveProperty('required');
    expect(wrapper.findAll('option')).toHaveLength(4);
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('公开备注');
  });

  it('四个字段发送更新事件', async () => {
    const wrapper = mountForm();
    await wrapper.get('input').setValue('  v2  ');
    await wrapper.findAll('select')[0].setValue('text/plain');
    await wrapper.findAll('select')[1].setValue('application/json');
    await wrapper.get('textarea').setValue('  新备注  ');

    expect(wrapper.emitted('update-field')).toEqual([
      ['docVersion', 'v2'],
      ['requestContentType', 'text/plain'],
      ['responseContentType', 'application/json'],
      ['remark', '新备注'],
    ]);
  });
});
