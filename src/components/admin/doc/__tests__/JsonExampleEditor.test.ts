import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import JsonExampleEditor from '../JsonExampleEditor.vue';

describe('JsonExampleEditor', () => {
  it('展示并更新两个JSON示例', async () => {
    const wrapper = mount(JsonExampleEditor, {
      props: { successExample: '{"ok":true}', failExample: '{"ok":false}' },
    });
    const textareas = wrapper.findAll('textarea');
    expect((textareas[0].element as HTMLTextAreaElement).value).toBe('{"ok":true}');
    expect((textareas[1].element as HTMLTextAreaElement).value).toBe('{"ok":false}');

    await textareas[0].setValue('{"data":1}');
    await textareas[1].setValue('{"error":1}');
    expect(wrapper.emitted('update-example')).toEqual([
      ['successExample', '{"data":1}'], ['failExample', '{"error":1}'],
    ]);
  });

  it('两个格式化按钮发送对应字段', async () => {
    const wrapper = mount(JsonExampleEditor, {
      props: { successExample: '', failExample: '' },
    });
    await wrapper.findAll('button')[0].trigger('click');
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('format')).toEqual([['successExample'], ['failExample']]);
  });
});
