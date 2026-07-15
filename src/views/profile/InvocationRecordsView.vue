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
              <span class="fei-tag" :class="quotaTagClass(item.quotaType)">
                {{ quotaTypeText(item) }}
              </span>
            </td>
            <td>
              <span class="fei-quota-value">{{ quotaLeftText(item) }}</span>
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
                {{ interfaceStatusText(item.interfaceStatus) }}
              </span>
            </td>
            <td>
              <div class="fei-table-actions">
                <a
                  v-if="item.interfaceStatus === 1 && item.interfaceInfoId"
                  :href="`#/interface/${item.interfaceInfoId}`"
                >
                  去调用
                </a>
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
import type { UserInterfaceInfoVO } from '@/types/api';

/**
 * 调用记录页面组件
 * 展示用户的接口调用额度和记录
 */

/** 调用记录列表 */
const records = ref<UserInterfaceInfoVO[]>([]);

/**
 * 判断是否为免费无限配额
 * @param quotaType 配额类型
 * @returns 是否为免费无限
 */
const isFreeUnlimited = (quotaType?: string) => quotaType === 'FREE_UNLIMITED';

/**
 * 获取配额类型文本
 * @param item 用户接口信息
 * @returns 配额类型文本
 */
const quotaTypeText = (item: UserInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '免费无限';
  return item.quotaTypeText || '基础额度接口';
};

/**
 * 获取剩余额度文本
 * @param item 用户接口信息
 * @returns 剩余额度文本
 */
const quotaLeftText = (item: UserInterfaceInfoVO) => {
  if (isFreeUnlimited(item.quotaType)) return '无限次';
  if (item.quotaType === 'ADVANCED_TRIAL') return `${item.leftNum ?? 0} 次体验`;
  return `${item.leftNum ?? 0} 次`;
};

/**
 * 获取配额标签样式类
 * @param quotaType 配额类型
 * @returns 样式类名
 */
const quotaTagClass = (quotaType?: string) => {
  if (quotaType === 'FREE_UNLIMITED') return 'fei-tag--quota-free';
  if (quotaType === 'ADVANCED_TRIAL') return 'fei-tag--quota-trial';
  return 'fei-tag--quota-basic';
};

/**
 * 获取接口状态文本
 * @param status 接口状态
 * @returns 状态文本
 */
const interfaceStatusText = (status?: number) => {
  if (status === 1) return '可调用';
  if (status === 2) return '发布验证中';
  return '暂不可调用';
};

/**
 * 加载调用记录
 */
const loadRecords = async () => {
  try {
    const res = await userInterfaceInfoService.myListPage({ current: 1, pageSize: 10 });
    records.value = res.data?.records ?? [];
  } catch {
    records.value = [];
  }
};

onMounted(async () => {
  await loadRecords();
});
</script>
