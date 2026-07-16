import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AlertList from '../AlertList.vue';
import type { AlertInterface } from '@/types/dashboard';

/** 覆盖全部告警类型的测试数据。 */
const alerts: AlertInterface[] = [
  { id: 1, name: '异常接口', alertType: 'abnormal', description: '状态异常', time: '1 分钟前' },
  { id: 2, name: '突增接口', alertType: 'spike', description: '调用突增', time: '2 分钟前' },
  { id: 3, name: '高失败率接口', alertType: 'highFailureRate', description: '失败率过高', time: '3 分钟前' },
  { id: 4, name: '已修改接口', alertType: 'modified', description: '配置已修改', time: '4 分钟前' },
  { id: 5, name: '未使用接口', alertType: 'unused', description: '长期未调用', time: '5 分钟前' },
];

describe('AlertList', () => {
  it('渲染告警字段和全部告警图标映射', () => {
    const wrapper = mount(AlertList, { props: { alerts } });

    expect(wrapper.findAll('.fei-alert-item')).toHaveLength(5);
    expect(wrapper.findAll('.fei-alert-item__icon').map((item) => item.text())).toEqual(['🔴', '📈', '⚠️', '✏️', '💤']);
    expect(wrapper.text()).toContain('调用突增');
    expect(wrapper.text()).toContain('2 分钟前');
  });

  it('点击告警时发送接口ID', async () => {
    const wrapper = mount(AlertList, { props: { alerts } });

    await wrapper.findAll('.fei-alert-item')[1].trigger('click');

    expect(wrapper.emitted('select-interface')).toEqual([[2]]);
  });

  it('告警为空时显示空状态', () => {
    const wrapper = mount(AlertList, { props: { alerts: [] } });

    expect(wrapper.findAll('.fei-alert-item')).toHaveLength(0);
    expect(wrapper.text()).toContain('暂无告警');
  });
});
