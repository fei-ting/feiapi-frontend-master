<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="detail" @logout="handleLogout" />

    <PageContainer>
      <div v-if="loading" class="fei-empty fei-card">正在加载接口详情...</div>
      <div v-else-if="detail" class="fei-layout-detail">
        <section class="fei-panel">
          <div class="fei-detail__head">
            <div>
              <h1 class="fei-detail__title">{{ detail.name }}</h1>
              <p class="fei-section-desc" style="margin-top: 10px">{{ detail.description }}</p>
            </div>
            <StatusTag :status="detail.status" />
          </div>

          <div class="fei-info-grid">
            <div class="fei-info-item">
              <span class="fei-info-label">请求方法</span>
              <MethodTag :method="detail.method" />
            </div>
            <div class="fei-info-item">
              <span class="fei-info-label">配额类型</span>
              <span class="fei-tag" :class="quotaTagClass(detail.quotaType)">
                {{ quotaTypeText(detail) }}
              </span>
            </div>
            <div class="fei-info-item">
              <span class="fei-info-label">请求地址</span>
              <span class="fei-code-inline">{{ detail.url }}</span>
            </div>
            <div class="fei-info-item">
              <span class="fei-info-label">创建时间</span>
              <span>{{ formatDateTime(detail.createTime) }}</span>
            </div>
            <div class="fei-info-item">
              <span class="fei-info-label">更新时间</span>
              <span>{{ formatDateTime(detail.updateTime) }}</span>
            </div>
          </div>

          <div style="margin-top: 18px">
            <div class="fei-info-item">
              <span class="fei-info-label">请求参数</span>
              <pre class="fei-code">{{ detail.requestParams || '[]' }}</pre>
            </div>
            <div class="fei-info-item" style="margin-top: 16px">
              <span class="fei-info-label">请求头</span>
              <pre class="fei-code">{{ detail.requestHeader || '{}' }}</pre>
            </div>
            <div class="fei-info-item" style="margin-top: 16px">
              <span class="fei-info-label">响应头</span>
              <pre class="fei-code">{{ detail.responseHeader || '{}' }}</pre>
            </div>
          </div>
        </section>

        <aside class="fei-panel fei-debug-panel">
          <h2 class="fei-section-title" style="margin-bottom: 18px">在线调试</h2>
          <div v-if="!loginUser" class="fei-empty" style="padding: 26px 10px">
            登录后即可在线调用接口
            <div style="margin-top: 14px">
              <a class="fei-btn fei-btn--primary" href="#/login">去登录</a>
            </div>
          </div>
          <div v-else class="fei-form fei-debug-form">
            <div class="fei-field">
              <label class="fei-label" for="requestParams">请求参数（JSON）</label>
              <textarea id="requestParams" v-model="requestParams" class="fei-textarea" placeholder='{"key":"value"}' />
            </div>
            <div class="fei-toolbar fei-debug-toolbar">
              <button class="fei-btn fei-btn--primary" type="button" @click="invokeApi" :disabled="invokeLoading">
                {{ invokeLoading ? '调用中...' : '发送请求' }}
              </button>
              <button class="fei-btn fei-btn--secondary" type="button" @click="fillExample">填充示例</button>
            </div>
            <div class="fei-debug-output" :class="{ 'fei-debug-output--empty': !invokeResult }">
              <button
                class="fei-debug-copy"
                type="button"
                aria-label="复制"
                data-tooltip="复制"
                :disabled="!invokeResult"
                @click="copyInvokeResult"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M8 8.5C8 7.67 8.67 7 9.5 7h8C18.33 7 19 7.67 19 8.5v8c0 .83-.67 1.5-1.5 1.5h-8C8.67 18 8 17.33 8 16.5v-8Z"
                  />
                  <path d="M5 14.5v-8C5 5.67 5.67 5 6.5 5h8" />
                </svg>
              </button>
              <pre class="fei-debug-output__content">{{ invokeResult || '响应结果将显示在这里' }}</pre>
            </div>
          </div>
        </aside>
      </div>
      <div v-else class="fei-empty fei-card">接口不存在</div>
    </PageContainer>

    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
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
import type { InterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);
const invokeLoading = ref(false);
const detail = ref<InterfaceInfoVO | null>(null);
const loginUser = ref<UserVO | null>(null);
const requestParams = ref('');
const invokeResult = ref('');
const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
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

const validateRequestParamsJson = () => {
  const trimmedParams = requestParams.value.trim();
  if (!trimmedParams) {
    return true;
  }
  try {
    JSON.parse(trimmedParams);
    return true;
  } catch {
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

const getRequestParamsExample = (item: InterfaceInfoVO | null) => {
  const params = item?.requestParams?.trim();
  if (!params) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(params), null, 2);
  } catch {
    return params;
  }
};

const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

const quotaTagClass = (quotaType?: string) => {
  if (quotaType === 'FREE_UNLIMITED') return 'fei-tag--quota-free';
  if (quotaType === 'ADVANCED_TRIAL') return 'fei-tag--quota-trial';
  return 'fei-tag--quota-basic';
};

const quotaTypeText = (item: InterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
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
    detail.value = null;
    loading.value = false;
    return;
  }
  try {
    const res = await interfaceService.getById(id);
    detail.value = res.data || null;
    requestParams.value = getRequestParamsExample(detail.value);
  } catch {
    detail.value = null;
  } finally {
    loading.value = false;
  }
};

const invokeApi = async () => {
  if (!detail.value?.id) return;
  if (!validateRequestParamsJson()) {
    const message = '请求参数必须是合法 JSON';
    invokeResult.value = message;
    showToast(message, 'error');
    return;
  }
  invokeLoading.value = true;
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
  requestParams.value = getRequestParamsExample(detail.value);
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
    // 延迟跳转到首页，让用户看到提示
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
