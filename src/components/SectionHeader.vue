<template>
  <div>
    <h2 class="fei-section-title">{{ title }}</h2>
    <p v-if="desc" class="fei-section-desc">{{ desc }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  desc?: string;
}>();
</script>
