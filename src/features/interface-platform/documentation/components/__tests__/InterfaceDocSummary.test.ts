import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InterfaceDocSummary from '../InterfaceDocSummary.vue';
import type { InterfaceDocDetailVO } from '@/features/interface-platform/documentation/types/interfaceDoc';

/** 接口文档概要测试数据。 */
const detail: InterfaceDocDetailVO = {
  docStatus: 'DRAFT',
  interfaceInfo: {
    id: 1, name: '用户接口', description: '查询并返回用户公开资料', method: 'POST', path: '/api/user', status: 0,
    quotaType: 'BASIC_QUOTA', quotaTypeText: '基础额度接口', sdkMethodName: 'getUser',
  },
};

describe('InterfaceDocSummary', () => {
  it('展示接口身份和元数据', () => {
    const wrapper = mount(InterfaceDocSummary, { props: { detail, editable: true } });

    expect(wrapper.text()).toContain('POST');
    expect(wrapper.text()).toContain('/api/user');
    expect(wrapper.text()).toContain('用户接口');
    expect(wrapper.text()).toContain('查询并返回用户公开资料');
    expect(wrapper.text()).toContain('基础额度接口');
    expect(wrapper.text()).toContain('getUser');
    expect(wrapper.text()).toContain('草稿');
    expect(wrapper.text()).not.toContain('当前接口不可编辑');
    expect(wrapper.get('.fei-doc-summary__status').classes()).toContain('fei-doc-summary__status--offline');
    expect(wrapper.get('.fei-doc-status').classes()).toContain('fei-doc-status--draft');
  });

  it('不可编辑时展示操作提示', () => {
    const wrapper = mount(InterfaceDocSummary, { props: { detail, editable: false } });
    expect(wrapper.get('.fei-doc-summary__notice').attributes('role')).toBe('note');
    expect(wrapper.text()).toContain('当前为只读模式');
    expect(wrapper.text()).toContain('请先返回接口列表将接口下线');
    expect(wrapper.get('.fei-doc-summary__notice-icon').text()).toBe('!');
  });
});
