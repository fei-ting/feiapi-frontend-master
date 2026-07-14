<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="detail" @logout="handleLogout" />

    <PageContainer>
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
          <div class="fei-doc-tabs" role="tablist" aria-label="接口详情标签">
            <button class="fei-doc-tab is-active" type="button" role="tab" aria-selected="true">接口文档</button>
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
    </PageContainer>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CopyOutlined } from '@ant-design/icons-vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import StatusTag from '@/components/StatusTag.vue';
import MethodTag from '@/components/MethodTag.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import type { InterfaceDocDetailVO, InterfaceDocInterfaceInfoVO, InterfaceDocParamVO, UserVO } from '@/types/api';

/** Toast 显示时长（毫秒） */
const TOAST_DURATION = 2200;
/** 退出登录后跳转延迟（毫秒） */
const LOGOUT_REDIRECT_DELAY = 1000;

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const docDetail = ref<InterfaceDocDetailVO | null>(null);
const loginUser = ref<UserVO | null>(null);
const exampleTab = ref<'success' | 'fail'>('success');
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const detail = computed<InterfaceDocInterfaceInfoVO | null>(() => docDetail.value?.interfaceInfo || null);

const showTargetHost = computed(() => loginUser.value?.userRole === 'admin' && Boolean(detail.value?.targetHost));

/** 当前选中的 JSON 返回示例。 */
const activeExampleText = computed(() => {
  if (exampleTab.value === 'fail') {
    return docDetail.value?.doc?.failExample || '';
  }
  return docDetail.value?.doc?.successExample || '';
});

/** 当前返回示例为空时的提示。 */
const activeExampleEmptyText = computed(() => (
  exampleTab.value === 'fail' ? '暂无失败 JSON 示例' : '暂无成功 JSON 示例'
));

/** 当前返回示例复制按钮说明。 */
const activeExampleCopyTitle = computed(() => (
  exampleTab.value === 'fail' ? '复制失败示例' : '复制成功示例'
));

/** 响应参数 ID 与字段名映射。 */
const responseParamNameMap = computed(() => new Map(
  (docDetail.value?.responseParams || [])
    .filter((param) => param.id && param.name)
    .map((param) => [param.id as number, param.name as string]),
));

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, TOAST_DURATION);
};

const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

const quotaTypeText = (item: InterfaceDocInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
};

const interfaceSummary = (item: InterfaceDocInterfaceInfoVO) => item.description || '暂无接口描述';

const methodText = (item: InterfaceDocInterfaceInfoVO) => (item.method || 'GET').toUpperCase();

const prettyJson = (value: string | undefined, fallback: string) => {
  const content = value?.trim();
  if (!content) {
    return fallback;
  }
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

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

const hasRows = <T>(rows?: T[]) => Boolean(rows?.length);

const hasText = (value?: string) => Boolean(value?.trim());

const requiredText = (required?: boolean) => (required ? '是' : '否');

const nullableText = (nullable?: boolean) => (nullable ? '是' : '否');

/** 将参数位置转换为面向使用者的名称。 */
const paramSceneText = (paramScene?: string) => {
  if (paramScene === 'QUERY') return '查询参数';
  if (paramScene === 'BODY') return '请求体';
  return paramScene || '-';
};

/** 将响应参数父级 ID 转换为父级字段名。 */
const parentFieldText = (param: InterfaceDocParamVO) => {
  if (!param.parentId) return '-';
  return responseParamNameMap.value.get(param.parentId) || `未知字段（ID：${param.parentId}）`;
};

const rowKey = (param: InterfaceDocParamVO) => `${param.id || 'legacy'}-${param.paramScene || ''}-${param.name || ''}`;

const paramValue = (param: InterfaceDocParamVO) => param.exampleValue || param.defaultValue || '-';

const headerRequiredText = (param: InterfaceDocParamVO) => {
  if (param.required) return '是';
  if (param.name?.toLowerCase() === 'content-type' && paramValue(param) !== '-') return '是';
  return '否';
};

const headerDescription = (param: InterfaceDocParamVO) => {
  if (param.description && !param.description.includes('旧请求头字段自动转换')) {
    return param.description;
  }
  if (param.name?.toLowerCase() === 'content-type' && paramValue(param) === 'application/json') {
    return '请求体为 JSON 格式时必须设置';
  }
  return param.description || '-';
};

const requestParamDescription = (param: InterfaceDocParamVO) => {
  const parts = [
    param.description && !param.description.includes('旧字段自动转换') ? param.description : '',
    param.exampleValue ? `例如：${param.exampleValue}` : '',
    param.defaultValue ? `默认值：${param.defaultValue}` : '',
    param.validationRule ? param.validationRule : '',
  ].filter(Boolean);
  return parts.length ? parts.join('。') : '-';
};

const copyText = async (text: string) => {
  if (!text.trim()) {
    showToast('暂无可复制内容', 'info');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制', 'success');
  } catch (error) {
    console.error('[InterfaceDetailView] 复制文本失败:', error);
    showToast('复制失败', 'error');
  }
};

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch (error) {
    console.error('[InterfaceDetailView] 加载登录用户信息失败:', error);
    loginUser.value = null;
  }
};

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

const goInvoke = () => {
  if (!detail.value?.id) return;
  router.push(`/interface/${detail.value.id}/invoke`);
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    userStore.clearLoginUser();
    showToast('已安全退出', 'success');
    setTimeout(() => {
      router.replace('/home');
    }, LOGOUT_REDIRECT_DELAY);
  } catch (error) {
    console.error('[InterfaceDetailView] 退出登录失败:', error);
    showToast('退出失败', 'error');
  }
};

onMounted(async () => {
  // 并行加载用户信息和接口详情，提升页面加载速度
  await Promise.all([loadLoginUser(), loadDetail()]);
});
</script>
