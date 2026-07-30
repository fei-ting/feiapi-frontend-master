import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ResponseFieldDeleteDialog from '../ResponseFieldDeleteDialog.vue';

/** 挂载响应字段删除对话框。 */
const mountDialog = () => mount(ResponseFieldDeleteDialog, {
  props: {
    open: true,
    targetPath: 'data.users',
    descendantPaths: ['data.users.id', 'data.users.profile', 'data.users.profile.name'],
  },
});

describe('ResponseFieldDeleteDialog', () => {
  it('展示可访问对话框和全部受影响字段路径', () => {
    const wrapper = mountDialog();

    expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true');
    expect(wrapper.text()).toContain('data.users');
    expect(wrapper.text()).toContain('受影响子字段（3）');
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual([
      'data.users.id',
      'data.users.profile',
      'data.users.profile.name',
    ]);
  });

  it('分别发送删除子树、提升子字段和取消事件', async () => {
    const wrapper = mountDialog();
    const buttonByText = (text: string) => wrapper.findAll('button').find((button) => button.text() === text);

    await buttonByText('删除整个子树')?.trigger('click');
    await buttonByText('提升直接子字段')?.trigger('click');
    await buttonByText('取消')?.trigger('click');

    expect(wrapper.emitted('delete-subtree')).toHaveLength(1);
    expect(wrapper.emitted('promote-children')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('关闭按钮和Escape均按取消处理并展示操作错误', async () => {
    const wrapper = mount(ResponseFieldDeleteDialog, {
      props: {
        open: true,
        targetPath: 'data.user',
        descendantPaths: ['data.user.name'],
        errorMessage: '同级响应字段名称不能重复',
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toBe('同级响应字段名称不能重复');
    await wrapper.get('button[aria-label="关闭"]').trigger('click');
    await wrapper.get('[role="dialog"]').trigger('keyup', { key: 'Escape' });
    expect(wrapper.emitted('cancel')).toHaveLength(2);
  });
});
