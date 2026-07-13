<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="detail" @logout="handleLogout" />

    <PageContainer>
      <div v-if="loading" class="fei-empty fei-card">正在加载在线调用...</div>
      <template v-else-if="detail">
        <nav class="fei-breadcrumb" aria-label="在线调用路径">
          <a href="#/market">接口广场</a>
          <span>/</span>
          <a :href="`#/interface/${detail.id}`">{{ detail.name }}</a>
          <span>/</span>
          <span>在线调用</span>
        </nav>

        <div class="fei-invoke-layout">
          <main class="fei-invoke-main">
            <section class="fei-invoke-request fei-panel">
              <div class="fei-invoke-request__head">
                <div>
                  <h1 class="fei-section-title">{{ detail.name }}</h1>
                  <p class="fei-section-desc">{{ interfaceSummary(detail) }}</p>
                </div>
                <StatusTag :status="detail.status" />
              </div>

              <div class="fei-invoke-meta">
                <div class="fei-doc-item">
                  <span class="fei-info-label">请求地址</span>
                  <span class="fei-code-inline fei-code-inline--block">{{ docDetail?.gatewayUrl || '-' }}</span>
                </div>
                <div class="fei-doc-item">
                  <span class="fei-info-label">请求方式</span>
                  <MethodTag :method="detail.method" />
                </div>
                <div class="fei-doc-item">
                  <span class="fei-info-label">请求 Header</span>
                  <span class="fei-code-inline fei-code-inline--block">{{ invokeHeaderText }}</span>
                </div>
              </div>

              <section class="fei-invoke-params" aria-labelledby="invoke-param-title">
                <div class="fei-invoke-params__head">
                  <h2 id="invoke-param-title">请求参数</h2>
                  <span v-if="structuredParams.length" class="fei-invoke-params__hint">
                    发送 API 调用会使用当前登录账号的 APIKey 发起实际调用，请谨慎操作。
                  </span>
                </div>

                <div v-if="structuredParams.length" class="fei-invoke-param-list">
                  <label
                    v-for="param in structuredParams"
                    :key="param.name"
                    class="fei-invoke-param"
                    :for="`invoke-param-${param.name}`"
                  >
                    <span class="fei-invoke-param__label">
                      <span>
                        {{ param.name }}
                        <small>{{ param.type }}</small>
                      </span>
                    </span>
                    <input
                      :id="`invoke-param-${param.name}`"
                      v-model="paramValues[param.name]"
                      class="fei-input"
                      :type="param.type === 'number' ? 'number' : 'text'"
                      :placeholder="`请输入${param.name}`"
                    />
                  </label>
                </div>

                <div v-else class="fei-doc-empty">{{ emptyParamText }}</div>
              </section>

              <div class="fei-toolbar fei-invoke-toolbar">
                <button class="fei-btn fei-btn--primary" type="button" @click="handleInvokeClick" :disabled="invokeLoading">
                  {{ invokeLoading ? '调用中...' : '发送请求' }}
                </button>
                <button
                  v-if="canFillExample"
                  class="fei-btn fei-btn--secondary"
                  type="button"
                  @click="fillExample"
                >
                  填充示例
                </button>
              </div>
            </section>
          </main>

          <aside class="fei-invoke-result fei-panel">
            <div class="fei-doc-tabs fei-doc-tabs--flush" role="tablist" aria-label="在线调用结果标签">
              <button
                class="fei-doc-tab"
                :class="{ 'is-active': activeTab === 'result' }"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'result'"
                @click="activeTab = 'result'"
              >
                请求结果
              </button>
              <button
                class="fei-doc-tab"
                :class="{ 'is-active': activeTab === 'doc' }"
                type="button"
                role="tab"
                :aria-selected="activeTab === 'doc'"
                @click="activeTab = 'doc'"
              >
                接口文档
              </button>
            </div>

            <div v-if="activeTab === 'result'" class="fei-debug-output fei-invoke-output" :class="{ 'fei-debug-output--empty': !invokeResult }">
              <button
                class="fei-debug-copy"
                type="button"
                aria-label="复制"
                data-tooltip="复制"
                :disabled="!invokeResult"
                @click="copyInvokeResult"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 8.5C8 7.67 8.67 7 9.5 7h8C18.33 7 19 7.67 19 8.5v8c0 .83-.67 1.5-1.5 1.5h-8C8.67 18 8 17.33 8 16.5v-8Z" />
                  <path d="M5 14.5v-8C5 5.67 5.67 5 6.5 5h8" />
                </svg>
              </button>
              <pre class="fei-debug-output__content">{{ invokeResult || '暂无数据' }}</pre>
            </div>

            <div v-else class="fei-invoke-doc">
              <div class="fei-doc-section">
                <h3 class="fei-doc-heading">请求 Header</h3>
                <div v-if="hasRows(docDetail?.requestHeaders)" class="fei-table-wrap fei-doc-table-wrap">
                  <table class="fei-table fei-doc-table">
                    <thead>
                      <tr>
                        <th>名称</th>
                        <th>必填</th>
                        <th>值</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="param in docDetail?.requestHeaders" :key="rowKey(param)">
                        <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
                        <td>{{ headerRequiredText(param) }}</td>
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
                <div v-if="hasRows(docDetail?.requestParams)" class="fei-table-wrap fei-doc-table-wrap">
                  <table class="fei-table fei-doc-table">
                    <thead>
                      <tr>
                        <th>名称</th>
                        <th>必填</th>
                        <th>类型</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="param in docDetail?.requestParams" :key="rowKey(param)">
                        <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
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
                <div v-if="hasRows(docDetail?.responseParams)" class="fei-table-wrap fei-doc-table-wrap">
                  <table class="fei-table fei-doc-table">
                    <thead>
                      <tr>
                        <th>字段名</th>
                        <th>类型</th>
                        <th>可能为空</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="param in docDetail?.responseParams" :key="rowKey(param)">
                        <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
                        <td>{{ param.type || '-' }}</td>
                        <td>{{ nullableText(param.nullable) }}</td>
                        <td>{{ param.description || param.exampleValue || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="fei-doc-empty">暂无响应字段说明</div>
              </div>
              <div class="fei-doc-section">
                <h3 class="fei-doc-heading">JSON 返回示例</h3>
                <pre v-if="hasText(docDetail?.doc?.successExample)" class="fei-code">{{ prettyJson(docDetail?.doc?.successExample, '{}') }}</pre>
                <div v-else class="fei-doc-empty">暂无 JSON 返回示例</div>
              </div>
              <div class="fei-doc-section">
                <h3 class="fei-doc-heading">curl 调用示例</h3>
                <pre class="fei-code">{{ docDetail?.curlExample || '暂无调用示例' }}</pre>
              </div>
            </div>
          </aside>
        </div>
      </template>
      <div v-else class="fei-empty fei-card">接口不存在</div>
    </PageContainer>

    <div v-if="dialog.visible" class="fei-modal-mask" role="dialog" aria-modal="true" aria-labelledby="invoke-dialog-title">
      <div class="fei-confirm-dialog">
        <h2 id="invoke-dialog-title">{{ dialog.title }}</h2>
        <p>{{ dialog.message }}</p>
        <div class="fei-confirm-dialog__footer">
          <button class="fei-btn fei-btn--primary" type="button" @click="handleDialogPrimary">
            {{ dialog.primaryText }}
          </button>
          <button class="fei-btn fei-btn--secondary" type="button" @click="closeDialog">
            取消
          </button>
        </div>
      </div>
    </div>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

type InvokeTab = 'result' | 'doc';
type DialogAction = 'login' | 'invoke';
type RequestParamValue = string | number | boolean | Record<string, unknown> | unknown[];

interface RequestParamField {
  name: string;
  type: string;
  example: unknown;
  required: boolean;
  defaultValue?: string;
  description?: string;
  validationRule?: string;
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const invokeLoading = ref(false);
const docDetail = ref<InterfaceDocDetailVO | null>(null);
const loginUser = ref<UserVO | null>(null);
const requestParams = ref('');
const invokeResult = ref('');
const requestParamError = ref('');
const activeTab = ref<InvokeTab>('result');
const structuredParams = ref<RequestParamField[]>([]);
const paramValues = reactive<Record<string, string>>({});
const dialog = reactive({
  visible: false,
  action: 'login' as DialogAction,
  title: '',
  message: '',
  primaryText: '',
});
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const loginHref = computed(() => `#/login?redirect=${encodeURIComponent(route.fullPath)}`);

const detail = computed<InterfaceDocInterfaceInfoVO | null>(() => docDetail.value?.interfaceInfo || null);

const canFillExample = computed(() => structuredParams.value.length > 0 || Boolean(requestParams.value.trim()));

const emptyParamText = computed(() => (docDetail.value?.structuredDocMissing ? '暂无结构化请求参数' : '此接口无需请求参数'));

const invokeHeaderText = computed(() => {
  const headers = docDetail.value?.requestHeaders || [];
  if (!headers.length) {
    return '无请求 Header';
  }
  return headers.map((param) => `${param.name || '-'}: ${paramValue(param)}`).join('\n');
});

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => {
    toast.visible = false;
  }, 2200);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '调用失败，请稍后重试';
};

const resolveParamType = (value: unknown) => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'string';
  if (typeof value === 'string') {
    const marker = value.trim().toLowerCase();
    if (['string', 'number', 'boolean', 'object', 'array'].includes(marker)) {
      return marker;
    }
    return 'string';
  }
  return typeof value;
};

const parseStructuredParams = (doc: InterfaceDocDetailVO | null) => {
  if (!doc || doc.structuredDocMissing) {
    return [];
  }
  return (doc.requestParams || [])
    .filter((param) => param.name)
    .map((param) => ({
      name: param.name as string,
      type: param.type || 'string',
      example: param.exampleValue || param.defaultValue || '',
      required: param.required !== false,
      defaultValue: param.defaultValue,
      description: param.description,
      validationRule: param.validationRule,
    }));
};

const parseParamValue = (param: RequestParamField, rawValue: string) => {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue && param.required) {
    return {
      valid: false,
      message: `请求参数缺少必填字段：${param.name}`,
      value: undefined,
    };
  }
  if (!trimmedValue) {
    return { valid: true, value: undefined };
  }
  if (param.type === 'number') {
    const numberValue = Number(trimmedValue);
    return Number.isFinite(numberValue)
      ? { valid: true, value: numberValue }
      : { valid: false, message: `请求参数字段类型错误：${param.name} 应为 number`, value: undefined };
  }
  if (param.type === 'boolean') {
    if (trimmedValue === 'true' || trimmedValue === '1') {
      return { valid: true, value: true };
    }
    if (trimmedValue === 'false' || trimmedValue === '0') {
      return { valid: true, value: false };
    }
    return {
      valid: false,
      message: `请求参数字段类型错误：${param.name} 应为 boolean`,
      value: undefined,
    };
  }
  if (param.type === 'object' || param.type === 'array') {
    try {
      const parsedValue = JSON.parse(trimmedValue);
      const isExpectedType = param.type === 'array'
        ? Array.isArray(parsedValue)
        : parsedValue !== null && !Array.isArray(parsedValue) && typeof parsedValue === 'object';
      return isExpectedType
        ? { valid: true, value: parsedValue as RequestParamValue }
        : { valid: false, message: `请求参数字段类型错误：${param.name} 应为 ${param.type}`, value: undefined };
    } catch {
      return {
        valid: false,
        message: `请求参数字段类型错误：${param.name} 应为 ${param.type}`,
        value: undefined,
      };
    }
  }
  return { valid: true, value: rawValue };
};

const syncRequestParamsFromFields = () => {
  if (!structuredParams.value.length) {
    return '';
  }
  const params: Record<string, RequestParamValue> = {};
  for (const param of structuredParams.value) {
    const parsedValue = parseParamValue(param, paramValues[param.name] || '');
    if (!parsedValue.valid) {
      return parsedValue.message || '请求参数格式错误';
    }
    if (parsedValue.value !== undefined) {
      params[param.name] = parsedValue.value as RequestParamValue;
    }
  }
  requestParams.value = JSON.stringify(params);
  return '';
};

const validateRequestParamsJson = () => {
  requestParamError.value = '';
  const structuredParamError = syncRequestParamsFromFields();
  if (structuredParamError) {
    requestParamError.value = structuredParamError;
    return false;
  }
  const trimmedParams = requestParams.value.trim();
  if (!trimmedParams) {
    return true;
  }
  try {
    JSON.parse(trimmedParams);
    return true;
  } catch {
    requestParamError.value = '请求参数必须是合法 JSON';
    return false;
  }
};

const formatInvokeResponse = (data: unknown) => {
  if (data === null || data === undefined) {
    return '接口返回为空';
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
};

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

const fillStructuredExample = () => {
  structuredParams.value.forEach((param) => {
    if (param.example === null || param.example === undefined) {
      paramValues[param.name] = '';
    } else if (typeof param.example === 'string' && ['string', 'number', 'boolean', 'object', 'array'].includes(param.example.toLowerCase())) {
      paramValues[param.name] = '';
    } else if (typeof param.example === 'object') {
      paramValues[param.name] = JSON.stringify(param.example);
    } else {
      paramValues[param.name] = String(param.example);
    }
  });
  syncRequestParamsFromFields();
};

const interfaceSummary = (item: InterfaceDocInterfaceInfoVO) => item.description || '暂无接口描述';

const hasRows = <T>(rows?: T[]) => Boolean(rows?.length);

const hasText = (value?: string) => Boolean(value?.trim());

const requiredText = (required?: boolean) => (required ? '是' : '否');

const nullableText = (nullable?: boolean) => (nullable ? '是' : '否');

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

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch {
    loginUser.value = null;
  }
};

const loadDetail = async () => {
  const id = Number(route.params.id);
  if (!id) {
    docDetail.value = null;
    loading.value = false;
    return;
  }
  try {
    const res = await interfaceService.getDocDetail(id);
    docDetail.value = res.data || null;
    structuredParams.value = parseStructuredParams(docDetail.value);
    if (structuredParams.value.length) {
      fillStructuredExample();
    } else {
      requestParams.value = '';
    }
  } catch {
    docDetail.value = null;
  } finally {
    loading.value = false;
  }
};

const openLoginDialog = () => {
  dialog.visible = true;
  dialog.action = 'login';
  dialog.title = '需要登录';
  dialog.message = '需要登录后才能调用接口。';
  dialog.primaryText = '去登录';
};

const openInvokeConfirmDialog = () => {
  dialog.visible = true;
  dialog.action = 'invoke';
  dialog.title = '确认发起调用';
  dialog.message = '此次发起调用会使用当前登录账号的 APIKey 发起实际调用，请谨慎操作。';
  dialog.primaryText = '确认调用';
};

const closeDialog = () => {
  dialog.visible = false;
};

const handleInvokeClick = () => {
  if (!loginUser.value) {
    openLoginDialog();
    return;
  }
  openInvokeConfirmDialog();
};

const handleDialogPrimary = () => {
  if (dialog.action === 'login') {
    window.location.hash = loginHref.value;
    return;
  }
  closeDialog();
  invokeApi();
};

const invokeApi = async () => {
  if (!detail.value?.id) return;
  if (!validateRequestParamsJson()) {
    const message = requestParamError.value || '请求参数必须是合法 JSON';
    invokeResult.value = message;
    activeTab.value = 'result';
    showToast(message, 'error');
    return;
  }
  invokeLoading.value = true;
  activeTab.value = 'result';
  try {
    const res = await interfaceService.invoke({
      id: detail.value.id,
      userRequestParams: requestParams.value,
    });
    invokeResult.value = formatInvokeResponse(res.data);
    showToast('调用成功', 'success');
  } catch (error) {
    const message = getErrorMessage(error);
    invokeResult.value = message;
    showToast(message, 'error');
  } finally {
    invokeLoading.value = false;
  }
};

const fillExample = () => {
  if (structuredParams.value.length) {
    fillStructuredExample();
    return;
  }
};

const copyInvokeResult = async () => {
  if (!invokeResult.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(invokeResult.value);
    showToast('复制成功', 'success');
  } catch {
    showToast('复制失败，请手动选择内容复制', 'error');
  }
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    userStore.clearLoginUser();
    showToast('已安全退出', 'success');
    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  } catch {
    showToast('退出失败', 'error');
  }
};

onMounted(async () => {
  await loadLoginUser();
  await loadDetail();
});
</script>
