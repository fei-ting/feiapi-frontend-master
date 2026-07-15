<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <h2 class="fei-section-title">配额策略配置</h2>
      <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadQuotaConfigs">
        <ReloadOutlined class="fei-button-icon" aria-hidden="true" />
        刷新
      </button>
    </div>
    <div class="fei-card-body">
      <div class="fei-quota-config-grid">
        <article v-for="item in quotaConfigs" :key="item.quotaType" class="fei-quota-config-card">
          <div class="fei-quota-config-card__head">
            <span class="fei-tag" :class="quotaTagClass(item.quotaType)">
              {{ quotaConfigText(item) }}
            </span>
            <span class="fei-quota-config-card__time">{{ formatTime(item.updateTime) }}</span>
          </div>
          <div class="fei-quota-config-card__spacer" aria-hidden="true"></div>
          <div class="fei-quota-edit-row-inline">
            <span class="fei-quota-edit-label">当前初始额度：</span>
            <template v-if="item.limited">
              <input
                v-model.number="quotaEditMap[item.quotaType]"
                class="fei-input fei-input--compact"
                type="number"
                min="1"
                step="1"
              />
              <button
                class="fei-btn fei-btn--primary fei-btn--sm"
                :disabled="quotaSavingType === item.quotaType"
                @click="openQuotaConfirmModal(item.quotaType)"
              >
                {{ quotaSavingType === item.quotaType ? '保存中' : '保存' }}
              </button>
            </template>
            <span v-else class="fei-quota-edit-value">无限次</span>
          </div>
        </article>
      </div>
      <div v-if="!quotaConfigs.length" class="fei-empty">暂无配额策略数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { interfaceQuotaConfigService } from '@/services/interfaceQuotaConfig';
import type { InterfaceQuotaConfigVO } from '@/types/api';

/**
 * 配额策略配置页面组件
 * 展示和管理接口的配额策略
 */

/** 配额策略列表 */
const quotaConfigs = ref<InterfaceQuotaConfigVO[]>([]);

/** 配额编辑映射 */
const quotaEditMap = ref<Record<string, number>>({});

/** 正在保存的配额类型 */
const quotaSavingType = ref<string | null>(null);

/**
 * 格式化时间显示
 * @param time 时间字符串
 * @returns 格式化后的时间
 */
const formatTime = (time?: string) => {
  if (!time) return '暂无更新时间';
  try {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('[QuotaConfigView] 格式化时间失败:', error);
    return time;
  }
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
 * 获取配额策略文本
 * @param item 配额策略信息
 * @returns 配额策略文本
 */
const quotaConfigText = (item: InterfaceQuotaConfigVO) => {
  if (item.quotaType === 'FREE_UNLIMITED') return '免费无限';
  if (item.quotaType === 'ADVANCED_TRIAL') return '高级体验';
  return '基础额度';
};

/**
 * 加载配额策略列表
 */
const loadQuotaConfigs = async () => {
  try {
    const res = await interfaceQuotaConfigService.list();
    quotaConfigs.value = res.data ?? [];
    quotaConfigs.value.forEach((item) => {
      quotaEditMap.value[item.quotaType] = item.initialQuota;
    });
  } catch (error) {
    console.error('[QuotaConfigView] 加载配额策略失败:', error);
    quotaConfigs.value = [];
    showToast('配额策略加载失败', 'error');
  }
};

/**
 * 打开配额确认弹窗（占位实现）
 * @param quotaType 配额类型
 */
const openQuotaConfirmModal = (quotaType: string) => {
  showToast(`保存配额策略: ${quotaType}`, 'info');
};

onMounted(async () => {
  await loadQuotaConfigs();
});
</script>
