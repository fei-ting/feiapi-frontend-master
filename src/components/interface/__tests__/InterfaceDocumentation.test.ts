import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InterfaceDocumentation from '../InterfaceDocumentation.vue';
import type { InterfaceDocDetailVO } from '@/types/api';

/** 构建接口文档组件测试数据。 */
const buildDocDetail = (overrides: Partial<InterfaceDocDetailVO> = {}): InterfaceDocDetailVO => ({
  interfaceInfo: { id: 1, name: '文档接口', method: 'POST', status: 1 },
  doc: { successExample: '{"ok":true}' },
  requestHeaders: [
    { id: 1, name: 'Content-Type', required: false, exampleValue: 'application/json' },
  ],
  requestParams: [
    {
      id: 2,
      name: 'name',
      type: 'string',
      required: true,
      description: '用户名称',
      exampleValue: 'alice',
      validationRule: '不能为空',
    },
  ],
  responseParams: [
    { id: 3, name: 'data', type: 'object', nullable: true, description: '响应数据' },
  ],
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
});
