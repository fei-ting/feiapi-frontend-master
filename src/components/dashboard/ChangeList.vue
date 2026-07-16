<template>
  <div class="fei-card fei-dashboard__section">
    <div class="fei-card-header">
      <h3 class="fei-section-title">📝 最近变更</h3>
    </div>
    <div class="fei-card-body">
      <div v-if="changes.length" class="fei-change-list">
        <div
          v-for="item in changes"
          :key="item.id"
          class="fei-change-item"
          @click="selectInterface(item.id)"
        >
          <span class="fei-change-tag" :class="`fei-change-tag--${item.changeType}`">
            {{ changeTypeText(item.changeType) }}
          </span>
          <span class="fei-change-item__name">{{ item.name }}</span>
          <span class="fei-change-item__time">{{ item.time }}</span>
        </div>
      </div>
      <div v-else class="fei-empty" style="padding: 32px">暂无变更</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChangedInterface } from '@/types/dashboard';

/** 最近变更列表组件属性。 */
interface ChangeListProps {
  /** 最近发生变更的接口列表。 */
  changes: ChangedInterface[];
}

/** 最近变更列表组件事件。 */
interface ChangeListEmits {
  /** 选择接口并交由父页面跳转。 */
  (event: 'select-interface', id: number): void;
}

defineProps<ChangeListProps>();
const emit = defineEmits<ChangeListEmits>();

/**
 * 获取变更类型展示文本。
 *
 * @param type 变更类型
 * @returns 变更类型文本
 */
const changeTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    created: '新增',
    online: '上线',
    offline: '下线',
    updated: '修改',
  };
  return texts[type] ?? type;
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

.fei-change-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fei-change-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--fei-surface-soft);
  border-radius: var(--fei-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.fei-change-item:hover {
  background: var(--fei-primary-light);
}

.fei-change-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.fei-change-tag--created {
  background: #dbeafe;
  color: #2563eb;
}

.fei-change-tag--online {
  background: #dcfce7;
  color: #16a34a;
}

.fei-change-tag--offline {
  background: #f3f4f6;
  color: #6b7280;
}

.fei-change-tag--updated {
  background: #fef3c7;
  color: #d97706;
}

.fei-change-item__name {
  flex: 1;
  font-size: 14px;
  color: var(--fei-text);
}

.fei-change-item__time {
  font-size: 12px;
  color: var(--fei-text-muted);
  flex-shrink: 0;
}
</style>
