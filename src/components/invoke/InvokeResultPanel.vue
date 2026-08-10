<template>
  <aside class="fei-invoke-result fei-panel">
    <div class="fei-doc-tabs fei-doc-tabs--flush" role="tablist" aria-label="在线调用结果标签">
      <button
        class="fei-doc-tab"
        :class="{ 'is-active': activeTab === 'result' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'result'"
        @click="changeTab('result')"
      >
        请求结果
      </button>
      <button
        class="fei-doc-tab"
        :class="{ 'is-active': activeTab === 'doc' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'doc'"
        @click="changeTab('doc')"
      >
        接口文档
      </button>
    </div>

    <div
      v-if="activeTab === 'result'"
      class="fei-invoke-result-content"
    >
      <div v-if="invokeResult" class="fei-invoke-response-meta">
        <span
          class="fei-invoke-response-meta__item"
          :class="invokeResult.successful ? 'is-success' : 'is-error'"
        >
          状态 {{ invokeResult.statusCode ?? '未获得响应' }}
        </span>
        <span class="fei-invoke-response-meta__item">耗时 {{ invokeResult.durationMs }} ms</span>
        <span class="fei-invoke-response-meta__item">
          {{ invokeResult.contentType || '未知媒体类型' }}
        </span>
      </div>
      <div
        class="fei-debug-output fei-invoke-output"
        :class="{ 'fei-debug-output--empty': !invokeResultText }"
      >
        <CopyIconButton
          class="fei-debug-copy"
          placement="top-right"
          :disabled="!invokeResultText"
          @click="requestCopy"
        />
        <pre class="fei-debug-output__content">{{ invokeResultText || '暂无数据' }}</pre>
      </div>
    </div>

    <InterfaceDocumentation
      v-else
      :doc-detail="docDetail"
      mode="compact"
      @copy-text="requestCopyDocText"
    />
  </aside>
</template>

<script setup lang="ts">
import CopyIconButton from '@/components/common/CopyIconButton.vue';
import InterfaceDocumentation from '@/features/interface-platform/documentation/components/InterfaceDocumentation.vue';
import type { InterfaceDocDetailVO } from '@/features/interface-platform/documentation/types/interfaceDoc';
import type { InvokeResponse, InvokeTab } from '@/types/invoke';

/** 调用结果面板组件属性。 */
interface InvokeResultPanelProps {
  /** 当前活动标签。 */
  activeTab: InvokeTab;
  /** 结构化在线调用结果。 */
  invokeResult: InvokeResponse | null;
  /** 格式化后的响应正文或安全错误信息。 */
  invokeResultText: string;
  /** 接口文档聚合详情。 */
  docDetail: InterfaceDocDetailVO;
}

/** 调用结果面板组件事件。 */
interface InvokeResultPanelEmits {
  /** 切换活动标签。 */
  (event: 'update:activeTab', tab: InvokeTab): void;
  /** 请求父页面复制调用结果。 */
  (event: 'copy-result'): void;
  /** 请求父页面复制文档示例。 */
  (event: 'copy-doc-text', text: string): void;
}

defineProps<InvokeResultPanelProps>();
const emit = defineEmits<InvokeResultPanelEmits>();

/**
 * 通知父页面切换活动标签。
 *
 * @param tab 目标标签
 */
const changeTab = (tab: InvokeTab): void => {
  emit('update:activeTab', tab);
};

/** 请求父页面复制调用结果。 */
const requestCopy = (): void => {
  emit('copy-result');
};

/** 请求父页面复制文档示例。 */
const requestCopyDocText = (text: string): void => {
  emit('copy-doc-text', text);
};
</script>
