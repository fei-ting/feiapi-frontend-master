<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="detail" @logout="handleLogout" />

    <PageContainer>
      <div v-if="loading" class="fei-empty fei-card">正在加载接口详情...</div>
      <template v-else-if="detail">
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
            <h2 id="interface-doc-title" class="fei-section-title">接口文档</h2>
            <div class="fei-doc-grid">
              <div class="fei-doc-item">
                <span class="fei-info-label">请求地址</span>
                <span class="fei-code-inline fei-code-inline--block">{{ detail.url || '-' }}</span>
              </div>
              <div class="fei-doc-item">
                <span class="fei-info-label">请求方法</span>
                <MethodTag :method="detail.method" />
              </div>
            </div>
          </div>

          <div class="fei-doc-section">
            <h3 class="fei-doc-heading">请求参数</h3>
            <pre class="fei-code">{{ prettyJson(detail.requestParams, '[]') }}</pre>
          </div>
          <div class="fei-doc-section">
            <h3 class="fei-doc-heading">请求头</h3>
            <pre class="fei-code">{{ prettyJson(detail.requestHeader, '{}') }}</pre>
          </div>
          <div class="fei-doc-section">
            <h3 class="fei-doc-heading">响应头</h3>
            <pre class="fei-code">{{ prettyJson(detail.responseHeader, '{}') }}</pre>
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
const detail = ref<InterfaceInfoVO | null>(null);
const loginUser = ref<UserVO | null>(null);
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

const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

const quotaTypeText = (item: InterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
};

const interfaceSummary = (item: InterfaceInfoVO) => item.description || '暂无接口描述';

const methodText = (item: InterfaceInfoVO) => (item.method || 'GET').toUpperCase();

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
  } catch {
    detail.value = null;
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
