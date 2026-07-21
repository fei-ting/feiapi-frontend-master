<template>
  <img :src="resolvedAvatarUrl" :alt="alt" @error="handleAvatarError" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '@/utils/avatar';

/** 用户头像组件属性。 */
interface UserAvatarProps {
  /** 后端返回的头像地址。 */
  src?: string;
  /** 图片替代文本。 */
  alt: string;
}

const props = defineProps<UserAvatarProps>();

/** 经过来源校验的头像地址。 */
const resolvedAvatarUrl = computed(() => resolveAvatarUrl(props.src));

/**
 * 在头像加载失败时回退到本地默认头像。
 *
 * @param event 图片错误事件
 */
const handleAvatarError = (event: Event): void => {
  const image = event.currentTarget as HTMLImageElement;
  const defaultAvatarAbsoluteUrl = new URL(DEFAULT_AVATAR_URL, window.location.origin).href;
  if (image.src === defaultAvatarAbsoluteUrl) {
    return;
  }

  image.src = DEFAULT_AVATAR_URL;
};
</script>
