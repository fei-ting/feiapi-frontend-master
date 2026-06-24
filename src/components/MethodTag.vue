<template>
  <span class="fei-method" :class="methodClass">{{ methodLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  method?: string;
}>();

const methodLabel = computed(() => (props.method || 'GET').toUpperCase());
const methodClass = computed(() => (methodLabel.value === 'GET' ? 'fei-method--get' : 'fei-method--post'));
</script>
