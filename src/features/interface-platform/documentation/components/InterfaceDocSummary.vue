<template>
  <section class="fei-doc-summary">
    <div class="fei-doc-summary__identity">
      <span class="fei-method-badge">{{ detail.interfaceInfo.method || 'HTTP' }}</span>
      <div>
        <h1>{{ detail.interfaceInfo.name }}</h1>
        <p class="fei-doc-summary__path">{{ detail.interfaceInfo.path || '-' }}</p>
      </div>
    </div>
    <p class="fei-doc-summary__description">{{ detail.interfaceInfo.description || '暂无接口描述' }}</p>
    <div class="fei-doc-summary__meta">
      <div>
        <span>当前状态</span>
        <strong
          class="fei-doc-summary__status"
          :class="{
            'fei-doc-summary__status--online': detail.interfaceInfo.status === 1,
            'fei-doc-summary__status--publishing': detail.interfaceInfo.status === 2,
            'fei-doc-summary__status--offline': detail.interfaceInfo.status !== 1 && detail.interfaceInfo.status !== 2,
          }"
        >
          <span aria-hidden="true"></span>
          {{ getInterfaceStatusText(detail.interfaceInfo.status) }}
        </strong>
      </div>
      <div><span>配额类型</span><strong>{{ getQuotaTypeText(detail.interfaceInfo.quotaType, detail.interfaceInfo.quotaTypeText) }}</strong></div>
      <div><span>SDK 方法</span><strong class="fei-doc-summary__sdk-method">{{ detail.interfaceInfo.sdkMethodName || '-' }}</strong></div>
      <div>
        <span>文档状态</span>
        <strong class="fei-doc-status" :class="`fei-doc-status--${detail.docStatus.toLowerCase()}`">
          <span aria-hidden="true"></span>
          {{ detail.docStatus === 'READY' ? '已完成' : '草稿' }}
        </strong>
      </div>
    </div>
    <div v-if="!editable" class="fei-doc-summary__notice" role="note">
      <span class="fei-doc-summary__notice-icon" aria-hidden="true">!</span>
      <div>
        <strong>当前为只读模式</strong>
        <p>如需修改运行时配置或接口文档，请先返回接口列表将接口下线。</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getInterfaceStatusText, getQuotaTypeText } from '@/composables/useQuota';
import type { InterfaceDocDetailVO } from '@/features/interface-platform/documentation/types/interfaceDoc';

/** 接口文档概要组件属性。 */
interface InterfaceDocSummaryProps {
  /** 接口文档聚合详情。 */
  detail: InterfaceDocDetailVO;
  /** 当前接口是否允许编辑。 */
  editable: boolean;
}

defineProps<InterfaceDocSummaryProps>();
</script>
