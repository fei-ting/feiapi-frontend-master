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
              <a
                class="fei-admin-nav-link"
                :class="{ 'is-active': activeTab === 'quotas' }"
                href="#/admin/quotas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path></svg>
                配额策略
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
            <button
              class="fei-admin-tab"
              :class="{ 'is-active': activeTab === 'quotas' }"
              @click="switchTab('quotas')"
            >
              配额策略
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
                <select v-model="interfaceQuotaType" class="fei-select">
                  <option value="">全部配额</option>
                  <option v-for="item in quotaTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
                <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadInterfaces">查询</button>
                <button class="fei-btn fei-btn--primary fei-btn--sm" @click="openAddModal">新增接口</button>
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
                    <th>配额类型</th>
                    <th>初始额度</th>
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
                      <span class="fei-tag" :class="quotaTagClass(item.quotaType)">
                        {{ quotaTypeText(item) }}
                      </span>
                    </td>
                    <td>
                      <span class="fei-quota-value">{{ initialQuotaText(item) }}</span>
                    </td>
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

          <!-- 配额策略 -->
          <div v-if="activeTab === 'quotas'" class="fei-card">
            <div class="fei-card-header">
              <div>
                <h2 class="fei-section-title">配额策略配置</h2>
                <p class="fei-section-desc" style="margin-top: 6px">
                  修改后仅对后续新注册用户和后续首次初始化额度的用户生效
                </p>
              </div>
              <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadQuotaConfigs">刷新</button>
            </div>
            <div class="fei-card-body">
              <div class="fei-quota-config-grid">
                <article v-for="item in quotaConfigs" :key="item.quotaType" class="fei-quota-config-card">
                  <div class="fei-quota-config-card__head">
                    <span class="fei-tag" :class="quotaTagClass(item.quotaType)">
                      {{ quotaConfigText(item) }}
                    </span>
                    <span class="fei-quota-config-card__time">{{ item.updateTime || '暂无更新时间' }}</span>
                  </div>
                  <p class="fei-section-desc">{{ item.description || quotaConfigText(item) }}</p>
                  <div class="fei-quota-edit-row">
                    <label class="fei-form-label">当前初始额度</label>
                    <template v-if="item.limited">
                      <input
                        v-model.number="quotaEditMap[item.quotaType]"
                        class="fei-input"
                        type="number"
                        min="1"
                        step="1"
                      />
                      <button
                        class="fei-btn fei-btn--primary fei-btn--sm"
                        :disabled="quotaSavingType === item.quotaType"
                        @click="submitQuotaConfig(item.quotaType)"
                      >
                        {{ quotaSavingType === item.quotaType ? '保存中...' : '保存' }}
                      </button>
                    </template>
                    <span v-else class="fei-quota-infinite">无限次</span>
                  </div>
                </article>
              </div>
              <div v-if="!quotaConfigs.length" class="fei-empty">暂无配额策略配置</div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
    <AppFooter />
    <ToastMessage :message="toast.message" :type="toast.type" :visible="toast.visible" />

    <!-- 新增/编辑接口弹窗 -->
    <Teleport to="body">
      <div v-if="editModalVisible" class="fei-modal-overlay" @click.self="closeEditModal">
        <div class="fei-modal">
          <div class="fei-modal-header">
            <h3>{{ modalMode === 'add' ? '新增接口' : '编辑接口' }}</h3>
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
                <label class="fei-form-label">配额类型 <span class="fei-required">*</span></label>
                <select v-model="editForm.quotaType" class="fei-select">
                  <option v-for="item in quotaTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="fei-form-row">
              <div class="fei-form-group">
                <label class="fei-form-label">网关匹配路径 <span class="fei-required">*</span></label>
                <input v-model="editForm.path" class="fei-input" placeholder="如：/api/xxx" maxlength="512" />
              </div>
              <div class="fei-form-group">
                <label class="fei-form-label">真实后端地址 <span class="fei-required">*</span></label>
                <input v-model="editForm.targetHost" class="fei-input" placeholder="如：http://localhost:8080" maxlength="512" />
              </div>
            </div>
            <div class="fei-form-group">
              <label class="fei-form-label">接口展示地址</label>
              <input v-model="editForm.url" class="fei-input" placeholder="不填时后端按真实后端地址和路径生成" maxlength="512" />
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
              {{ editSubmitting ? '保存中...' : (modalMode === 'add' ? '新增' : '保存') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import DashboardView from '@/views/admin/DashboardView.vue';
import AppFooter from '@/components/AppFooter.vue';
import PageContainer from '@/components/PageContainer.vue';
import ToastMessage from '@/components/ToastMessage.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { interfaceQuotaConfigService } from '@/services/interfaceQuotaConfig';
import { userService } from '@/services/user';
import type { InterfaceInfoVO, InterfaceQuotaConfigVO, InterfaceQuotaType, UserVO } from '@/types/api';

const route = useRoute();
const router = useRouter();

/** 有效的后台 Tab 列表 */
const VALID_TABS = ['dashboard', 'interfaces', 'quotas'] as const;

const quotaTypeOptions: { label: string; value: InterfaceQuotaType }[] = [
  { label: '免费无限接口', value: 'FREE_UNLIMITED' },
  { label: '基础额度接口', value: 'BASIC_QUOTA' },
  { label: '高级体验接口', value: 'ADVANCED_TRIAL' },
];

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
const quotaConfigs = ref<InterfaceQuotaConfigVO[]>([]);
const quotaEditMap = reactive<Record<string, number>>({});
const quotaSavingType = ref('');

/** 接口管理筛选 */
const interfaceSearch = ref('');
const interfaceStatus = ref<string | number>('');
const interfaceQuotaType = ref('');

const toast = reactive({
  visible: false,
  type: 'info' as 'success' | 'error' | 'info',
  message: '',
});

/** 编辑弹窗相关状态 */
const editModalVisible = ref(false);
const editSubmitting = ref(false);
const modalMode = ref<'add' | 'edit'>('edit');
const editForm = reactive({
  id: 0,
  name: '',
  method: 'GET',
  quotaType: 'BASIC_QUOTA',
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

const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

const quotaTagClass = (quotaType?: string) => {
  if (quotaType === 'FREE_UNLIMITED') return 'fei-tag--quota-free';
  if (quotaType === 'ADVANCED_TRIAL') return 'fei-tag--quota-trial';
  return 'fei-tag--quota-basic';
};

const quotaTypeText = (item: InterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || quotaTypeOptions.find((option) => option.value === item.quotaType)?.label || '基础额度接口';
};

const quotaConfigText = (item: InterfaceQuotaConfigVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限接口';
  return item.quotaTypeText || quotaTypeOptions.find((option) => option.value === item.quotaType)?.label || item.quotaType;
};

const initialQuotaText = (item: InterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '无限次';
  if (item.quotaType === 'ADVANCED_TRIAL') return `${item.initialQuota ?? 0} 次体验`;
  return `${item.initialQuota ?? 0} 次`;
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
    if (interfaceQuotaType.value) params.quotaType = interfaceQuotaType.value;
    if (interfaceSearch.value) params.name = interfaceSearch.value;
    const res = await interfaceService.listPage(params);
    interfaces.value = res.data?.records ?? [];
  } catch {
    interfaces.value = [];
  }
};

const loadQuotaConfigs = async () => {
  try {
    const res = await interfaceQuotaConfigService.list();
    quotaConfigs.value = res.data ?? [];
    quotaConfigs.value.forEach((item) => {
      quotaEditMap[item.quotaType] = item.initialQuota;
    });
  } catch {
    quotaConfigs.value = [];
    showToast('配额策略加载失败', 'error');
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

const resetEditForm = () => {
  editForm.id = 0;
  editForm.name = '';
  editForm.method = 'GET';
  editForm.quotaType = 'BASIC_QUOTA';
  editForm.url = '';
  editForm.path = '';
  editForm.targetHost = '';
  editForm.description = '';
  editForm.requestParams = '';
  editForm.requestHeader = '';
  editForm.responseHeader = '';
};

const openAddModal = () => {
  modalMode.value = 'add';
  resetEditForm();
  editModalVisible.value = true;
};

/**
 * 打开编辑弹窗，填充表单数据
 * @param item 接口信息
 */
const openEditModal = (item: InterfaceInfoVO) => {
  modalMode.value = 'edit';
  editForm.id = item.id;
  editForm.name = item.name || '';
  editForm.method = item.method || 'GET';
  editForm.quotaType = item.quotaType || 'BASIC_QUOTA';
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
  if (!editForm.quotaType) {
    showToast('请选择配额类型', 'error');
    return;
  }
  if (!editForm.path.trim()) {
    showToast('请输入网关匹配路径', 'error');
    return;
  }
  if (!editForm.targetHost.trim()) {
    showToast('请输入真实后端地址', 'error');
    return;
  }

  editSubmitting.value = true;
  try {
    const payload = {
      name: editForm.name.trim(),
      method: editForm.method,
      quotaType: editForm.quotaType,
      url: editForm.url.trim() || undefined,
      path: editForm.path.trim(),
      targetHost: editForm.targetHost.trim(),
      description: editForm.description.trim() || undefined,
      requestParams: editForm.requestParams.trim() || undefined,
      requestHeader: editForm.requestHeader.trim() || undefined,
      responseHeader: editForm.responseHeader.trim() || undefined,
    };
    if (modalMode.value === 'add') {
      await interfaceService.add(payload);
    } else {
      await interfaceService.update({
        id: editForm.id,
        ...payload,
      });
    }
    showToast(modalMode.value === 'add' ? '接口已新增' : '接口信息已更新', 'success');
    closeEditModal();
    await loadInterfaces();
  } catch {
    showToast(modalMode.value === 'add' ? '新增失败' : '更新失败', 'error');
  } finally {
    editSubmitting.value = false;
  }
};

const submitQuotaConfig = async (quotaType: string) => {
  const initialQuota = Number(quotaEditMap[quotaType]);
  if (!Number.isInteger(initialQuota) || initialQuota <= 0) {
    showToast('初始额度必须是大于 0 的整数', 'error');
    return;
  }
  quotaSavingType.value = quotaType;
  try {
    await interfaceQuotaConfigService.update({ quotaType, initialQuota });
    showToast('配额策略已更新，仅对后续新注册用户和后续首次初始化额度的用户生效', 'success');
    await loadQuotaConfigs();
    await loadInterfaces();
  } catch {
    showToast('配额策略更新失败', 'error');
  } finally {
    quotaSavingType.value = '';
  }
};

const handleLogout = async () => {
  await userService.logout();
  loginUser.value = null;
};

onMounted(async () => {
  await loadLoginUser();
  await loadInterfaces();
  if (activeTab.value === 'quotas') {
    await loadQuotaConfigs();
  }
});

watch(activeTab, async (tab) => {
  if (tab === 'quotas' && !quotaConfigs.value.length) {
    await loadQuotaConfigs();
  }
  if (tab === 'interfaces' && !interfaces.value.length) {
    await loadInterfaces();
  }
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

.fei-quota-config-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.fei-quota-config-card {
  padding: 18px;
  border: 1px solid var(--fei-border);
  border-radius: 12px;
  background: var(--fei-surface-soft);
}

.fei-quota-config-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.fei-quota-config-card__time {
  color: var(--fei-text-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
}

.fei-quota-edit-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
  margin-top: 18px;
}

.fei-quota-edit-row .fei-form-label {
  grid-column: 1 / -1;
  margin-bottom: -2px;
}

.fei-quota-infinite {
  grid-column: 1 / -1;
  font-size: 24px;
  font-weight: 900;
  color: var(--fei-primary);
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

  .fei-quota-config-grid {
    grid-template-columns: 1fr;
  }

  .fei-form-row .fei-form-group {
    margin-bottom: 16px;
  }
}
</style>
