<template>
  <span class="fei-tag" :class="tagClass">
    <span v-if="dot" class="fei-tag-dot"></span>
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status?: number;
}>();

const tagClass = computed(() => {
  if (props.status === 1) return 'fei-tag--online';
  if (props.status === 2) return 'fei-tag--publishing';
  return 'fei-tag--offline';
});

const text = computed(() => {
  if (props.status === 1) return '上线';
  if (props.status === 2) return '发布验证中';
  return '关闭';
});

const dot = true;
</script>
