import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CopyIconButton from '@/components/common/CopyIconButton.vue';
import InterfaceDocumentation from '@/features/interface-platform/documentation/components/InterfaceDocumentation.vue';
import InvokeResultPanel from '../InvokeResultPanel.vue';
import type { InterfaceDocDetailVO } from '@/features/interface-platform/documentation/types/interfaceDoc';
import type { InvokeResponse } from '@/types/invoke';

/** 结果面板使用的最小接口文档。 */
const docDetail: InterfaceDocDetailVO = {
  interfaceInfo: { id: 1, name: '结果接口', method: 'GET', status: 1 },
  requestHeaders: [],
  requestParams: [],
  responseParams: [],
  curlExample: '',
};

/** 成功在线调用结果。 */
const invokeResult: InvokeResponse = {
  successful: true,
  statusCode: 200,
  durationMs: 36,
  contentType: 'application/json',
  body: '{"ok":true}',
};

describe('InvokeResultPanel', () => {
  it('空结果显示占位文本并禁用复制按钮', () => {
    const wrapper = mount(InvokeResultPanel, {
      props: { activeTab: 'result', invokeResult: null, invokeResultText: '', docDetail },
    });

    expect(wrapper.text()).toContain('暂无数据');
    expect(wrapper.get('.fei-debug-copy').attributes()).toHaveProperty('disabled');
    expect(wrapper.getComponent(CopyIconButton).props('label')).toBe('复制');
    expect(wrapper.getComponent(CopyIconButton).props('placement')).toBe('top-right');
    expect(wrapper.get('.fei-doc-tab.is-active').text()).toBe('请求结果');
  });

  it('有结果时发送复制事件', async () => {
    const wrapper = mount(InvokeResultPanel, {
      props: { activeTab: 'result', invokeResult, invokeResultText: '{"ok":true}', docDetail },
    });

    await wrapper.get('.fei-debug-copy').trigger('click');

    expect(wrapper.emitted('copy-result')).toHaveLength(1);
  });

  it('点击文档标签时发送标签切换事件', async () => {
    const wrapper = mount(InvokeResultPanel, {
      props: { activeTab: 'result', invokeResult: null, invokeResultText: '', docDetail },
    });

    await wrapper.findAll('.fei-doc-tab')[1].trigger('click');

    expect(wrapper.emitted('update:activeTab')).toEqual([['doc']]);
  });

  it('文档标签组合接口文档组件', () => {
    const wrapper = mount(InvokeResultPanel, {
      props: { activeTab: 'doc', invokeResult: null, invokeResultText: '', docDetail },
    });

    expect(wrapper.get('.fei-doc-tab.is-active').text()).toBe('接口文档');
    expect(wrapper.getComponent(InterfaceDocumentation).props('mode')).toBe('compact');
    expect(wrapper.text()).toContain('请求 Header');
    expect(wrapper.text()).toContain('暂无调用示例');
    expect(wrapper.text()).not.toContain('错误码');
  });

  it('展示响应状态、耗时和媒体类型', () => {
    const wrapper = mount(InvokeResultPanel, {
      props: { activeTab: 'result', invokeResult, invokeResultText: '{"ok":true}', docDetail },
    });

    expect(wrapper.text()).toContain('状态 200');
    expect(wrapper.text()).toContain('耗时 36 ms');
    expect(wrapper.text()).toContain('application/json');
  });
});
