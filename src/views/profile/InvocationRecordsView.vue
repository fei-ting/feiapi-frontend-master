<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <div>
        <h2 class="fei-section-title">我的额度/调用</h2>
        <p class="fei-section-desc" style="margin-top: 6px">按接口展示已获得额度、剩余额度和累计调用次数</p>
      </div>
    </div>
    <div class="fei-table-wrap" style="border: none; border-radius: 0">
      <table class="fei-table">
        <thead>
          <tr>
            <th>接口名称</th>
            <th>接口路径</th>
            <th>配额类型</th>
            <th>剩余额度</th>
            <th>总调用次数</th>
            <th>接口状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in records" :key="item.interfaceInfoId || item.id">
            <td>
              <div class="fei-quota-name">{{ item.interfaceName || '未命名接口' }}</div>
              <MethodTag :method="item.method" />
            </td>
            <td>
              <span class="fei-code-inline">{{ item.interfacePath || '-' }}</span>
            </td>
            <td>
              <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
                {{ getQuotaTypeText(item.quotaType, item.quotaTypeText) }}
              </span>
            </td>
            <td>
              <span class="fei-quota-value">{{ getQuotaLeftText(item.quotaType, item.leftNum) }}</span>
            </td>
            <td>{{ item.totalNum ?? 0 }}</td>
            <td>
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
            </td>
            <td>
              <div class="fei-table-actions">
                <RouterLink
                  v-if="item.interfaceStatus === 1 && item.interfaceInfoId"
                  :to="`/interface/${item.interfaceInfoId}`"
                >
                  去调用
                </RouterLink>
                <span v-else class="fei-muted-action">暂不可调用</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!records.length" class="fei-empty">暂无可展示额度</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MethodTag from '@/components/MethodTag.vue';
import { userInterfaceInfoService } from '@/services/userInterfaceInfo';
import { useQuota } from '@/composables/useQuota';
import type { UserInterfaceInfoVO } from '@/types/api';

/**
 * 调用记录页面组件
 * 展示用户的接口调用额度和记录
 */

const { isFreeUnlimited, getQuotaTypeText, getQuotaLeftText, getQuotaTagClass, getUserInterfaceStatusText } = useQuota();

/** 调用记录列表 */
const records = ref<UserInterfaceInfoVO[]>([]);

/**
 * 加载调用记录
 */
const loadRecords = async () => {
  try {
    const data = await userInterfaceInfoService.myListPage({ current: 1, pageSize: 10 });
    records.value = data?.records ?? [];
  } catch {
    records.value = [];
  }
};

onMounted(async () => {
  await loadRecords();
});
</script>
