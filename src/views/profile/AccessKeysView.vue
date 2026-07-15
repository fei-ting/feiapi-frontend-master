<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <h2 class="fei-section-title">访问密钥</h2>
    </div>
    <div v-if="loginUser" class="fei-card-body">
      <!-- 安全提示 -->
      <div class="fei-security-notice">
        <div class="fei-security-notice-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <div>
          <div class="fei-security-notice-title">安全提示</div>
          <p class="fei-security-notice-text">
            请妥善保管您的 secretKey，不要泄露给他人或在客户端代码中硬编码。如怀疑泄露，请立即重置。
          </p>
        </div>
      </div>

      <!-- Access Key -->
      <div class="fei-key-card">
        <span class="fei-key-label">Access Key</span>
        <span class="fei-key-value">{{ userKeys?.accessKey || keyPlaceholder }}</span>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.accessKey || '')">
          复制
        </button>
      </div>

      <!-- Secret Key -->
      <div class="fei-key-card" style="margin-top: 12px">
        <span class="fei-key-label">Secret Key</span>
        <span class="fei-key-value">{{ showSecret ? (userKeys?.secretKey || keyPlaceholder) : maskedSecret }}</span>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="showSecret = !showSecret">
          {{ showSecret ? '隐藏' : '显示' }}
        </button>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copyKey(userKeys?.secretKey || '')">
          复制
        </button>
      </div>

      <!-- SDK 接入示例 -->
      <div class="fei-sdk-snippet">
        <div class="fei-sdk-snippet__header">
          <h3 class="fei-sdk-snippet__title">SDK 接入示例</h3>
          <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="copySdkSnippet">
            复制代码
          </button>
        </div>
        <pre class="fei-sdk-snippet__code"><code>{{ sdkSnippet }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { useClipboard } from '@/composables/useClipboard';
import type { UserVO, UserKeyVO } from '@/types/api';

/**
 * 密钥管理页面组件
 * 展示和管理用户的访问密钥
 */

const userStore = useUserStore();

/** 当前登录用户 */
const loginUser = ref<UserVO | null>(null);

/** 用户密钥信息 */
const userKeys = ref<UserKeyVO | null>(null);

/** 密钥加载状态 */
const userKeysLoading = ref(false);

/** 是否显示密钥明文 */
const showSecret = ref(false);

/** 密钥占位符 */
const keyPlaceholder = '********************';

/** 脱敏后的密钥 */
const maskedSecret = computed(() => {
  if (!userKeys.value?.secretKey) return keyPlaceholder;
  const key = userKeys.value.secretKey;
  if (key.length <= 8) return keyPlaceholder;
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
});

/** SDK 接入示例代码 */
const sdkSnippet = `FeiApiClient client = new FeiApiClient(
    "<your-access-key>",
    "<your-secret-key>"
);
String result = client.invoke(
    "/api/love/random", "GET", null
);`;

/**
 * 显示 Toast 通知（通过父组件）
 * @param message 通知消息
 * @param type 通知类型
 */
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  emit('show-toast', message, type);
};

/** 组件事件 */
const emit = defineEmits<{
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

/** 使用剪贴板组合式函数 */
const { copyToClipboard } = useClipboard(showToast);

/**
 * 复制密钥到剪贴板
 * @param text 要复制的文本
 */
const copyKey = async (text: string) => {
  if (!text) {
    showToast('密钥暂未加载完成', 'error');
    return;
  }
  await copyToClipboard(text);
};

/**
 * 复制 SDK 示例代码
 */
const copySdkSnippet = async () => {
  await copyToClipboard(sdkSnippet, 'SDK 示例已复制到剪贴板');
};

/**
 * 加载当前登录用户
 */
const loadLoginUser = async () => {
  try {
    loginUser.value = await userStore.fetchLoginUser();
  } catch {
    loginUser.value = null;
  }
};

/**
 * 加载用户密钥
 */
const loadUserKeys = async () => {
  if (!loginUser.value || userKeys.value || userKeysLoading.value) {
    return;
  }
  userKeysLoading.value = true;
  try {
    const data = await userService.getCurrentUserKeys();
    userKeys.value = data || null;
  } catch {
    userKeys.value = null;
    if (loginUser.value) {
      showToast('密钥加载失败，请稍后重试', 'error');
    }
  } finally {
    userKeysLoading.value = false;
  }
};

onMounted(async () => {
  await loadLoginUser();
  await loadUserKeys();
});
</script>
