<template>
  <div class="fei-card">
    <div class="fei-card-header">
      <h2 class="fei-section-title">访问密钥</h2>
    </div>
    <div v-if="userStore.loginUser" class="fei-card-body">
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
        <button class="fei-btn fei-btn--danger fei-btn--sm" @click="openResetDialog">
          重置
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

    <!-- 重置 secretKey 确认弹窗 -->
    <div
      v-if="resetDialogVisible"
      class="fei-reset-mask"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-secret-dialog-title"
      @keyup.esc="cancelReset"
    >
      <div class="fei-reset-dialog">
        <h2 id="reset-secret-dialog-title">重置 Secret Key</h2>
        <p class="fei-reset-dialog__warning">
          重置后旧密钥将立即失效，正在使用旧密钥的调用会验签失败。此操作不可撤销，请确认后继续。
        </p>
        <label class="fei-reset-dialog__label" for="reset-secret-password">当前密码</label>
        <input
          id="reset-secret-password"
          v-model="resetPassword"
          class="fei-reset-dialog__input"
          type="password"
          autocomplete="current-password"
          placeholder="请输入当前登录密码"
          :disabled="resetSubmitting"
          @keyup.enter="confirmReset"
        />
        <div class="fei-reset-dialog__footer">
          <button
            class="fei-btn fei-btn--danger"
            type="button"
            :disabled="resetSubmitting || !resetPassword.trim()"
            @click="confirmReset"
          >
            {{ resetSubmitting ? '重置中...' : '确认重置' }}
          </button>
          <button
            class="fei-btn fei-btn--secondary"
            type="button"
            :disabled="resetSubmitting"
            @click="cancelReset"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { userService } from '@/services/user';
import { useUserStore } from '@/stores/user';
import { useClipboard } from '@/composables/useClipboard';
import type { UserKeyVO } from '@/types/user';

/**
 * 密钥管理页面组件
 * 展示和管理用户的访问密钥
 */

const userStore = useUserStore();

/** 用户密钥信息 */
const userKeys = ref<UserKeyVO | null>(null);

/** 密钥加载状态 */
const userKeysLoading = ref(false);

/** 是否显示密钥明文 */
const showSecret = ref(false);

/** 重置弹窗是否可见 */
const resetDialogVisible = ref(false);

/** 重置弹窗中的密码输入 */
const resetPassword = ref('');

/** 重置请求提交中状态 */
const resetSubmitting = ref(false);

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
  await copyToClipboard(sdkSnippet);
};

/**
 * 加载用户密钥
 */
const loadUserKeys = async () => {
  if (!userStore.loginUser || userKeys.value || userKeysLoading.value) {
    return;
  }
  userKeysLoading.value = true;
  try {
    const data = await userService.getCurrentUserKeys();
    userKeys.value = data || null;
  } catch {
    userKeys.value = null;
    if (userStore.loginUser) {
      showToast('密钥加载失败，请稍后重试', 'error');
    }
  } finally {
    userKeysLoading.value = false;
  }
};

/** 打开重置弹窗 */
const openResetDialog = () => {
  resetPassword.value = '';
  resetDialogVisible.value = true;
};

/** 关闭重置弹窗 */
const cancelReset = () => {
  if (resetSubmitting.value) return;
  resetDialogVisible.value = false;
  resetPassword.value = '';
};

/** 确认重置 secretKey */
const confirmReset = async () => {
  const password = resetPassword.value.trim();
  if (!password || resetSubmitting.value) return;
  resetSubmitting.value = true;
  try {
    const data = await userService.resetCurrentUserSecretKey({ userPassword: password });
    userKeys.value = data || null;
    // 重置成功后直接展示新密钥，便于用户立即复制保存
    showSecret.value = true;
    resetDialogVisible.value = false;
    resetPassword.value = '';
    showToast('Secret Key 已重置，旧密钥已失效', 'success');
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '重置失败，请稍后重试';
    showToast(message, 'error');
  } finally {
    resetSubmitting.value = false;
  }
};

onMounted(async () => {
  await loadUserKeys();
});
</script>

<style scoped>
.fei-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.fei-btn--danger:hover:not(:disabled) {
  background: #fee2e2;
}

.fei-btn--danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fei-reset-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(3px);
}

.fei-reset-dialog {
  width: min(420px, 100%);
  padding: 24px;
  background: #fff;
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius-lg);
  box-shadow: var(--fei-shadow);
}

.fei-reset-dialog h2 {
  margin: 0;
  color: var(--fei-text);
  font-size: 20px;
  font-weight: 800;
}

.fei-reset-dialog__warning {
  margin: 12px 0 0;
  color: #b45309;
  line-height: 1.8;
}

.fei-reset-dialog__label {
  display: block;
  margin-top: 16px;
  color: var(--fei-text);
  font-weight: 600;
}

.fei-reset-dialog__input {
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--fei-border);
  border-radius: var(--fei-radius);
  font-size: 14px;
}

.fei-reset-dialog__input:focus {
  outline: none;
  border-color: var(--fei-primary);
}

.fei-reset-dialog__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
}
</style>
