<template>
  <nav class="fei-section-navigation" :aria-label="label">
    <RouterLink
      v-for="item in items"
      :key="item.key"
      class="fei-section-navigation__link"
      :class="{ 'is-active': activeKey === item.key }"
      :to="item.to"
      :aria-current="activeKey === item.key ? 'page' : undefined"
    >
      <component
        :is="item.icon"
        class="fei-section-navigation__icon"
        aria-hidden="true"
        focusable="false"
      />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { SectionNavigationItem } from '@/types/navigation';

/** 区域导航组件属性。 */
interface SectionNavigationProps {
  /** 导航区域的无障碍名称。 */
  label: string;
  /** 当前激活导航项的唯一标识。 */
  activeKey: string;
  /** 需要展示的导航项列表。 */
  items: readonly SectionNavigationItem[];
}

defineProps<SectionNavigationProps>();
</script>

<style scoped>
.fei-section-navigation {
  display: grid;
  grid-template-columns: repeat(3, minmax(112px, 1fr));
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid var(--fei-border);
}

.fei-section-navigation__link {
  display: inline-flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 8px;
  color: var(--fei-text-secondary);
  font-size: 13px;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.fei-section-navigation__link:hover,
.fei-section-navigation__link.is-active {
  color: var(--fei-primary);
  border-bottom-color: var(--fei-primary);
}

.fei-section-navigation__link:focus-visible {
  outline: none;
  box-shadow: var(--fei-focus-ring);
}

.fei-section-navigation__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

@media (min-width: 1024px) {
  .fei-section-navigation {
    display: flex;
    align-self: start;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    overflow: visible;
    background: var(--fei-surface);
    border: 1px solid var(--fei-border);
    border-radius: var(--fei-radius-lg);
    box-shadow: var(--fei-shadow-soft);
  }

  .fei-section-navigation__link {
    justify-content: flex-start;
    min-height: 44px;
    padding: 12px 16px;
    font-size: 14px;
    border-bottom: 0;
    border-radius: var(--fei-radius-md);
  }

  .fei-section-navigation__link:hover,
  .fei-section-navigation__link.is-active {
    background: var(--fei-primary-light);
  }
}
</style>
