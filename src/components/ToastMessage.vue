<template>
  <div class="fei-toast" :class="[`is-${type}`, { 'is-show': visible }]">
    <svg v-if="type === 'success'" class="fei-toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}>();
</script>

<style scoped>
.fei-toast {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fei-toast__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
