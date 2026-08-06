import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InterfacePublishCheckDialog from '../InterfacePublishCheckDialog.vue';
import type { InterfacePublishCheckVO } from '@/features/interface-platform/publishing/types/interfacePublish';

describe('InterfacePublishCheckDialog', () => {
  it('按分类展示发布检查问题', () => {
    const result: InterfacePublishCheckVO = {
      passed: false,
      issues: [
        {
          category: 'INTERFACE_CONFIG',
          ruleCode: 'INTERFACE_PATH_INVALID',
          field: 'interfaceInfo.path',
          message: '网关路径格式非法',
        },
        {
          category: 'SDK',
          ruleCode: 'SDK_PROBE_STRATEGY_REQUIRED',
          field: 'interfaceInfo.sdkMethodName',
          message: 'SDK 方法必须显式声明安全探测策略',
        },
      ],
    };

    const wrapper = mount(InterfacePublishCheckDialog, {
      props: { open: true, result },
    });

    expect(wrapper.text()).toContain('接口配置');
    expect(wrapper.text()).toContain('SDK 契约');
    expect(wrapper.text()).toContain('interfaceInfo.path');
    expect(wrapper.text()).toContain('网关路径格式非法');
    expect(wrapper.text()).not.toContain('运行时模板');
  });

  it('检查通过时展示通过态', () => {
    const wrapper = mount(InterfacePublishCheckDialog, {
      props: {
        open: true,
        result: {
          passed: true,
          issues: [],
        },
      },
    });

    expect(wrapper.text()).toContain('发布条件已通过');
    expect(wrapper.find('.fei-publish-check-dialog__success').exists()).toBe(true);
  });
});
