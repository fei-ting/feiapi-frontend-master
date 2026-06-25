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
                        <button class="fei-action-btn" @click="openEditModal(item)">编辑</button>
                        <button v-if="item.status !== 1" class="fei-action-btn" @click="onlineInterface(item.id)">发布</button>
                        <button v-else class="fei-action-btn" @click="offlineInterface(item.id)">下线</button>
                        <button class="fei-action-btn fei-action-btn--danger" @click="deleteInterface(item.id)">删除</button>
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

    <!-- 编辑接口弹窗 -->
    <Teleport to="body">
      <div v-if="editModalVisible" class="fei-modal-overlay" @click.self="closeEditModal">
        <div class="fei-modal">
          <div class="fei-modal-header">
            <h3>编辑接口</h3>
            <button class="fei-modal-close" @click="closeEditModal">&times;</button>
          </div>
          <div class="fei-modal-body">
            <div class="fei-form-group">
              <label class="fei-form-label">接口名称 <span class="fei-required">*</span></label>
              <input v-model="editForm.name" class="fei-input" placeholder="请输入接口名称" maxlength="50" />
            </div>
            <div class="fei-form-row">
              <div class="fei-form-group">
                <label class="fei-form-label">请求方法 <span class="fei-required">*</span></label>
                <select v-model="editForm.method" class="fei-select">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div class="fei-form-group">
                <label class="fei-form-label">接口展示地址</label>
                <input v-model="editForm.url" class="fei-input" placeholder="展示给用户的地址" maxlength="512" />
              </div>
            </div>
            <div class="fei-form-row">
              <div class="fei-form-group">
                <label class="fei-form-label">网关匹配路径</label>
                <input v-model="editForm.path" class="fei-input" placeholder="如：/api/xxx" maxlength="512" />
              </div>
              <div class="fei-form-group">
                <label class="fei-form-label">真实后端地址</label>
                <input v-model="editForm.targetHost" class="fei-input" placeholder="如：http://localhost:8080" maxlength="512" />
              </div>
            </div>
            <div class="fei-form-group">
              <label class="fei-form-label">接口描述</label>
              <textarea v-model="editForm.description" class="fei-textarea" placeholder="请输入接口描述" rows="3" maxlength="512"></textarea>
            </div>
            <div class="fei-form-group">
              <label class="fei-form-label">请求参数文档</label>
              <textarea v-model="editForm.requestParams" class="fei-textarea" placeholder="请求参数说明" rows="3"></textarea>
            </div>
            <div class="fei-form-group">
              <label class="fei-form-label">请求头文档</label>
              <textarea v-model="editForm.requestHeader" class="fei-textarea" placeholder="请求头说明" rows="3"></textarea>
            </div>
            <div class="fei-form-group">
              <label class="fei-form-label">响应头文档</label>
              <textarea v-model="editForm.responseHeader" class="fei-textarea" placeholder="响应头说明" rows="3"></textarea>
            </div>
          </div>
          <div class="fei-modal-footer">
            <button class="fei-btn fei-btn--secondary" @click="closeEditModal">取消</button>
            <button class="fei-btn fei-btn--primary" :disabled="editSubmitting" @click="submitEdit">
              {{ editSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

/** 编辑弹窗相关状态 */
const editModalVisible = ref(false);
const editSubmitting = ref(false);
const editForm = reactive({
  id: 0,
  name: '',
  method: 'GET',
  url: '',
  path: '',
  targetHost: '',
  description: '',
  requestParams: '',
  requestHeader: '',
  responseHeader: '',
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

/**
 * 打开编辑弹窗，填充表单数据
 * @param item 接口信息
 */
const openEditModal = (item: InterfaceInfoVO) => {
  editForm.id = item.id;
  editForm.name = item.name || '';
  editForm.method = item.method || 'GET';
  editForm.url = item.url || '';
  editForm.path = item.path || '';
  editForm.targetHost = item.targetHost || '';
  editForm.description = item.description || '';
  editForm.requestParams = item.requestParams || '';
  editForm.requestHeader = item.requestHeader || '';
  editForm.responseHeader = item.responseHeader || '';
  editModalVisible.value = true;
};

/** 关闭编辑弹窗 */
const closeEditModal = () => {
  editModalVisible.value = false;
};

/**
 * 提交编辑表单
 * 校验必填字段后调用更新接口
 */
const submitEdit = async () => {
  // 校验必填字段
  if (!editForm.name.trim()) {
    showToast('请输入接口名称', 'error');
    return;
  }
  if (!editForm.method) {
    showToast('请选择请求方法', 'error');
    return;
  }

  editSubmitting.value = true;
  try {
    await interfaceService.update({
      id: editForm.id,
      name: editForm.name.trim(),
      method: editForm.method,
      url: editForm.url.trim() || undefined,
      path: editForm.path.trim() || undefined,
      targetHost: editForm.targetHost.trim() || undefined,
      description: editForm.description.trim() || undefined,
      requestParams: editForm.requestParams.trim() || undefined,
      requestHeader: editForm.requestHeader.trim() || undefined,
      responseHeader: editForm.responseHeader.trim() || undefined,
    });
    showToast('接口信息已更新', 'success');
    closeEditModal();
    await loadInterfaces();
  } catch {
    showToast('更新失败', 'error');
  } finally {
    editSubmitting.value = false;
  }
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

<style scoped>
/* 操作按钮样式 */
.fei-table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.fei-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--fei-primary);
  background: rgba(22, 93, 255, 0.08);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.fei-action-btn:hover {
  background: rgba(22, 93, 255, 0.15);
}

.fei-action-btn--danger {
  color: #e33e33;
  background: rgba(227, 62, 51, 0.08);
}

.fei-action-btn--danger:hover {
  background: rgba(227, 62, 51, 0.15);
}

/* 弹窗遮罩层 */
.fei-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 弹窗主体 */
.fei-modal {
  background: var(--fei-bg-primary, #fff);
  border-radius: 12px;
  width: 90%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.fei-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--fei-border-color, #eee);
}

.fei-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.fei-modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--fei-text-muted, #999);
  padding: 4px;
}

.fei-modal-close:hover {
  color: var(--fei-text-primary, #333);
}

.fei-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.fei-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--fei-border-color, #eee);
}

/* 表单样式 */
.fei-form-group {
  margin-bottom: 16px;
}

.fei-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.fei-form-row .fei-form-group {
  margin-bottom: 0;
}

.fei-form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--fei-text-primary, #333);
}

.fei-required {
  color: #e33e33;
  margin-left: 2px;
}

.fei-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--fei-border-color, #d9d9d9);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.fei-textarea:focus {
  outline: none;
  border-color: var(--fei-primary, #165dff);
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

/* 响应式适配 */
@media (max-width: 640px) {
  .fei-modal {
    width: 95%;
    max-height: 90vh;
  }

  .fei-form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .fei-form-row .fei-form-group {
    margin-bottom: 16px;
  }
}
</style>
