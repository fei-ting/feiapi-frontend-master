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
                :class="{ 'is-active': activeTab === 'interfaces' }"
                href="#/admin/interfaces"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                接口管理
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'analysis' }"
                href="#/admin/analysis"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                运营分析
              </a>
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'relations' }"
                href="#/admin/relations"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                调用关系
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
              :class="{ 'is-active': activeTab === 'interfaces' }"
              @click="switchTab('interfaces')"
            >
              接口管理
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'analysis' }"
              @click="switchTab('analysis')"
            >
              运营分析
            </button>
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'relations' }"
              @click="switchTab('relations')"
            >
              调用关系
            </button>
          </div>

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

          <!-- 运营分析 -->
          <div v-else-if="activeTab === 'analysis'">
            <!-- 统计卡片 -->
            <div class="fei-analysis-grid">
              <div class="fei-stat-card">
                <div class="fei-stat-card-value">{{ topList.reduce((sum, i) => sum + (i.totalNum || 0), 0).toLocaleString() }}</div>
                <div class="fei-stat-card-label">总调用次数</div>
              </div>
              <div class="fei-stat-card">
                <div class="fei-stat-card-value">{{ interfaces.length }}</div>
                <div class="fei-stat-card-label">平台接口数</div>
              </div>
              <div class="fei-stat-card">
                <div class="fei-stat-card-value">{{ relations.length }}</div>
                <div class="fei-stat-card-label">调用关系数</div>
              </div>
              <div class="fei-stat-card">
                <div class="fei-stat-card-value">99.9%</div>
                <div class="fei-stat-card-label">服务可用性</div>
              </div>
            </div>

            <!-- TOP 接口 -->
            <div class="fei-card">
              <div class="fei-card-header">
                <h2 class="fei-section-title">调用次数 TOP 接口</h2>
              </div>
              <div class="fei-card-body">
                <div v-if="topList.length" class="fei-grid-3">
                  <div v-for="item in topList" :key="item.id" class="fei-feature">
                    <div class="fei-section-title" style="font-size: 18px">{{ item.name }}</div>
                    <p class="fei-section-desc">调用次数：{{ item.totalNum }}</p>
                  </div>
                </div>
                <div v-else class="fei-empty">暂无调用数据</div>
              </div>
            </div>
          </div>

          <!-- 调用关系 -->
          <div v-else class="fei-card">
            <div class="fei-card-header">
              <h2 class="fei-section-title">用户接口调用关系</h2>
              <div class="fei-admin-filter-group">
                <input
                  v-model="relationSearch"
                  class="fei-input"
                  placeholder="搜索用户/接口"
                  @keyup.enter="loadRelations"
                />
                <select v-model="relationStatus" class="fei-select">
                  <option value="">全部状态</option>
                  <option :value="0">正常</option>
                  <option :value="1">停用</option>
                </select>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadRelations">查询</button>
              </div>
            </div>
            <div class="fei-table-wrap" style="border: none; border-radius: 0">
              <table class="fei-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户</th>
                    <th>接口</th>
                    <th>总调用次数</th>
                    <th>剩余次数</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredRelations" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.userName }}</td>
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
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!filteredRelations.length" class="fei-empty">暂无调用关系数据</div>
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
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { analysisService } from '@/services/analysis';
import { interfaceService } from '@/services/interfaceInfo';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, UserInterfaceInfoVO, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();
const activeTab = computed(() => (route.params.tab as string) || 'interfaces');
const loginUser = ref<UserVO | null>(null);
const interfaces = ref<InterfaceInfoVO[]>([]);
const relations = ref<UserInterfaceInfoVO[]>([]);
const topList = ref<InterfaceInfoVO[]>([]);

/** 接口管理筛选 */
const interfaceSearch = ref('');
const interfaceStatus = ref<string | number>('');

/** 调用关系筛选 */
const relationSearch = ref('');
const relationStatus = ref<string | number>('');

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

/** 调用关系前端筛选 */
const filteredRelations = computed(() => {
  let list = relations.value;
  if (relationSearch.value) {
    const kw = relationSearch.value.toLowerCase();
    list = list.filter(
      (r) =>
        (r.userName || '').toLowerCase().includes(kw) ||
        (r.interfaceName || '').toLowerCase().includes(kw),
    );
  }
  if (relationStatus.value !== '') {
    list = list.filter((r) => r.status === Number(relationStatus.value));
  }
  return list;
});

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

const loadRelations = async () => {
  try {
    const res = await userInterfaceInfoService.adminListPage({ current: 1, pageSize: 50 });
    relations.value = res.data?.records ?? [];
  } catch {
    relations.value = [];
  }
};

const loadTop = async () => {
  try {
    const res = await analysisService.topInvoke();
    topList.value = res.data ?? [];
  } catch {
    topList.value = [];
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
  await loadRelations();
  await loadTop();
});
</script>
