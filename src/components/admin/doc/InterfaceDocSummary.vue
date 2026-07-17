<template>
  <section class="fei-doc-summary">
    <div class="fei-doc-summary__identity">
      <span class="fei-method-badge">{{ detail.interfaceInfo.method || 'HTTP' }}</span>
      <div>
        <p class="fei-doc-summary__path">{{ detail.interfaceInfo.path || '-' }}</p>
        <h1>{{ detail.interfaceInfo.name }}</h1>
      </div>
    </div>
    <div class="fei-doc-summary__meta">
      <div><span>当前状态</span><strong>{{ getInterfaceStatusText(detail.interfaceInfo.status) }}</strong></div>
      <div><span>配额类型</span><strong>{{ getQuotaTypeText(detail.interfaceInfo.quotaType, detail.interfaceInfo.quotaTypeText) }}</strong></div>
      <div><span>SDK 方法</span><strong>{{ detail.interfaceInfo.sdkMethodName || '-' }}</strong></div>
    </div>
    <p v-if="!editable" class="fei-doc-summary__notice">
      当前接口不可编辑。请先返回接口列表执行下线操作，再维护运行时配置或接口文档。
    </p>
  </section>
</template>

<script setup lang="ts">
import { getInterfaceStatusText, getQuotaTypeText } from '@/composables/useQuota';
import type { InterfaceDocDetailVO } from '@/types/api';

/** 接口文档概要组件属性。 */
interface InterfaceDocSummaryProps {
  /** 接口文档聚合详情。 */
  detail: InterfaceDocDetailVO;
  /** 当前接口是否允许编辑。 */
  editable: boolean;
}

defineProps<InterfaceDocSummaryProps>();
</script>
