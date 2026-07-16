<template>
  <div class="fei-dashboard__overview">
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #dbeafe; color: #2563eb">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ overview?.totalInterfaces ?? '--' }}</div>
        <div class="fei-overview-card__label">接口总数</div>
      </div>
    </div>
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #dcfce7; color: #16a34a">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ overview?.onlineInterfaces ?? '--' }}</div>
        <div class="fei-overview-card__label">在线接口</div>
      </div>
    </div>
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #f3f4f6; color: #6b7280">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ overview?.offlineInterfaces ?? '--' }}</div>
        <div class="fei-overview-card__label">已下线接口</div>
      </div>
    </div>
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #e0e7ff; color: #4f46e5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ formatNumber(overview?.todayInvocations) }}</div>
        <div class="fei-overview-card__label">今日调用</div>
      </div>
    </div>
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #fef3c7; color: #d97706">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ overview?.todayErrors ?? '--' }}</div>
        <div class="fei-overview-card__label">今日错误</div>
      </div>
    </div>
    <div class="fei-overview-card">
      <div class="fei-overview-card__icon" style="background: #fee2e2; color: #dc2626">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <div class="fei-overview-card__content">
        <div class="fei-overview-card__value">{{ overview?.abnormalInterfaces ?? '--' }}</div>
        <div class="fei-overview-card__label">异常接口</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardOverview } from '@/types/dashboard';

/** 概览卡片组件属性。 */
interface OverviewCardsProps {
  /** Dashboard 概览数据，加载失败或尚未加载时为空。 */
  overview: DashboardOverview | null;
}

defineProps<OverviewCardsProps>();

/**
 * 格式化调用次数，缺失时显示占位符，超过一千时使用 k 缩写。
 *
 * @param value 调用次数
 * @returns 格式化后的展示文本
 */
const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '--';
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
};
</script>

<style scoped>
.fei-dashboard__overview {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.fei-overview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: var(--fei-surface);
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-md);
  box-shadow: var(--fei-shadow-soft);
}

.fei-overview-card__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.fei-overview-card__value {
  font-size: 26px;
  font-weight: 800;
  color: var(--fei-text);
  line-height: 1.2;
}

.fei-overview-card__label {
  font-size: 13px;
  color: var(--fei-text-muted);
  margin-top: 2px;
}

@media (max-width: 1100px) {
  .fei-dashboard__overview {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .fei-dashboard__overview {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
