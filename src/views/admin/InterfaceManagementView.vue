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
import InterfaceConfigModal from '@/features/interface-platform/definition/components/InterfaceConfigModal.vue';
import InterfacePublishCheckDialog from '@/features/interface-platform/publishing/components/InterfacePublishCheckDialog.vue';
import DataTable from '@/components/common/DataTable.vue';
import { interfaceService } from '@/services/interfaceInfo';
import { QUOTA_TYPE_OPTIONS, useQuota } from '@/composables/useQuota';
import { useInterfaceDefinition } from '@/features/interface-platform/definition/composables/useInterfaceDefinition';
import { useInterfaceLifecycle } from '@/features/interface-platform/lifecycle/composables/useInterfaceLifecycle';
import { useInterfacePublishing } from '@/features/interface-platform/publishing/composables/useInterfacePublishing';
import type { InterfaceInfoVO, InterfaceQuery } from '@/types/interface';
import type { InterfaceQuotaType } from '@/types/quota';
import type { DataTableColumn } from '@/types/table';

/**
 * 接口管理页面组件
 * 提供接口的增删改查、上下线和分页功能
 */

const { getQuotaTagClass, getQuotaTypeText, getInitialQuotaText, getInterfaceStatusText } = useQuota();

/** 组件事件 */
const emit = defineEmits<{
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

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

/**
 * 显示 Toast 通知（通过父组件）
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  emit('show-toast', message, type);
};

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

const {
  configModalOpen,
  editingInterface,
  openAddModal,
  openEditModal,
  closeConfigModal,
  handleConfigSaved,
  openDocumentPage,
} = useInterfaceDefinition({ loadInterfaces, showToast });

const {
  checkingIds,
  publishingIds,
  publishCheckDialogOpen,
  publishCheckResult,
  isRowBusy,
  onlineInterface,
  checkPublish,
} = useInterfacePublishing({ loadInterfaces, showToast });

const {
  offlineInterface,
  openDeleteModal,
} = useInterfaceLifecycle({ loadInterfaces, showToast });

onMounted(async () => {
  await loadInterfaces();
});
</script>
