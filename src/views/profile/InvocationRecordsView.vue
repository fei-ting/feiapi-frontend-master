<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <div>
        <h2 class="fei-section-title">我的额度/调用</h2>
        <p class="fei-section-desc" style="margin-top: 6px">按接口展示已获得额度、剩余额度和累计调用次数</p>
      </div>
    </div>
    <DataTable
      :columns="recordColumns"
      :rows="records"
      :row-key="getRecordKey"
      :pagination="recordPagination"
      empty-text="暂无可展示额度"
      @page-change="changePage"
    >
      <template #cell-interfaceName="{ row: item }">
        <div>
          <div class="fei-quota-name">{{ item.interfaceName || '未命名接口' }}</div>
          <MethodTag :method="item.method" />
        </div>
      </template>
      <template #cell-interfacePath="{ row: item }">
        <span class="fei-code-inline">{{ item.interfacePath || '-' }}</span>
      </template>
      <template #cell-quotaType="{ row: item }">
        <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
          {{ getQuotaTypeText(item.quotaType, item.quotaTypeText) }}
        </span>
      </template>
      <template #cell-leftNum="{ row: item }">
        <span class="fei-quota-value">{{ getQuotaLeftText(item.quotaType, item.leftNum) }}</span>
      </template>
      <template #cell-totalNum="{ row: item }">
        {{ item.totalNum ?? 0 }}
      </template>
      <template #cell-interfaceStatus="{ row: item }">
        <span
          class="fei-tag"
          :class="{
            'fei-tag--online': item.interfaceStatus === 1,
            'fei-tag--publishing': item.interfaceStatus === 2,
            'fei-tag--offline': item.interfaceStatus !== 1 && item.interfaceStatus !== 2,
          }"
        >
          {{ getUserInterfaceStatusText(item.interfaceStatus) }}
        </span>
      </template>
      <template #cell-actions="{ row: item }">
        <div class="fei-table-actions">
          <RouterLink
            v-if="item.interfaceStatus === 1 && item.interfaceInfoId"
            :to="`/interface/${item.interfaceInfoId}`"
          >
            去调用
          </RouterLink>
          <span v-else class="fei-muted-action">暂不可调用</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import DataTable from '@/components/common/DataTable.vue';
import MethodTag from '@/components/MethodTag.vue';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import { useQuota } from '@/composables/useQuota';
import type { UserInterfaceInfoVO } from '@/types/quota';
import type { DataTableColumn, DataTablePagination } from '@/types/table';

/**
 * 调用记录页面组件
 * 展示用户的接口调用额度和记录
 */

const { getQuotaTypeText, getQuotaLeftText, getQuotaTagClass, getUserInterfaceStatusText } = useQuota();

/** 调用记录列表 */
const records = ref<UserInterfaceInfoVO[]>([]);

/** 额度列表列配置。 */
const recordColumns: DataTableColumn[] = [
  { key: 'interfaceName', title: '接口名称', minWidth: 150 },
  { key: 'interfacePath', title: '接口路径', minWidth: 190 },
  { key: 'quotaType', title: '配额类型', minWidth: 120 },
  { key: 'leftNum', title: '剩余额度', minWidth: 110 },
  { key: 'totalNum', title: '总调用次数', minWidth: 120 },
  { key: 'interfaceStatus', title: '接口状态', minWidth: 110 },
  { key: 'actions', title: '操作', minWidth: 90 },
];

/** 额度列表分页配置。 */
const recordPagination = ref<DataTablePagination>({
  current: 1,
  pageSize: 10,
  total: 0,
});

/**
 * 获取额度记录唯一标识。
 * @param item 额度记录
 * @returns 额度记录唯一标识
 */
const getRecordKey = (item: UserInterfaceInfoVO): number => item.interfaceInfoId ?? item.id ?? 0;

/**
 * 加载调用记录
 */
const loadRecords = async () => {
  try {
    const data = await userInterfaceInfoService.myListPage({
      current: recordPagination.value.current,
      pageSize: recordPagination.value.pageSize,
    });
    records.value = data?.records ?? [];
    recordPagination.value.total = data?.total ?? 0;
    recordPagination.value.current = data?.current ?? recordPagination.value.current;
  } catch {
    records.value = [];
    recordPagination.value.total = 0;
  }
};

/**
 * 切换额度列表页码。
 * @param page 目标页码
 */
const changePage = async (page: number) => {
  recordPagination.value.current = page;
  await loadRecords();
};

onMounted(async () => {
  await loadRecords();
});
</script>
