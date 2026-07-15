<template>
  <div v-if="loading" class="fei-empty fei-card">正在加载接口详情...</div>
  <template v-else-if="detail && docDetail">
    <nav class="fei-breadcrumb" aria-label="接口详情路径">
      <a href="#/market">接口广场</a>
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
          <span>{{ quotaTypeText(detail) }}</span>
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
            <span>{{ quotaTypeText(detail) }}</span>
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

      <div class="fei-doc-section">
        <h3 class="fei-doc-heading">请求 Header</h3>
        <div v-if="hasRows(docDetail.requestHeaders)" class="fei-table-wrap fei-doc-table-wrap">
          <table class="fei-table fei-doc-table">
            <thead>
              <tr>
                <th scope="col">名称</th>
                <th scope="col">必填</th>
                <th scope="col">类型</th>
                <th scope="col">值</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="param in docDetail.requestHeaders" :key="rowKey(param)">
                <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
                <td>{{ headerRequiredText(param) }}</td>
                <td>{{ param.type || '-' }}</td>
                <td><span class="fei-doc-example">{{ paramValue(param) }}</span></td>
                <td>{{ headerDescription(param) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="fei-doc-empty">无请求 Header</div>
      </div>

      <div class="fei-doc-section">
        <h3 class="fei-doc-heading">请求参数</h3>
        <div v-if="hasRows(docDetail.requestParams)" class="fei-table-wrap fei-doc-table-wrap">
          <table class="fei-table fei-doc-table">
            <thead>
              <tr>
                <th scope="col">名称</th>
                <th scope="col">位置</th>
                <th scope="col">必填</th>
                <th scope="col">类型</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="param in docDetail.requestParams" :key="rowKey(param)">
                <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
                <td>{{ paramSceneText(param.paramScene) }}</td>
                <td>{{ requiredText(param.required) }}</td>
                <td>{{ param.type || '-' }}</td>
                <td>{{ requestParamDescription(param) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="fei-doc-empty">无请求参数</div>
      </div>

      <div class="fei-doc-section">
        <h3 class="fei-doc-heading">响应参数</h3>
        <div v-if="hasRows(docDetail.responseParams)" class="fei-table-wrap fei-doc-table-wrap">
          <table class="fei-table fei-doc-table">
            <thead>
              <tr>
                <th scope="col">字段名</th>
                <th scope="col">类型</th>
                <th scope="col">可能为空</th>
                <th scope="col">父级字段</th>
                <th scope="col">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="param in docDetail.responseParams" :key="rowKey(param)">
                <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
                <td>{{ param.type || '-' }}</td>
                <td>{{ nullableText(param.nullable) }}</td>
                <td>{{ parentFieldText(param) }}</td>
                <td>{{ param.description || param.exampleValue || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="fei-doc-empty">暂无响应字段说明</div>
      </div>

      <div class="fei-doc-section">
        <div class="fei-doc-section__head">
          <h3 class="fei-doc-heading">JSON 返回示例</h3>
          <button
            class="fei-icon-btn"
            type="button"
            :title="activeExampleCopyTitle"
            :disabled="!hasText(activeExampleText)"
            @click="copyText(activeExampleText)"
          >
            <CopyOutlined />
          </button>
        </div>
        <div class="fei-example-switch" role="tablist" aria-label="返回示例类型">
          <button
            class="fei-example-switch__button"
            :class="{ 'is-active': exampleTab === 'success' }"
            type="button"
            role="tab"
            :aria-selected="exampleTab === 'success'"
            @click="exampleTab = 'success'"
          >
            成功示例
          </button>
          <button
            class="fei-example-switch__button"
            :class="{ 'is-active': exampleTab === 'fail' }"
            type="button"
            role="tab"
            :aria-selected="exampleTab === 'fail'"
            @click="exampleTab = 'fail'"
          >
            失败示例
          </button>
        </div>
        <pre v-if="hasText(activeExampleText)" class="fei-code">{{ prettyJson(activeExampleText, '{}') }}</pre>
        <div v-else class="fei-doc-empty">{{ activeExampleEmptyText }}</div>
      </div>

      <div class="fei-doc-section">
        <h3 class="fei-doc-heading">错误码</h3>
        <div v-if="hasRows(docDetail.errorCodes)" class="fei-table-wrap fei-doc-table-wrap">
          <table class="fei-table fei-doc-table">
            <thead>
              <tr>
                <th scope="col">错误码</th>
                <th scope="col">错误信息</th>
                <th scope="col">说明</th>
                <th scope="col">解决建议</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="errorCode in docDetail.errorCodes" :key="errorCode.id || errorCode.errorCode">
                <td><span class="fei-doc-param-name">{{ errorCode.errorCode || '-' }}</span></td>
                <td>{{ errorCode.errorMessage || '-' }}</td>
                <td>{{ errorCode.description || '-' }}</td>
                <td>{{ errorCode.solution || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="fei-doc-empty">暂无接口级错误码</div>
      </div>

      <div class="fei-doc-section">
        <div class="fei-doc-section__head">
          <h3 class="fei-doc-heading">curl 调用示例</h3>
          <button class="fei-icon-btn" type="button" title="复制 curl 示例" @click="copyText(docDetail.curlExample || '')">
            <CopyOutlined />
          </button>
        </div>
        <pre class="fei-code">{{ docDetail.curlExample || '暂无调用示例' }}</pre>
      </div>
    </section>
  </template>
  <div v-else class="fei-empty fei-card">接口不存在</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CopyOutlined } from '@ant-design/icons-vue';
import StatusTag from '@/components/StatusTag.vue';
import MethodTag from '@/components/MethodTag.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { useUserStore } from '@/stores/user';
import { useInterfaceDoc } from '@/composables/useInterfaceDoc';
import type { InterfaceDocDetailVO, InterfaceDocInterfaceInfoVO, InterfaceDocParamVO } from '@/types/api';

/**
 * 接口详情页面组件
 * 展示接口文档、请求参数、响应参数等信息
 */

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 使用共享 composable
const {
  showToast,
  copyText,
  hasRows,
  hasText,
  requiredText,
  nullableText,
  rowKey,
  paramValue,
  headerRequiredText,
  headerDescription,
  requestParamDescription,
  prettyJson,
  interfaceSummary,
} = useInterfaceDoc();

/** 加载状态 */
const loading = ref(true);

/** 接口文档详情 */
const docDetail = ref<InterfaceDocDetailVO | null>(null);

/** 当前选中的示例标签 */
const exampleTab = ref<'success' | 'fail'>('success');

/** 接口信息 */
const detail = computed<InterfaceDocInterfaceInfoVO | null>(() => docDetail.value?.interfaceInfo || null);

/** 是否显示真实后端地址（仅管理员可见） */
const showTargetHost = computed(() => userStore.loginUser?.userRole === 'admin' && Boolean(detail.value?.targetHost));

/** 当前选中的 JSON 返回示例 */
const activeExampleText = computed(() => {
  if (exampleTab.value === 'fail') {
    return docDetail.value?.doc?.failExample || '';
  }
  return docDetail.value?.doc?.successExample || '';
});

/** 当前返回示例为空时的提示 */
const activeExampleEmptyText = computed(() => (
  exampleTab.value === 'fail' ? '暂无失败 JSON 示例' : '暂无成功 JSON 示例'
));

/** 当前返回示例复制按钮说明 */
const activeExampleCopyTitle = computed(() => (
  exampleTab.value === 'fail' ? '复制失败示例' : '复制成功示例'
));

/** 响应参数 ID 与字段名映射 */
const responseParamNameMap = computed(() => new Map(
  (docDetail.value?.responseParams || [])
    .filter((param) => param.id && param.name)
    .map((param) => [param.id as number, param.name as string]),
));

/**
 * 判断是否为免费无限配额
 * @param quotaType 配额类型
 * @returns 是否为免费无限
 */
const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

/**
 * 获取配额类型文本
 * @param item 接口信息
 * @returns 配额类型文本
 */
const quotaTypeText = (item: InterfaceDocInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
};

/**
 * 获取请求方法文本
 * @param item 接口信息
 * @returns 请求方法文本
 */
const methodText = (item: InterfaceDocInterfaceInfoVO) => (item.method || 'GET').toUpperCase();

/**
 * 格式化日期时间
 * @param value 日期时间字符串
 * @returns 格式化后的日期时间
 */
const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
};

/**
 * 将参数位置转换为面向使用者的名称
 * @param paramScene 参数位置
 * @returns 参数位置名称
 */
const paramSceneText = (paramScene?: string) => {
  if (paramScene === 'QUERY') return '查询参数';
  if (paramScene === 'BODY') return '请求体';
  return paramScene || '-';
};

/**
 * 将响应参数父级 ID 转换为父级字段名
 * @param param 响应参数
 * @returns 父级字段名
 */
const parentFieldText = (param: InterfaceDocParamVO) => {
  if (!param.parentId) return '-';
  return responseParamNameMap.value.get(param.parentId) || `未知字段（ID：${param.parentId}）`;
};

/**
 * 加载接口文档详情
 */
const loadDetail = async () => {
  const id = Number(route.params.id);
  if (isNaN(id) || id <= 0) {
    docDetail.value = null;
    loading.value = false;
    return;
  }
  try {
    const res = await interfaceService.getDocDetail(id);
    docDetail.value = res.data || null;
  } catch (error) {
    console.error('[InterfaceDetailView] 加载接口文档详情失败:', error);
    docDetail.value = null;
  } finally {
    loading.value = false;
  }
};

/**
 * 跳转到在线调用页面
 */
const goInvoke = () => {
  if (!detail.value?.id) return;
  router.push(`/interface/${detail.value.id}/invoke`);
};

onMounted(async () => {
  await loadDetail();
});
</script>
