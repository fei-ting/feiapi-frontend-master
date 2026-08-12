import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SystemRequestHeaderSummary from '../SystemRequestHeaderSummary.vue';

describe('SystemRequestHeaderSummary', () => {
  it('只读展示系统派生的Content-Type', () => {
    const wrapper = mount(SystemRequestHeaderSummary, {
      props: { requestContentType: 'application/json' },
    });

    expect(wrapper.text()).toContain('请求 Header');
    expect(wrapper.text()).toContain('Content-Type');
    expect(wrapper.text()).toContain('application/json');
    expect(wrapper.text()).not.toContain('说明');
    expect(wrapper.text()).not.toContain('由系统根据请求内容类型自动生成');
    expect(wrapper.findAll('input')).toHaveLength(0);
    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('请求格式变化时立即更新派生值', async () => {
    const wrapper = mount(SystemRequestHeaderSummary, {
      props: { requestContentType: 'application/json' },
    });

    await wrapper.setProps({ requestContentType: 'text/plain' });

    expect(wrapper.text()).toContain('text/plain');
    expect(wrapper.text()).not.toContain('application/json');
  });
});
