<template>
  <div class="fei-toast" :class="[`is-${type}`, { 'is-show': visible }]">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}>();
</script>
