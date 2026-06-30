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

        <aside class="fei-panel">
          <h2 class="fei-section-title" style="margin-bottom: 18px">在线调试</h2>
          <div v-if="!loginUser" class="fei-empty" style="padding: 26px 10px">
            登录后即可在线调用接口
            <div style="margin-top: 14px">
              <a class="fei-btn fei-btn--primary" href="#/login">去登录</a>
            </div>
          </div>
          <div v-else class="fei-form">
            <div class="fei-field">
              <label class="fei-label" for="requestParams">请求参数（JSON）</label>
              <textarea id="requestParams" v-model="requestParams" class="fei-textarea" placeholder='{"key":"value"}' />
            </div>
            <div class="fei-toolbar">
              <button class="fei-btn fei-btn--primary" type="button" @click="invokeApi" :disabled="invokeLoading">
                {{ invokeLoading ? '调用中...' : '发送请求' }}
              </button>
              <button class="fei-btn fei-btn--secondary" type="button" @click="fillExample">填充示例</button>
            </div>
            <div class="fei-card" style="padding: 16px; background: #fafcff">
              <pre class="fei-code" style="margin: 0">{{ invokeResult || '响应结果将显示在这里' }}</pre>
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
import type { InterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const invokeLoading = ref(false);
const detail = ref<InterfaceInfoVO | null>(null);
const loginUser = ref<UserVO | null>(null);
const requestParams = ref('{"ip":"8.8.8.8"}');
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
  } catch {
    detail.value = null;
  } finally {
    loading.value = false;
  }
};

const invokeApi = async () => {
  if (!detail.value?.id) return;
  invokeLoading.value = true;
  try {
    const res = await interfaceService.invoke({
      id: detail.value.id,
      userRequestParams: requestParams.value,
    });
    invokeResult.value = JSON.stringify(res.data, null, 2);
    showToast('调用成功', 'success');
  } catch {
    invokeResult.value = '调用失败';
    showToast('调用失败', 'error');
  } finally {
    invokeLoading.value = false;
  }
};

const fillExample = () => {
  requestParams.value = '{"ip":"8.8.8.8"}';
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
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
