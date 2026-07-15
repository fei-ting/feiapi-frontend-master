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
          <option v-for="item in quotaTypeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadInterfaces">查询</button>
        <button class="fei-btn fei-btn--primary fei-btn--sm" @click="openAddModal">新增接口</button>
      </div>
    </div>
    <div class="fei-table-wrap fei-table-wrap--borderless">
      <table class="fei-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>接口名称</th>
            <th>请求地址</th>
            <th>配额类型</th>
            <th>初始额度</th>
            <th>状态</th>
            <th>操作</th>
            <th>
              <button
                class="fei-sort-header"
                :class="{ 'is-active': totalNumSortOrder !== '' }"
                type="button"
                :aria-label="totalNumSortLabel"
                @click="toggleTotalNumSort"
              >
                <span>调用总数</span>
                <span class="fei-sort-indicator" aria-hidden="true">
                  <span class="fei-sort-caret fei-sort-caret--up" :class="{ 'is-active': totalNumSortOrder === 'ascend' }"></span>
                  <span class="fei-sort-caret fei-sort-caret--down" :class="{ 'is-active': totalNumSortOrder === 'descend' }"></span>
                </span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in interfaces" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td style="color: var(--fei-text-muted)">{{ item.url }}</td>
            <td>
              <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
                {{ getQuotaTypeText(item.quotaType, item.quotaTypeText) }}
              </span>
            </td>
            <td>
              <span class="fei-quota-value">{{ getInitialQuotaText(item.quotaType, item.initialQuota) }}</span>
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
                {{ getInterfaceStatusText(item.status) }}
              </span>
            </td>
            <td>
              <div class="fei-table-actions">
                <button class="fei-action-btn" @click="openEditModal(item)">编辑</button>
                <button v-if="item.status !== 1" class="fei-action-btn" @click="onlineInterface(item.id)">发布</button>
                <button v-else class="fei-action-btn" @click="offlineInterface(item.id)">下线</button>
                <button class="fei-action-btn fei-action-btn--danger" @click="openDeleteModal(item)">删除</button>
              </div>
            </td>
            <td>{{ item.totalNum ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!interfaces.length" class="fei-empty">暂无接口数据</div>
    <!-- 分页控件 -->
    <div v-if="interfaces.length" class="fei-pagination">
      <button
        class="fei-pagination__btn"
        :disabled="interfacePagination.current <= 1"
        @click="changePage(interfacePagination.current - 1)"
      >
        上一页
      </button>
      <span class="fei-pagination__info">
        第 {{ interfacePagination.current }} 页 / 共 {{ interfacePagination.totalPages }} 页
      </span>
      <button
        class="fei-pagination__btn"
        :disabled="interfacePagination.current >= interfacePagination.totalPages"
        @click="changePage(interfacePagination.current + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { interfaceService } from '@/services/interfaceInfo';
import { interfaceQuotaConfigService } from '@/services/interfaceQuotaConfig';
import { useQuota } from '@/composables/useQuota';
import { useFormat } from '@/composables/useFormat';
import type { InterfaceInfoVO, InterfaceQuotaType, InterfaceQuery } from '@/types/api';

/**
 * 接口管理页面组件
 * 提供接口的增删改查、上下线和分页功能
 */

const { isFreeUnlimited, getQuotaTagClass, getQuotaTypeText, getInitialQuotaText, getInterfaceStatusText } = useQuota();
const { formatTime } = useFormat();

/** 接口列表 */
const interfaces = ref<InterfaceInfoVO[]>([]);

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

/** 配额类型选项 */
const quotaTypeOptions: { label: string; value: InterfaceQuotaType }[] = [
  { value: 'BASIC_QUOTA', label: '基础额度' },
  { value: 'FREE_UNLIMITED', label: '免费无限' },
  { value: 'ADVANCED_TRIAL', label: '高级体验' },
];

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
    const res = await interfaceService.listPage(params);
    const pageData = res.data;
    interfaces.value = pageData?.records ?? [];
    interfacePagination.value.total = pageData?.total ?? 0;
    interfacePagination.value.totalPages = pageData?.total
      ? Math.ceil(pageData.total / interfacePagination.value.pageSize)
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
const onlineInterface = async (id: number) => {
  try {
    await interfaceService.online({ id });
    showToast('接口已上线', 'success');
    await loadInterfaces();
  } catch (error) {
    console.error('[InterfaceManagementView] 接口上线失败:', error);
    showToast('上线失败', 'error');
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
 * 打开新增接口弹窗（占位实现）
 */
const openAddModal = () => {
  showToast('新增接口功能待实现', 'info');
};

/**
 * 打开编辑接口弹窗（占位实现）
 * @param item 接口信息
 */
const openEditModal = (item: InterfaceInfoVO) => {
  showToast(`编辑接口: ${item.name}`, 'info');
};

/**
 * 打开删除确认弹窗（占位实现）
 * @param item 接口信息
 */
const openDeleteModal = (item: InterfaceInfoVO) => {
  showToast(`删除接口: ${item.name}`, 'info');
};

onMounted(async () => {
  await loadInterfaces();
});
</script>
