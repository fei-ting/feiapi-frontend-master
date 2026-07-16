import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ChangeList from '../ChangeList.vue';
import type { ChangedInterface } from '@/types/dashboard';

/** 覆盖全部变更类型的测试数据。 */
const changes: ChangedInterface[] = [
  { id: 1, name: '新增接口', changeType: 'created', time: '1 分钟前' },
  { id: 2, name: '上线接口', changeType: 'online', time: '2 分钟前' },
  { id: 3, name: '下线接口', changeType: 'offline', time: '3 分钟前' },
  { id: 4, name: '修改接口', changeType: 'updated', time: '4 分钟前' },
];

describe('ChangeList', () => {
  it('渲染变更字段和全部类型文案映射', () => {
    const wrapper = mount(ChangeList, { props: { changes } });

    expect(wrapper.findAll('.fei-change-item')).toHaveLength(4);
    expect(wrapper.findAll('.fei-change-tag').map((item) => item.text())).toEqual(['新增', '上线', '下线', '修改']);
    expect(wrapper.text()).toContain('上线接口');
    expect(wrapper.text()).toContain('2 分钟前');
  });

  it('点击变更记录时发送接口ID', async () => {
    const wrapper = mount(ChangeList, { props: { changes } });

    await wrapper.findAll('.fei-change-item')[2].trigger('click');

    expect(wrapper.emitted('select-interface')).toEqual([[3]]);
  });

  it('变更为空时显示空状态', () => {
    const wrapper = mount(ChangeList, { props: { changes: [] } });

    expect(wrapper.findAll('.fei-change-item')).toHaveLength(0);
    expect(wrapper.text()).toContain('暂无变更');
  });
});
