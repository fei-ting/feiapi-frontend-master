<template>
  <div v-if="loading" class="fei-empty fei-card">正在加载在线调用...</div>
  <template v-else-if="detail && docDetail">
    <nav class="fei-breadcrumb" aria-label="在线调用路径">
      <RouterLink to="/market">接口广场</RouterLink>
      <span>/</span>
      <RouterLink :to="`/interface/${detail.id}`">{{ detail.name }}</RouterLink>
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
              <span class="fei-code-inline fei-code-inline--block">{{ docDetail.gatewayUrl || '-' }}</span>
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

          <RequestParameterForm
            :structured-params="structuredParams"
            :param-values="paramValues"
            :invoke-loading="invokeLoading"
            :can-fill-example="canFillExample"
            :empty-param-text="emptyParamText"
            @update-param="updateParamValue"
            @invoke="handleInvokeClick"
            @fill-example="fillExample"
          />
        </section>
      </main>

      <InvokeResultPanel
        v-model:active-tab="activeTab"
        :invoke-result="invokeResult"
        :doc-detail="docDetail"
        @copy-result="copyInvokeResult"
      />
    </div>
  </template>
  <div v-else class="fei-empty fei-card">接口不存在</div>

  <ConfirmDialog
    :open="dialog.visible"
    :title="dialog.title"
    :message="dialog.message"
    :primary-text="dialog.primaryText"
    title-id="invoke-dialog-title"
    @confirm="handleDialogPrimary"
    @cancel="closeDialog"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import InvokeResultPanel from '@/components/invoke/InvokeResultPanel.vue';
import RequestParameterForm from '@/components/invoke/RequestParameterForm.vue';
import MethodTag from '@/components/MethodTag.vue';
import StatusTag from '@/components/StatusTag.vue';
import { useInterfaceDoc } from '@/composables/useInterfaceDoc';
import { useInterfaceInvoke } from '@/composables/useInterfaceInvoke';
import { interfaceService } from '@/services/interfaceInfo';
import { useUserStore } from '@/stores/user';
import type { InterfaceDocDetailVO, InterfaceDocInterfaceInfoVO } from '@/types/api';
import type { InvokeTab } from '@/types/invoke';

/** 在线调用弹窗动作。 */
type DialogAction = 'login' | 'invoke';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

/** 在线调用页面事件。 */
const emit = defineEmits<{
  /** 将 Toast 通知交给页面布局展示。 */
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

const {
  showToast,
  copyText,
  paramValue,
  interfaceSummary,
} = useInterfaceDoc((message, type) => emit('show-toast', message, type));

/** 页面加载状态。 */
const loading = ref(true);

/** 接口调用状态。 */
const invokeLoading = ref(false);

/** 接口文档聚合详情。 */
const docDetail = ref<InterfaceDocDetailVO | null>(null);

const {
  requestParams,
  requestParamError,
  structuredParams,
  paramValues,
  validateRequestParams,
  fillStructuredExample,
  syncFromDocument,
} = useInterfaceInvoke(docDetail);

/** 格式化后的调用结果。 */
const invokeResult = ref('');

/** 结果区域的当前标签。 */
const activeTab = ref<InvokeTab>('result');

/** 登录或真实调用确认弹窗状态。 */
const dialog = reactive({
  visible: false,
  action: 'login' as DialogAction,
  title: '',
  message: '',
  primaryText: '',
});

/** 登录页面链接，保留当前页面作为回跳地址。 */
const loginHref = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`);

/** 当前接口基础信息。 */
const detail = computed<InterfaceDocInterfaceInfoVO | null>(() => docDetail.value?.interfaceInfo || null);

/** 是否存在可以填充的示例参数。 */
const canFillExample = computed(() => structuredParams.value.length > 0 || Boolean(requestParams.value.trim()));

/** 没有结构化参数时的提示文本。 */
const emptyParamText = computed(() => (
  docDetail.value?.structuredDocMissing ? '暂无结构化请求参数' : '此接口无需请求参数'
));

/** 请求 Header 汇总文本。 */
const invokeHeaderText = computed(() => {
  const headers = docDetail.value?.requestHeaders || [];
  if (!headers.length) {
    return '无请求 Header';
  }
  return headers.map((param) => `${param.name || '-'}: ${paramValue(param)}`).join('\n');
});

/**
 * 获取接口调用错误消息。
 *
 * @param error 错误对象
 * @returns 可展示的错误消息
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '调用失败，请稍后重试';
};

/**
 * 格式化接口调用响应。
 *
 * @param data 响应数据
 * @returns 格式化后的结果文本
 */
const formatInvokeResponse = (data: unknown): string => {
  if (data === null || data === undefined) {
    return '接口返回为空';
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data, null, 2);
};

/** 加载接口文档详情。 */
const loadDetail = async (): Promise<void> => {
  const id = Number(route.params.id);
  if (!id) {
    docDetail.value = null;
    loading.value = false;
    return;
  }
  try {
    const data = await interfaceService.getDocDetail(id);
    docDetail.value = data || null;
    syncFromDocument();
  } catch (error) {
    console.error('[InterfaceInvokeView] 加载接口文档详情失败:', error);
    docDetail.value = null;
  } finally {
    loading.value = false;
  }
};

/** 打开登录确认弹窗。 */
const openLoginDialog = (): void => {
  dialog.visible = true;
  dialog.action = 'login';
  dialog.title = '需要登录';
  dialog.message = '需要登录后才能调用接口。';
  dialog.primaryText = '去登录';
};

/** 打开真实调用确认弹窗。 */
const openInvokeConfirmDialog = (): void => {
  dialog.visible = true;
  dialog.action = 'invoke';
  dialog.title = '确认发起调用';
  dialog.message = '此次发起调用会使用当前登录账号的 APIKey 发起实际调用，请谨慎操作。';
  dialog.primaryText = '确认调用';
};

/** 关闭当前确认弹窗。 */
const closeDialog = (): void => {
  dialog.visible = false;
};

/** 根据登录状态处理发送请求操作。 */
const handleInvokeClick = (): void => {
  if (!userStore.loginUser) {
    openLoginDialog();
    return;
  }
  openInvokeConfirmDialog();
};

/** 处理确认弹窗主操作。 */
const handleDialogPrimary = (): void => {
  if (dialog.action === 'login') {
    void router.push(loginHref.value);
    return;
  }
  closeDialog();
  void invokeApi();
};

/** 调用真实接口并更新结果区域。 */
const invokeApi = async (): Promise<void> => {
  if (!detail.value?.id) {
    return;
  }
  if (!validateRequestParams()) {
    const message = requestParamError.value || '请求参数必须是合法 JSON';
    invokeResult.value = message;
    activeTab.value = 'result';
    showToast(message, 'error');
    return;
  }
  invokeLoading.value = true;
  activeTab.value = 'result';
  try {
    const data = await interfaceService.invoke({
      id: detail.value.id,
      userRequestParams: requestParams.value,
    });
    invokeResult.value = formatInvokeResponse(data);
    showToast('调用成功', 'success');
  } catch (error) {
    const message = getErrorMessage(error);
    invokeResult.value = message;
    showToast(message, 'error');
  } finally {
    invokeLoading.value = false;
  }
};

/** 填充结构化参数示例。 */
const fillExample = (): void => {
  if (structuredParams.value.length) {
    fillStructuredExample();
    return;
  }
  showToast('暂无可填充的示例参数', 'info');
};

/**
 * 更新指定参数输入值。
 *
 * @param name 参数名称
 * @param value 参数值
 */
const updateParamValue = (name: string, value: string): void => {
  paramValues[name] = value;
};

/** 复制当前调用结果。 */
const copyInvokeResult = async (): Promise<void> => {
  if (!invokeResult.value) {
    return;
  }
  await copyText(invokeResult.value);
};

onMounted(() => {
  void loadDetail();
});
</script>
