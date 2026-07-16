<template>
  <div class="fei-card fei-dashboard__section">
    <div class="fei-card-header">
      <h3 class="fei-section-title">🚀 快捷操作</h3>
    </div>
    <div class="fei-card-body">
      <div class="fei-quick-actions">
        <RouterLink class="fei-quick-action" to="/admin/interfaces">
          <div class="fei-quick-action__icon" style="background: #dbeafe; color: #2563eb">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
          <span>管理接口</span>
        </RouterLink>
        <RouterLink class="fei-quick-action" to="/market">
          <div class="fei-quick-action__icon" style="background: #dcfce7; color: #16a34a">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <span>查看接口广场</span>
        </RouterLink>
        <button class="fei-quick-action" type="button" @click="handleRefresh">
          <div class="fei-quick-action__icon" style="background: #fef3c7; color: #d97706">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </div>
          <span>刷新数据</span>
        </button>
        <RouterLink class="fei-quick-action" to="/home">
          <div class="fei-quick-action__icon" style="background: #e0e7ff; color: #4f46e5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <span>返回首页</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 快捷操作组件事件。 */
interface QuickActionsEmits {
  /** 请求父页面刷新 Dashboard 数据。 */
  (event: 'refresh'): void;
}

const emit = defineEmits<QuickActionsEmits>();

/** 通知父页面刷新 Dashboard 数据。 */
const handleRefresh = (): void => {
  emit('refresh');
};
</script>

<style scoped>
.fei-dashboard__section {
  overflow: hidden;
}

.fei-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.fei-quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: var(--fei-surface-soft);
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-md);
  text-decoration: none;
  color: var(--fei-text);
  transition: all 0.2s ease;
}

.fei-quick-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--fei-shadow);
  border-color: var(--fei-primary-light);
  color: var(--fei-primary);
}

.fei-quick-action__icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.fei-quick-action span {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .fei-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fei-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
