<template>
  <div class="fei-app-shell">
    <AppHeader :login-user="loginUser" active="admin" @logout="handleLogout" />
    <PageContainer>
      <div class="fei-admin-layout">
        <!-- 桌面端侧边栏 -->
        <aside class="fei-admin-sidebar">
          <div class="fei-card">
            <nav class="fei-admin-sidebar-nav" style="padding: 8px">
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'dashboard' }"
                href="#/admin/dashboard"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                工作台
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'interfaces' }"
                href="#/admin/interfaces"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                接口管理
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
              :class="{ 'is-active': activeTab === 'dashboard' }"
              @click="switchTab('dashboard')"
            >
              工作台
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'interfaces' }"
              @click="switchTab('interfaces')"
            >
              接口管理
            </button>
          </div>

          <!-- 工作台 -->
          <DashboardView v-if="activeTab === 'dashboard'" :user-name="loginUser?.userName ?? '管理员'" />

          <!-- 接口管理 -->
          <div v-if="activeTab === 'interfaces'" class="fei-card">
            <div class="fei-card-header">
              <h2 class="fei-section-title">接口列表</h2>
              <div class="fei-admin-filter-group">
                <input
                  v-model="interfaceSearch"
                  class="fei-input"
                  placeholder="搜索接口名称"
                  @keyup.enter="loadInterfaces"
                />
                <select v-model="interfaceStatus" class="fei-select">
                  <option value="">全部状态</option>
                  <option :value="1">已上线</option>
                  <option :value="2">发布验证中</option>
                  <option :value="0">已下线</option>
                </select>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadInterfaces">查询</button>
              </div>
            </div>
            <div class="fei-table-wrap" style="border: none; border-radius: 0">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>接口名称</th>
                    <th>请求方法</th>
                    <th>请求地址</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in interfaces" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.name }}</td>
                    <td>
                      <span class="fei-method" :class="item.method === 'GET' ? 'fei-method--get' : 'fei-method--post'">
                        {{ item.method }}
                      </span>
                    </td>
                    <td style="color: var(--fei-text-muted)">{{ item.url }}</td>
                    <td>
                      <span
                        class="fei-tag"
                        :class="{
                          'fei-tag--online': item.status === 1,
                          'fei-tag--publishing': item.status === 2,
                          'fei-tag--offline': item.status !== 1 && item.status !== 2,
                        }"
                      >
                        {{ statusText(item.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="fei-table-actions">
                        <a :href="`#/interface/${item.id}`">编辑</a>
                        <button v-if="item.status !== 1" @click="onlineInterface(item.id)">发布</button>
                        <button v-else @click="offlineInterface(item.id)">下线</button>
                        <button class="fei-action--danger" @click="deleteInterface(item.id)">删除</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!interfaces.length" class="fei-empty">暂无接口数据</div>
          </div>
        </div>
      </div>
    </PageContainer>
    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import DashboardView from '@/views/admin/DashboardView.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();

/** 有效的后台 Tab 列表 */
const VALID_TABS = ['dashboard', 'interfaces'] as const;

/**
 * 计算当前激活的 Tab
 * 如果 URL 中的 tab 参数无效，则重定向到 dashboard
 */
const activeTab = computed(() => {
  const tab = (route.params.tab as string) || 'interfaces';
  if (!VALID_TABS.includes(tab as (typeof VALID_TABS)[number])) {
    // 无效的 tab，重定向到 dashboard
    router.replace('/admin/dashboard');
    return 'dashboard';
  }
  return tab;
});
const loginUser = ref<UserVO | null>(null);
const interfaces = ref<InterfaceInfoVO[]>([]);

/** 接口管理筛选 */
const interfaceSearch = ref('');
const interfaceStatus = ref<string | number>('');

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

const statusText = (status?: number) => {
  if (status === 1) return '上线';
  if (status === 2) return '发布验证中';
  return '关闭';
};

const switchTab = (tab: string) => {
  router.push(`/admin/${tab}`);
};

const loadLoginUser = async () => {
  try {
    const res = await userService.getLoginUser();
    loginUser.value = res.data || null;
  } catch {
    loginUser.value = null;
  }
};

const loadInterfaces = async () => {
  try {
    const params: Record<string, unknown> = { current: 1, pageSize: 10 };
    if (interfaceStatus.value !== '') params.status = interfaceStatus.value;
    if (interfaceSearch.value) params.name = interfaceSearch.value;
    const res = await interfaceService.listPage(params);
    interfaces.value = res.data?.records ?? [];
  } catch {
    interfaces.value = [];
  }
};

const onlineInterface = async (id: number) => {
  try {
    await interfaceService.online({ id });
    showToast('接口已上线', 'success');
    await loadInterfaces();
  } catch {
    showToast('上线失败', 'error');
  }
};

const offlineInterface = async (id: number) => {
  try {
    await interfaceService.offline({ id });
    showToast('接口已下线', 'success');
    await loadInterfaces();
  } catch {
    showToast('下线失败', 'error');
  }
};

const deleteInterface = async (_id: number) => {
  showToast('删除功能暂未实现', 'info');
};

const handleLogout = async () => {
  await userService.logout();
  loginUser.value = null;
};

onMounted(async () => {
  await loadLoginUser();
  await loadInterfaces();
});
</script>
