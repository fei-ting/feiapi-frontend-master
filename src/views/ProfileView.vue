<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="profile" @logout="handleLogout" />
    <PageContainer>
      <!-- 个人信息头部卡片 -->
      <div v-if="loginUser" class="fei-profile-header">
        <img
          class="fei-profile-avatar"
          :src="loginUser.userAvatar || defaultAvatar"
          :alt="loginUser.userName || '用户'"
        />
        <div class="fei-profile-info">
          <h1 class="fei-profile-name">{{ loginUser.userName || '未设置昵称' }}</h1>
          <p class="fei-profile-account">账号：{{ loginUser.userAccount }}</p>
          <div class="fei-profile-meta">
            <span class="fei-user-role-badge">
              {{ loginUser.userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
            <span>ID: {{ loginUser.id }}</span>
          </div>
        </div>
      </div>

      <!-- 侧边栏 + 内容区布局 -->
      <div class="fei-admin-layout">
        <!-- 桌面端侧边栏 -->
        <aside class="fei-admin-sidebar">
          <div class="fei-card">
            <nav class="fei-admin-sidebar-nav" style="padding: 8px">
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'records' }"
                href="#/profile/records"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                我的调用
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'keys' }"
                href="#/profile/keys"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                密钥管理
              </a>
            </nav>
          </div>
        </aside>

        <!-- 内容区 -->
        <div class="fei-admin-content">
          <!-- 移动端 Tab 导航 -->
          <div class="fei-admin-tabs">
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'records' }"
              @click="switchTab('records')"
            >
              我的调用
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'keys' }"
              @click="switchTab('keys')"
            >
              密钥管理
            </button>
          </div>

          <!-- 我的调用记录 -->
          <div v-if="activeTab === 'records'" class="fei-card">
            <div class="fei-card-header">
              <h2 class="fei-section-title">我的调用记录</h2>
            </div>
            <div class="fei-table-wrap" style="border: none; border-radius: 0">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>接口名称</th>
                    <th>总调用次数</th>
                    <th>剩余次数</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in records" :key="item.id">
                    <td>{{ item.interfaceName }}</td>
                    <td>{{ item.totalNum }}</td>
                    <td>{{ item.leftNum }}</td>
                    <td>
                      <span
                        class="fei-tag"
                        :class="item.status === 0 ? 'fei-tag--online' : 'fei-tag--offline'"
                      >
                        {{ item.status === 0 ? '正常' : '停用' }}
                      </span>
                    </td>
                    <td>
                      <div class="fei-table-actions">
                        <a :href="`#/interface/${item.interfaceInfoId}`">去调用</a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!records.length" class="fei-empty">暂无调用记录</div>
          </div>

          <!-- 密钥管理 -->
          <div v-else class="fei-card">
            <div class="fei-card-header">
              <h2 class="fei-section-title">访问密钥</h2>
            </div>
            <div v-if="loginUser" class="fei-card-body">
              <!-- 安全提示 -->
              <div class="fei-security-notice">
                <div class="fei-security-notice-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <div class="fei-security-notice-title">安全提示</div>
                  <p class="fei-security-notice-text">
                    请妥善保管您的 secretKey，不要泄露给他人或在客户端代码中硬编码。如怀疑泄露，请立即重置。
                  </p>
                </div>
              </div>

              <!-- Access Key -->
              <div class="fei-key-card">
                <span class="fei-key-label">Access Key</span>
                <span class="fei-key-value">{{ userKeys?.accessKey || keyPlaceholder }}</span>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.accessKey || '')">
                  复制
                </button>
              </div>

              <!-- Secret Key -->
              <div class="fei-key-card" style="margin-top: 12px">
                <span class="fei-key-label">Secret Key</span>
                <span class="fei-key-value">{{ showSecret ? (userKeys?.secretKey || keyPlaceholder) : maskedSecret }}</span>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="showSecret = !showSecret">
                  {{ showSecret ? '隐藏' : '显示' }}
                </button>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.secretKey || '')">
                  复制
                </button>
              </div>

              <!-- SDK 接入示例 -->
              <div class="fei-sdk-snippet">
                <div class="fei-sdk-snippet__header">
                  <h3 class="fei-sdk-snippet__title">Java SDK 快速接入</h3>
                  <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copySdkSnippet">
                    复制
                  </button>
                </div>
                <pre class="fei-code" style="margin: 0">{{ sdkSnippet }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { userService } from '@/services/user';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import type { UserInterfaceInfoVO, UserKeyVO, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();
const activeTab = computed(() => (route.params.tab === 'keys' ? 'keys' : 'records'));
const loginUser = ref<UserVO | null>(null);
const userKeys = ref<UserKeyVO | null>(null);
const records = ref<UserInterfaceInfoVO[]>([]);
const showSecret = ref(false);
const userKeysLoading = ref(false);
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=feiapi';
const keyPlaceholder = '密钥加载中';

const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  window.setTimeout(() => { toast.visible = false; }, 2400);
};

const maskedSecret = computed(() => {
  const secret = userKeys.value?.secretKey || '';
  if (!secret) return keyPlaceholder;
  return `${secret.slice(0, 8)}${'•'.repeat(Math.max(secret.length - 12, 4))}${secret.slice(-4)}`;
});

const sdkSnippet = `FeiApiClient client = new FeiApiClient(\n    "<your-access-key>",\n    "<your-secret-key>"\n);\nString result = client.invoke(\n    "/api/love/random", "GET", null\n);`;

const switchTab = (tab: string) => {
  router.push(`/profile/${tab}`);
};

const copyKey = async (text: string) => {
  if (!text) {
    showToast('密钥暂未加载完成', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板', 'success');
  } catch {
    showToast('复制失败，请手动复制', 'error');
  }
};

const copySdkSnippet = async () => {
  try {
    await navigator.clipboard.writeText(sdkSnippet);
    showToast('SDK 示例已复制到剪贴板', 'success');
  } catch {
    showToast('复制失败，请手动复制', 'error');
  }
};

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
    return Boolean(loginUser.value);
  } catch {
    loginUser.value = null;
    return false;
  }
};

const loadRecords = async () => {
  try {
    const res = await userInterfaceInfoService.myListPage({ current: 1, pageSize: 10 });
    records.value = res.data?.records ?? [];
  } catch {
    records.value = [];
  }
};

const loadUserKeys = async () => {
  if (!loginUser.value || userKeys.value || userKeysLoading.value) {
    return;
  }
  userKeysLoading.value = true;
  try {
    const res = await userService.getCurrentUserKeys();
    userKeys.value = res.data || null;
  } catch {
    userKeys.value = null;
    if (loginUser.value) {
      showToast('密钥加载失败，请稍后重试', 'error');
    }
  } finally {
    userKeysLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await userService.logout();
    loginUser.value = null;
    userKeys.value = null;
    records.value = [];
    await router.replace('/home');
  } catch {
    showToast('退出失败，请稍后重试', 'error');
  }
};

onMounted(async () => {
  const hasLoginUser = await loadLoginUser();
  if (!hasLoginUser) {
    await router.replace('/login');
    return;
  }
  await loadRecords();
  if (activeTab.value === 'keys') {
    await loadUserKeys();
  }
});

watch(activeTab, async (tab) => {
  if (tab !== 'keys') {
    return;
  }
  if (!loginUser.value) {
    await router.replace('/login');
    return;
  }
  await loadUserKeys();
});
</script>
