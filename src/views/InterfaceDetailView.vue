<template>
  <div v-if="loading" class="fei-empty fei-card">正在加载接口详情...</div>
  <template v-else-if="detail && docDetail">
    <nav class="fei-breadcrumb" aria-label="接口详情路径">
      <RouterLink to="/market">接口广场</RouterLink>
      <span>/</span>
      <span>{{ detail.name }}</span>
    </nav>

    <section class="fei-detail-hero fei-panel">
      <div class="fei-detail-hero__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 17.5 10 20l10-8-6-2.5"></path>
          <path d="M4 12.5 10 15l10-8-10-3-6 4.5 6 2.5"></path>
        </svg>
      </div>
      <div class="fei-detail-hero__content">
        <div class="fei-detail-hero__title-row">
          <h1 class="fei-detail__title">{{ detail.name }}</h1>
          <StatusTag :status="detail.status" />
        </div>
        <p class="fei-section-desc fei-detail-hero__desc">{{ interfaceSummary(detail) }}</p>
        <div class="fei-detail-hero__meta" aria-label="接口摘要">
          <span><strong>{{ methodText(detail) }}</strong> 请求方式</span>
          <span>{{ getQuotaTypeText(detail.quotaType, detail.quotaTypeText) }}</span>
          <span>调用 {{ detail.totalNum ?? 0 }} 次</span>
          <span>更新于 {{ formatDateTime(detail.updateTime) }}</span>
        </div>
      </div>
      <div class="fei-detail-hero__action">
        <button class="fei-btn fei-btn--primary" type="button" @click="goInvoke">
          免费调用
        </button>
      </div>
    </section>

    <section class="fei-doc-panel fei-panel" aria-labelledby="interface-doc-title">
      <div class="fei-doc-tabs">
        <span class="fei-doc-tab is-active">接口文档</span>
      </div>

      <div class="fei-doc-section">
        <div class="fei-doc-section__head">
          <div>
            <h2 id="interface-doc-title" class="fei-section-title">基础信息</h2>
            <p v-if="docDetail.structuredDocMissing" class="fei-section-desc">当前接口尚未维护完整的结构化文档。</p>
          </div>
          <span class="fei-doc-version">{{ docDetail.doc?.docVersion || 'v1' }}</span>
        </div>
        <div class="fei-doc-info-grid">
          <div class="fei-doc-info-item fei-doc-info-item--wide">
            <span class="fei-info-label">接口地址</span>
            <span class="fei-code-inline fei-code-inline--block">{{ docDetail.gatewayUrl || '-' }}</span>
          </div>
          <div class="fei-doc-info-item">
            <span class="fei-info-label">请求方法</span>
            <MethodTag :method="detail.method" />
          </div>
          <div class="fei-doc-info-item">
            <span class="fei-info-label">请求格式</span>
            <span>{{ docDetail.doc?.requestContentType || '-' }}</span>
          </div>
          <div class="fei-doc-info-item">
            <span class="fei-info-label">响应格式</span>
            <span>{{ docDetail.doc?.responseContentType || '-' }}</span>
          </div>
          <div class="fei-doc-info-item">
            <span class="fei-info-label">配额类型</span>
            <span>{{ getQuotaTypeText(detail.quotaType, detail.quotaTypeText) }}</span>
          </div>
          <div class="fei-doc-info-item">
            <span class="fei-info-label">更新时间</span>
            <span>{{ formatDateTime(detail.updateTime) }}</span>
          </div>
          <div v-if="showTargetHost" class="fei-doc-info-item fei-doc-info-item--wide">
            <span class="fei-info-label">真实后端地址</span>
            <span class="fei-code-inline fei-code-inline--block">{{ detail.targetHost }}</span>
          </div>
          <div class="fei-doc-info-item fei-doc-info-item--wide">
            <span class="fei-info-label">鉴权说明</span>
            <span>{{ docDetail.doc?.authDescription || '通过平台签名鉴权，由网关统一校验。' }}</span>
          </div>
        </div>
      </div>

      <InterfaceDocumentation
        :doc-detail="docDetail"
        mode="detail"
        @copy-text="copyText"
      >
        <template #copy-icon>
          <CopyOutlined />
        </template>
      </InterfaceDocumentation>
    </section>
  </template>
  <div v-else class="fei-empty fei-card">接口不存在</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CopyOutlined } from '@ant-design/icons-vue';
import InterfaceDocumentation from '@/components/interface/InterfaceDocumentation.vue';
import MethodTag from '@/components/MethodTag.vue';
import StatusTag from '@/components/StatusTag.vue';
import { useFormat } from '@/composables/useFormat';
import { useInterfaceDoc } from '@/composables/useInterfaceDoc';
import { useQuota } from '@/composables/useQuota';
import { interfaceService } from '@/services/interfaceInfo';
import { useUserStore } from '@/stores/user';
import type { InterfaceDocDetailVO, InterfaceDocInterfaceInfoVO } from '@/types/interfaceDoc';

/**
 * 接口详情页面组件。
 * 展示接口基础信息并编排公共接口文档组件。
 */

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { getQuotaTypeText } = useQuota();
const { formatDateTime } = useFormat();

/** 组件事件。 */
const emit = defineEmits<{
  /** 请求应用布局展示 Toast。 */
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

const { copyText, interfaceSummary } = useInterfaceDoc((message, type) => emit('show-toast', message, type));

/** 加载状态。 */
const loading = ref(true);

/** 接口文档详情。 */
const docDetail = ref<InterfaceDocDetailVO | null>(null);

/** 接口信息。 */
const detail = computed<InterfaceDocInterfaceInfoVO | null>(() => docDetail.value?.interfaceInfo || null);

/** 是否显示真实后端地址，仅管理员可见。 */
const showTargetHost = computed(() => userStore.loginUser?.userRole === 'admin' && Boolean(detail.value?.targetHost));

/**
 * 获取请求方法文本。
 *
 * @param item 接口信息
 * @returns 请求方法文本
 */
const methodText = (item: InterfaceDocInterfaceInfoVO): string => (item.method || 'GET').toUpperCase();

/** 加载接口文档详情。 */
const loadDetail = async (): Promise<void> => {
  const id = Number(route.params.id);
  if (Number.isNaN(id) || id <= 0) {
    docDetail.value = null;
    loading.value = false;
    return;
  }
  try {
    const data = await interfaceService.getDocDetail(id);
    docDetail.value = data || null;
  } catch (error) {
    console.error('[InterfaceDetailView] 加载接口文档详情失败:', error);
    docDetail.value = null;
  } finally {
    loading.value = false;
  }
};

/** 跳转到在线调用页面。 */
const goInvoke = async (): Promise<void> => {
  if (!detail.value?.id) return;
  await router.push(`/interface/${detail.value.id}/invoke`);
};

onMounted(async () => {
  await loadDetail();
});
</script>
