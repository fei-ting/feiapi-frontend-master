<template>
  <div class="fei-card fei-dashboard__section">
    <div class="fei-card-header">
      <h3 class="fei-section-title">⚠️ 重点关注</h3>
    </div>
    <div class="fei-card-body">
      <div v-if="alerts.length" class="fei-alert-list">
        <div
          v-for="item in alerts"
          :key="item.id"
          class="fei-alert-item"
          @click="selectInterface(item.id)"
        >
          <div class="fei-alert-item__icon" :class="`fei-alert-item__icon--${item.alertType}`">
            {{ alertIcon(item.alertType) }}
          </div>
          <div class="fei-alert-item__content">
            <div class="fei-alert-item__name">{{ item.name }}</div>
            <div class="fei-alert-item__desc">{{ item.description }}</div>
          </div>
          <div class="fei-alert-item__time">{{ item.time }}</div>
        </div>
      </div>
      <div v-else class="fei-empty" style="padding: 32px">暂无告警</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertInterface } from '@/types/dashboard';

/** 告警列表组件属性。 */
interface AlertListProps {
  /** 需要重点关注的接口列表。 */
  alerts: AlertInterface[];
}

/** 告警列表组件事件。 */
interface AlertListEmits {
  /** 选择接口并交由父页面跳转。 */
  (event: 'select-interface', id: number): void;
}

defineProps<AlertListProps>();
const emit = defineEmits<AlertListEmits>();

/**
 * 获取告警类型对应图标。
 *
 * @param type 告警类型
 * @returns 告警图标文本
 */
const alertIcon = (type: string): string => {
  const icons: Record<string, string> = {
    abnormal: '🔴',
    spike: '📈',
    highFailureRate: '⚠️',
    modified: '✏️',
    unused: '💤',
  };
  return icons[type] ?? '❓';
};

/**
 * 通知父页面选择接口。
 *
 * @param id 接口 ID
 */
const selectInterface = (id: number): void => {
  emit('select-interface', id);
};
</script>

<style scoped>
.fei-dashboard__section {
  overflow: hidden;
}

.fei-alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fei-alert-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--fei-surface-soft);
  border-radius: var(--fei-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.fei-alert-item:hover {
  background: var(--fei-primary-light);
}

.fei-alert-item__icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 18px;
  flex-shrink: 0;
}

.fei-alert-item__icon--abnormal {
  background: #fee2e2;
}

.fei-alert-item__icon--spike {
  background: #dbeafe;
}

.fei-alert-item__icon--highFailureRate {
  background: #fef3c7;
}

.fei-alert-item__icon--modified {
  background: #e0e7ff;
}

.fei-alert-item__icon--unused {
  background: #f3f4f6;
}

.fei-alert-item__content {
  flex: 1;
  min-width: 0;
}

.fei-alert-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--fei-text);
}

.fei-alert-item__desc {
  font-size: 12px;
  color: var(--fei-text-muted);
  margin-top: 2px;
}

.fei-alert-item__time {
  font-size: 12px;
  color: var(--fei-text-muted);
  flex-shrink: 0;
}
</style>
