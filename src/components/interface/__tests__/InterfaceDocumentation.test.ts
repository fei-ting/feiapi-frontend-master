import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InterfaceDocumentation from '../InterfaceDocumentation.vue';
import type { InterfaceDocDetailVO } from '@/types/api';

/** 构建接口文档组件测试数据。 */
const buildDocDetail = (overrides: Partial<InterfaceDocDetailVO> = {}): InterfaceDocDetailVO => ({
  interfaceInfo: { id: 1, name: '文档接口', method: 'POST', status: 1 },
  doc: {
    successExample: '{"ok":true}',
    failExample: '{"ok":false}',
  },
  requestHeaders: [
    { id: 1, name: 'Content-Type', required: false, exampleValue: 'application/json' },
  ],
  requestParams: [
    {
      id: 2,
      name: 'name',
      type: 'string',
      required: true,
      paramScene: 'BODY',
      description: '用户名称',
      exampleValue: 'alice',
      validationRule: '不能为空',
    },
  ],
  responseParams: [
    { id: 3, name: 'data', type: 'object', nullable: true, description: '响应数据' },
    { id: 4, parentId: 3, name: 'value', type: 'string', nullable: false, description: '响应值' },
    { id: 5, parentId: 99, name: 'legacy', type: 'string', nullable: false, description: '历史字段' },
  ],
  errorCodes: [{ id: 1, errorCode: 'A001', errorMessage: '参数错误', solution: '检查请求参数' }],
  curlExample: 'curl -X POST /api/doc',
  ...overrides,
});

describe('InterfaceDocumentation', () => {
  it('渲染五个文档分区并保持字段格式化规则', () => {
    const wrapper = mount(InterfaceDocumentation, {
      props: { docDetail: buildDocDetail() },
    });

    expect(wrapper.findAll('.fei-doc-section')).toHaveLength(5);
    expect(wrapper.text()).toContain('Content-Type是application/json请求体为 JSON 格式时必须设置');
    expect(wrapper.text()).toContain('用户名称。例如：alice。不能为空');
    expect(wrapper.text()).toContain('dataobject是响应数据');
    expect(wrapper.get('pre.fei-code').text()).toContain('"ok": true');
    expect(wrapper.text()).toContain('curl -X POST /api/doc');
    expect(wrapper.classes()).toContain('fei-invoke-doc');
    expect(wrapper.text()).not.toContain('错误码');
    expect(wrapper.find('.fei-example-switch').exists()).toBe(false);
    expect(wrapper.find('button[title="复制 curl 示例"]').exists()).toBe(false);
  });

  it('详情模式展示完整列、错误码和响应父级字段', () => {
    const wrapper = mount(InterfaceDocumentation, {
      props: { docDetail: buildDocDetail(), mode: 'detail' },
      slots: { 'copy-icon': '<span class="test-copy-icon" />' },
    });

    expect(wrapper.findAll('.fei-doc-section')).toHaveLength(6);
    expect(wrapper.classes()).not.toContain('fei-invoke-doc');
    expect(wrapper.classes()).toContain('fei-interface-documentation--detail');
    expect(wrapper.findAll('.test-copy-icon')).toHaveLength(2);
    expect(wrapper.text()).toContain('位置');
    expect(wrapper.text()).toContain('父级字段');
    expect(wrapper.text()).toContain('请求体');
    expect(wrapper.text()).toContain('valuestring否data响应值');
    expect(wrapper.text()).toContain('未知字段（ID：99）');
    expect(wrapper.text()).toContain('A001参数错误-检查请求参数');
  });

  it('详情模式切换示例并发送复制事件', async () => {
    const wrapper = mount(InterfaceDocumentation, {
      props: { docDetail: buildDocDetail(), mode: 'detail' },
    });

    await wrapper.get('button[title="复制成功示例"]').trigger('click');
    await wrapper.findAll('.fei-example-switch__button')[1].trigger('click');
    expect(wrapper.get('pre.fei-code').text()).toContain('"ok": false');
    await wrapper.get('button[title="复制失败示例"]').trigger('click');
    await wrapper.get('button[title="复制 curl 示例"]').trigger('click');

    expect(wrapper.emitted('copy-text')).toEqual([
      ['{"ok":true}'],
      ['{"ok":false}'],
      ['curl -X POST /api/doc'],
    ]);
  });

  it('文档内容为空时渲染五个分区空状态', () => {
    const wrapper = mount(InterfaceDocumentation, {
      props: {
        docDetail: buildDocDetail({
          doc: undefined,
          requestHeaders: [],
          requestParams: [],
          responseParams: [],
          curlExample: '',
        }),
      },
    });

    expect(wrapper.text()).toContain('无请求 Header');
    expect(wrapper.text()).toContain('无请求参数');
    expect(wrapper.text()).toContain('暂无响应字段说明');
    expect(wrapper.text()).toContain('暂无 JSON 返回示例');
    expect(wrapper.text()).toContain('暂无调用示例');
  });

  it('详情模式展示失败示例和错误码空状态', async () => {
    const wrapper = mount(InterfaceDocumentation, {
      props: {
        mode: 'detail',
        docDetail: buildDocDetail({
          doc: { successExample: '{bad json' },
          errorCodes: [],
        }),
      },
    });

    expect(wrapper.get('pre.fei-code').text()).toBe('{bad json');
    expect(wrapper.text()).toContain('暂无接口级错误码');
    await wrapper.findAll('.fei-example-switch__button')[1].trigger('click');
    expect(wrapper.text()).toContain('暂无失败 JSON 示例');
    expect(wrapper.get('button[title="复制失败示例"]').attributes()).toHaveProperty('disabled');
  });
});
