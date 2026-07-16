<template>
  <div v-if="hasError" class="fei-error-boundary">
    <div class="fei-error-boundary__icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h2 class="fei-error-boundary__title">页面渲染出错</h2>
    <p class="fei-error-boundary__desc">
      {{ errorMessage || '页面遇到了意外错误，请尝试刷新页面。' }}
    </p>
    <div class="fei-error-boundary__actions">
      <button class="fei-btn fei-btn--primary" type="button" @click="handleReload">
        刷新页面
      </button>
      <button class="fei-btn fei-btn--secondary" type="button" @click="handleGoHome">
        返回首页
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';

/**
 * 错误边界组件
 * 捕获子组件的渲染错误，显示友好的错误提示。
 * 错误继续向上传播，由应用级错误处理器统一上报。
 */

const router = useRouter();

/** 是否有错误 */
const hasError = ref(false);

/** 错误消息 */
const errorMessage = ref('');

/**
 * 捕获子组件错误
 * 不返回 false，确保错误继续进入应用级错误处理器。
 */
onErrorCaptured((err: Error, instance, info) => {
  hasError.value = true;
  errorMessage.value = err.message || '页面遇到了意外错误';
});

/**
 * 刷新页面
 */
const handleReload = () => {
  window.location.reload();
};

/**
 * 返回首页
 */
const handleGoHome = () => {
  hasError.value = false;
  errorMessage.value = '';
  router.push('/home');
};
</script>

<style scoped>
.fei-error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
}

.fei-error-boundary__icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.fei-error-boundary__title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}

.fei-error-boundary__desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
  max-width: 400px;
}

.fei-error-boundary__actions {
  display: flex;
  gap: 12px;
}
</style>
