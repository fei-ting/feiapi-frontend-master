import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DocumentMainInfoForm from '../DocumentMainInfoForm.vue';

/** 挂载文档主信息表单。 */
const mountForm = () => mount(DocumentMainInfoForm, {
  props: {
    modelValue: {
      requestContentType: 'application/json', responseContentType: 'text/plain',
      successExample: '', failExample: '', remark: '公开备注',
    },
    contentTypes: ['application/json', 'text/plain'],
  },
});

describe('DocumentMainInfoForm', () => {
  it('展示当前值、选项和字段约束', () => {
    const wrapper = mountForm();

    expect(wrapper.findAll('option')).toHaveLength(4);
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('公开备注');
    expect(wrapper.get('.fei-doc-main-info__title').text()).toContain('配置内容格式和面向调用方的公开备注');
    expect(wrapper.findAll('.fei-doc-main-info__label-row')).toHaveLength(1);
    expect(wrapper.text()).toContain('请避免填写内部地址、密钥或其他敏感信息');
  });

  it('三个字段发送更新事件', async () => {
    const wrapper = mountForm();
    await wrapper.findAll('select')[0].setValue('text/plain');
    await wrapper.findAll('select')[1].setValue('application/json');
    await wrapper.get('textarea').setValue('  新备注  ');

    expect(wrapper.emitted('update-field')).toEqual([
      ['requestContentType', 'text/plain'],
      ['responseContentType', 'application/json'],
      ['remark', '新备注'],
    ]);
  });
});
