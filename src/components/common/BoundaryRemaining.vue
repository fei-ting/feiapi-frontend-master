<template>
  <small
    class="fei-boundary-remaining"
    :class="{ 'fei-boundary-remaining--error': state.overLimit }"
    :data-over-limit="state.overLimit"
    aria-live="polite"
  >
    {{ state.overLimit ? `超过 ${Math.abs(state.remaining)} ${unit}` : `剩余 ${state.remaining} ${unit}` }}
  </small>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSizeRemaining } from '@/utils/textSize';

/** 边界剩余量组件属性。 */
interface BoundaryRemainingProps {
  /** 当前已使用数量。 */
  current: number;
  /** 最大允许数量。 */
  max: number;
  /** 计量单位。 */
  unit: '字符' | '字节' | '项';
}

const props = defineProps<BoundaryRemainingProps>();

/** 当前边界剩余量状态。 */
const state = computed(() => getSizeRemaining(props.current, props.max));
</script>

<style scoped>
.fei-boundary-remaining {
  display: block;
  margin-top: 5px;
  color: var(--fei-text-muted);
  font-size: 12px;
  line-height: 1.35;
}

.fei-boundary-remaining--error {
  color: var(--fei-error);
  font-weight: 700;
}
</style>

