<template>
  <div class="fei-page">
    <div class="fei-container" :class="{ 'fei-container--wide': wide }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 页面容器组件属性。 */
interface PageContainerProps {
  /** 是否启用适合后台和个人中心的宽工作区。 */
  wide?: boolean;
}

withDefaults(defineProps<PageContainerProps>(), {
  wide: false,
});
</script>
