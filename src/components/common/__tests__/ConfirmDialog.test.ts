import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import ConfirmDialog from '../ConfirmDialog.vue';

/** 挂载打开状态的确认弹窗。 */
const mountOpenDialog = () => mount(ConfirmDialog, {
  attachTo: document.body,
  props: {
    open: true,
    title: '确认发起调用',
    message: '将使用当前账号发起实际调用。',
    primaryText: '确认调用',
    titleId: 'invoke-dialog-title',
  },
});

describe('ConfirmDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('关闭状态不渲染弹窗', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: false, title: '标题', message: '正文', primaryText: '确认' },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('展示完整内容并在打开后聚焦主按钮', async () => {
    const wrapper = mountOpenDialog();
    await flushPromises();

    expect(wrapper.get('[role="dialog"]').attributes('aria-labelledby')).toBe('invoke-dialog-title');
    expect(wrapper.get('#invoke-dialog-title').text()).toBe('确认发起调用');
    expect(wrapper.text()).toContain('将使用当前账号发起实际调用。');
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['确认调用', '取消']);
    expect(document.activeElement).toBe(wrapper.findAll('button')[0].element);
  });

  it('主按钮、取消按钮和Escape发送对应事件', async () => {
    const wrapper = mountOpenDialog();

    await wrapper.findAll('button')[0].trigger('click');
    await wrapper.findAll('button')[1].trigger('click');
    await wrapper.get('[role="dialog"]').trigger('keyup', { key: 'Escape' });

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(2);
  });

  it('Tab和Shift加Tab在弹窗按钮间循环焦点', async () => {
    const wrapper = mountOpenDialog();
    await flushPromises();
    const buttons = wrapper.findAll('button');

    (buttons[1].element as HTMLButtonElement).focus();
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0].element);

    (buttons[0].element as HTMLButtonElement).focus();
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[1].element);
  });
});
