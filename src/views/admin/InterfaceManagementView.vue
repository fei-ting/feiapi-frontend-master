<template>
  <div class="fei-card">
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
          <option v-for="item in QUOTA_TYPE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadInterfaces">查询</button>
        <button class="fei-btn fei-btn--primary fei-btn--sm" @click="openAddModal">新增接口</button>
      </div>
    </div>
    <DataTable
      :columns="interfaceColumns"
      :rows="interfaces"
      row-key="id"
      :pagination="interfacePagination"
      empty-text="暂无接口数据"
      @page-change="changePage"
    >
      <template #header-totalNum>
        <button
          class="fei-sort-header"
          :class="{ 'is-active': totalNumSortOrder !== '' }"
          type="button"
          :aria-label="totalNumSortLabel"
          @click="toggleTotalNumSort"
        >
          <span>调用总数</span>
          <span class="fei-sort-indicator" aria-hidden="true">
            <span
              class="fei-sort-caret fei-sort-caret--up"
              :class="{ 'is-active': totalNumSortOrder === 'ascend' }"
            ></span>
            <span
              class="fei-sort-caret fei-sort-caret--down"
              :class="{ 'is-active': totalNumSortOrder === 'descend' }"
            ></span>
          </span>
        </button>
      </template>
      <template #cell-url="{ row: item }">
        <span class="fei-table-text-muted">{{ item.url || '-' }}</span>
      </template>
      <template #cell-name="{ row: item }">
        <span class="fei-interface-name-cell">
          <span>{{ item.name }}</span>
          <span v-if="item.docStatus === 'DRAFT'" class="fei-tag fei-tag--doc-draft">文档待完善</span>
        </span>
      </template>
      <template #cell-quotaType="{ row: item }">
        <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
          {{ getQuotaTypeText(item.quotaType, item.quotaTypeText) }}
        </span>
      </template>
      <template #cell-initialQuota="{ row: item }">
        <span class="fei-quota-value">{{ getInitialQuotaText(item.quotaType, item.initialQuota) }}</span>
      </template>
      <template #cell-status="{ row: item }">
        <span
          class="fei-tag"
          :class="{
            'fei-tag--online': item.status === 1,
            'fei-tag--publishing': item.status === 2,
            'fei-tag--offline': item.status !== 1 && item.status !== 2,
          }"
        >
          {{ getInterfaceStatusText(item.status) }}
        </span>
      </template>
      <template #cell-actions="{ row: item }">
        <div class="fei-table-actions">
          <button class="fei-action-btn" :disabled="item.status !== 0 || isRowBusy(item.id)" @click="openEditModal(item)">编辑</button>
          <button class="fei-action-btn" @click="openDocumentPage(item.id)">维护文档</button>
          <button
            v-if="item.status === 0"
            class="fei-action-btn"
            :disabled="isRowBusy(item.id)"
            @click="checkPublish(item.id)"
          >{{ checkingIds.has(item.id) ? '检查中' : '检查' }}</button>
          <button
            v-if="item.status === 0"
            class="fei-action-btn"
            :disabled="item.docStatus !== 'READY' || isRowBusy(item.id)"
            :title="item.docStatus === 'READY' ? '发布接口' : '请先完成文档维护'"
            @click="onlineInterface(item.id)"
          >{{ publishingIds.has(item.id) ? '发布中' : '发布' }}</button>
          <button v-else-if="item.status === 1" class="fei-action-btn" :disabled="isRowBusy(item.id)" @click="offlineInterface(item.id)">下线</button>
          <button v-else class="fei-action-btn" disabled>发布中</button>
          <button
            class="fei-action-btn fei-action-btn--danger"
            :disabled="item.status !== 0 || isRowBusy(item.id)"
            @click="openDeleteModal(item)"
          >删除</button>
        </div>
      </template>
      <template #cell-totalNum="{ row: item }">
        {{ item.totalNum ?? 0 }}
      </template>
    </DataTable>
  </div>

  <InterfaceConfigModal
    :open="configModalOpen"
    :interface-info="editingInterface"
    @close="closeConfigModal"
    @saved="handleConfigSaved"
  />
  <InterfacePublishCheckDialog
    :open="publishCheckDialogOpen"
    :result="publishCheckResult"
    @close="publishCheckDialogOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import InterfaceConfigModal from '@/components/admin/InterfaceConfigModal.vue';
import InterfacePublishCheckDialog from '@/components/admin/InterfacePublishCheckDialog.vue';
import DataTable from '@/components/common/DataTable.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { QUOTA_TYPE_OPTIONS, useQuota } from '@/composables/useQuota';
import type { InterfaceInfoVO, InterfaceQuery } from '@/types/interface';
import {
  PUBLISH_CHECK_FAILED_CODE,
  type InterfacePublishCheckVO,
  type InterfacePublishErrorData,
} from '@/types/interfacePublish';
import type { ApiError } from '@/types/common';
import type { InterfaceQuotaType } from '@/types/quota';
import type { DataTableColumn } from '@/types/table';

/**
 * 接口管理页面组件
 * 提供接口的增删改查、上下线和分页功能
 */

const router = useRouter();
const { getQuotaTagClass, getQuotaTypeText, getInitialQuotaText, getInterfaceStatusText } = useQuota();

/** 接口列表 */
const interfaces = ref<InterfaceInfoVO[]>([]);

/** 接口管理列表列配置。 */
const interfaceColumns: DataTableColumn[] = [
  { key: 'id', title: 'ID', minWidth: 50 },
  { key: 'name', title: '接口名称', minWidth: 90 },
  { key: 'url', title: '请求地址', minWidth: 210 },
  { key: 'quotaType', title: '配额类型', minWidth: 90 },
  { key: 'initialQuota', title: '初始额度', minWidth: 85 },
  { key: 'status', title: '状态', minWidth: 75 },
  { key: 'actions', title: '操作', minWidth: 190 },
  { key: 'totalNum', title: '调用总数', minWidth: 90 },
];

/** 接口搜索关键词 */
const interfaceSearch = ref('');

/** 接口状态筛选 */
const interfaceStatus = ref<number | ''>('');

/** 接口配额类型筛选 */
const interfaceQuotaType = ref<InterfaceQuotaType | ''>('');

/** 调用总数排序方向 */
const totalNumSortOrder = ref<'' | 'ascend' | 'descend'>('');

/** 是否显示接口配置弹窗 */
const configModalOpen = ref(false);

/** 当前编辑的接口；为空时表示新增 */
const editingInterface = ref<InterfaceInfoVO | null>(null);

/** 正在执行发布前检查的接口 ID 集合。 */
const checkingIds = ref<Set<number>>(new Set());

/** 正在执行正式发布的接口 ID 集合。 */
const publishingIds = ref<Set<number>>(new Set());

/** 发布检查结果弹窗是否打开。 */
const publishCheckDialogOpen = ref(false);

/** 当前发布检查结果。 */
const publishCheckResult = ref<InterfacePublishCheckVO | null>(null);

/** 接口分页配置 */
const interfacePagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
});

/**
 * 调用总数排序按钮的无障碍标签
 */
const totalNumSortLabel = computed(() => {
  if (totalNumSortOrder.value === 'descend') return '调用总数当前按降序排序，点击切换为升序';
  if (totalNumSortOrder.value === 'ascend') return '调用总数当前按升序排序，点击恢复默认排序';
  return '点击按调用总数降序排序';
});

/** 判断当前接口行是否正在执行发布相关操作。 */
const isRowBusy = (id: number) => checkingIds.value.has(id) || publishingIds.value.has(id);

/** 向集合中添加接口 ID。 */
const addBusyId = (target: typeof checkingIds, id: number) => {
  target.value = new Set([...target.value, id]);
};

/** 从集合中移除接口 ID。 */
const removeBusyId = (target: typeof checkingIds, id: number) => {
  const next = new Set(target.value);
  next.delete(id);
  target.value = next;
};

/**
 * 显示 Toast 通知（通过父组件）
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  emit('show-toast', message, type);
};

/** 组件事件 */
const emit = defineEmits<{
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

/**
 * 切换调用总数排序方向
 */
const toggleTotalNumSort = async () => {
  if (!totalNumSortOrder.value) {
    totalNumSortOrder.value = 'descend';
  } else if (totalNumSortOrder.value === 'descend') {
    totalNumSortOrder.value = 'ascend';
  } else {
    totalNumSortOrder.value = '';
  }
  interfacePagination.value.current = 1;
  await loadInterfaces();
};

/**
 * 切换分页
 * @param page 页码
 */
const changePage = async (page: number) => {
  if (page < 1 || page > interfacePagination.value.totalPages) {
    return;
  }
  interfacePagination.value.current = page;
  await loadInterfaces();
};

/**
 * 加载接口列表
 */
const loadInterfaces = async () => {
  try {
    const params: InterfaceQuery = {
      current: interfacePagination.value.current,
      pageSize: interfacePagination.value.pageSize,
    };
    if (interfaceStatus.value !== '') params.status = interfaceStatus.value;
    if (interfaceQuotaType.value) params.quotaType = interfaceQuotaType.value;
    if (interfaceSearch.value) params.name = interfaceSearch.value;
    if (totalNumSortOrder.value) {
      params.sortField = 'totalNum';
      params.sortOrder = totalNumSortOrder.value;
    }
    const data = await interfaceService.listPage(params);
    interfaces.value = data?.records ?? [];
    interfacePagination.value.total = data?.total ?? 0;
    interfacePagination.value.totalPages = data?.total
      ? Math.ceil(data.total / interfacePagination.value.pageSize)
      : 0;
  } catch (error) {
    console.error('[InterfaceManagementView] 加载接口列表失败:', error);
    interfaces.value = [];
    interfacePagination.value.total = 0;
    interfacePagination.value.totalPages = 0;
  }
};

/**
 * 接口上线
 * @param id 接口ID
 */
/** 判断错误是否为发布前静态检查失败。 */
const isPublishCheckError = (error: unknown): error is ApiError<InterfacePublishErrorData> =>
  error instanceof Error && (error as ApiError).code === PUBLISH_CHECK_FAILED_CODE;

/** 判断响应数据是否为发布检查结果。 */
const isPublishCheckResult = (data: unknown): data is InterfacePublishCheckVO =>
  typeof data === 'object'
  && data !== null
  && typeof (data as InterfacePublishCheckVO).passed === 'boolean'
  && Array.isArray((data as InterfacePublishCheckVO).issues);

/** 展示未通过的发布检查结果。 */
const openFailedPublishCheck = (result: InterfacePublishCheckVO): void => {
  if (result.passed) {
    return;
  }
  publishCheckResult.value = result;
  publishCheckDialogOpen.value = true;
};

const onlineInterface = async (id: number) => {
  addBusyId(publishingIds, id);
  try {
    await interfaceService.online({ id });
    showToast('接口已上线', 'success');
    await loadInterfaces();
  } catch (error) {
    console.error('[InterfaceManagementView] 接口上线失败:', error);
    if (isPublishCheckError(error)) {
      try {
        if (isPublishCheckResult(error.data)) {
          openFailedPublishCheck(error.data);
        } else {
          openFailedPublishCheck(await interfaceService.checkPublish(id));
        }
      } catch {
        // 正式发布失败后的补充检查失败时，保留原始发布错误提示。
      }
    }
    showToast(error instanceof Error ? error.message : '上线失败', 'error');
    await loadInterfaces();
  } finally {
    removeBusyId(publishingIds, id);
  }
};

/**
 * 执行发布前检查
 * @param id 接口 ID
 */
const checkPublish = async (id: number) => {
  addBusyId(checkingIds, id);
  try {
    publishCheckResult.value = await interfaceService.checkPublish(id);
    publishCheckDialogOpen.value = true;
    if (publishCheckResult.value.passed) {
      showToast('发布条件已通过', 'success');
    }
  } catch (error) {
    console.error('[InterfaceManagementView] 发布前检查失败:', error);
    showToast(error instanceof Error ? error.message : '检查失败', 'error');
  }
  finally {
    removeBusyId(checkingIds, id);
  }
};

/**
 * 接口下线
 * @param id 接口ID
 */
const offlineInterface = async (id: number) => {
  try {
    await interfaceService.offline({ id });
    showToast('接口已下线', 'success');
    await loadInterfaces();
  } catch (error) {
    console.error('[InterfaceManagementView] 接口下线失败:', error);
    showToast('下线失败', 'error');
  }
};

/**
 * 打开新增接口弹窗
 */
const openAddModal = () => {
  editingInterface.value = null;
  configModalOpen.value = true;
};

/**
 * 打开编辑接口弹窗
 * @param item 接口信息
 */
const openEditModal = (item: InterfaceInfoVO) => {
  if (item.status !== 0) {
    showToast('请先下线接口后再修改配置', 'info');
    return;
  }
  editingInterface.value = item;
  configModalOpen.value = true;
};

/**
 * 删除下线接口
 * @param item 接口信息
 */
const openDeleteModal = async (item: InterfaceInfoVO) => {
  if (item.status !== 0) {
    showToast('请先下线接口后再删除', 'info');
    return;
  }
  const method = item.method || '-';
  const path = item.path || '-';
  if (!window.confirm(`确定删除接口“${item.name}”吗？\n请求方法：${method}\n网关路径：${path}\n删除后不可恢复。`)) return;
  try {
    await interfaceService.delete({ id: item.id });
    showToast('接口已删除', 'success');
  } catch (error) {
    console.error('[InterfaceManagementView] 删除接口失败:', error);
    showToast(error instanceof Error ? error.message : '删除失败', 'error');
  } finally {
    await loadInterfaces();
  }
};

/** 关闭接口配置弹窗 */
const closeConfigModal = () => {
  configModalOpen.value = false;
  editingInterface.value = null;
};

/**
 * 处理接口配置保存结果
 * @param id 接口 ID
 * @param created 是否为新增接口
 */
const handleConfigSaved = async (id: number, created: boolean) => {
  closeConfigModal();
  if (created) {
    showToast('接口已创建，请继续维护文档', 'success');
    await router.push({ name: 'admin-interface-doc', params: { id } });
    return;
  }
  showToast('接口配置已保存', 'success');
  await loadInterfaces();
};

/**
 * 进入独立文档维护页
 * @param id 接口 ID
 */
const openDocumentPage = (id: number) => {
  void router.push({ name: 'admin-interface-doc', params: { id } });
};

onMounted(async () => {
  await loadInterfaces();
});
</script>
