<template>
  <section class="fei-quota-config">
    <header class="fei-quota-config__toolbar">
      <h2 class="fei-section-title">配额策略配置</h2>
      <button class="fei-btn fei-btn--secondary fei-btn--sm" @click="loadQuotaConfigs">
        <ReloadOutlined class="fei-button-icon" aria-hidden="true" />
        刷新
      </button>
    </header>

    <div v-if="quotaConfigs.length" class="fei-quota-config-grid">
      <article
        v-for="item in quotaConfigs"
        :key="item.quotaType"
        class="fei-quota-config-card"
        :class="{
          'fei-quota-config-card--free': item.quotaType === 'FREE_UNLIMITED',
          'fei-quota-config-card--basic': item.quotaType === 'BASIC_QUOTA',
          'fei-quota-config-card--trial': item.quotaType === 'ADVANCED_TRIAL',
        }"
      >
        <div class="fei-quota-config-card__head">
          <span class="fei-tag" :class="getQuotaTagClass(item.quotaType)">
            {{ getQuotaTypeText(item.quotaType) }}
          </span>
          <span class="fei-quota-config-card__time">{{ formatTime(item.updateTime) }}</span>
        </div>

        <div class="fei-quota-config-card__body">
          <span class="fei-quota-edit-label">当前初始额度</span>
          <div class="fei-quota-config-card__value-row">
            <strong class="fei-quota-edit-value">
              {{ item.limited ? item.initialQuota : '无限次' }}
            </strong>
            <span v-if="item.limited" class="fei-quota-config-card__unit">次</span>
          </div>

          <label
            v-if="item.limited"
            class="fei-quota-config-card__editor"
            :for="`quota-input-${item.quotaType}`"
          >
            <span>调整初始额度</span>
            <input
              :id="`quota-input-${item.quotaType}`"
              v-model.number="quotaEditMap[item.quotaType]"
              class="fei-input fei-input--compact"
              type="number"
              min="1"
              step="1"
              :aria-label="`${getQuotaTypeText(item.quotaType)}初始额度`"
            />
          </label>
        </div>

        <footer v-if="item.limited" class="fei-quota-config-card__actions">
          <button
            class="fei-btn fei-btn--primary fei-quota-config-card__save"
            :disabled="quotaSavingType === item.quotaType"
            @click="openQuotaConfirmModal(item.quotaType)"
          >
            {{ quotaSavingType === item.quotaType ? '保存中' : '保存' }}
          </button>
        </footer>
      </article>
    </div>

    <div v-else class="fei-empty fei-quota-config__empty">暂无配额策略数据</div>
  </section>

  <ConfirmDialog
    :open="pendingQuota !== null"
    title="确认修改配额策略"
    :message="quotaConfirmMessage"
    :primary-text="quotaSavingType ? '保存中...' : '确认保存'"
    cancel-text="取消"
    :confirm-disabled="quotaSavingType !== null"
    title-id="quota-confirm-dialog-title"
    @confirm="saveQuotaConfig"
    @cancel="closeQuotaConfirmModal"
  />
</template>

<script setup lang="ts">
import { ReloadOutlined } from '@ant-design/icons-vue';
import { computed, onMounted, ref } from 'vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { interfaceQuotaConfigService } from '@/services/interfaceQuotaConfig';
import { useFormat } from '@/composables/useFormat';
import { useQuota } from '@/composables/useQuota';
import type { InterfaceQuotaConfigVO, InterfaceQuotaType } from '@/types/quota';

/**
 * 配额策略配置页面组件
 * 展示和管理接口的配额策略
 */

const { formatTime } = useFormat();
const { getQuotaTagClass, getQuotaTypeText } = useQuota();

/** 配额策略列表 */
const quotaConfigs = ref<InterfaceQuotaConfigVO[]>([]);

/** 配额编辑映射 */
const quotaEditMap = ref<Record<string, number>>({});

/** 正在保存的配额类型 */
const quotaSavingType = ref<InterfaceQuotaType | null>(null);

/** 待确认的配额修改。 */
const pendingQuota = ref<{
  /** 配额类型。 */
  quotaType: InterfaceQuotaType;
  /** 新的初始额度。 */
  initialQuota: number;
} | null>(null);

/** 配额确认弹窗正文。 */
const quotaConfirmMessage = computed(() => {
  if (!pendingQuota.value) return '';
  const quotaTypeText = getQuotaTypeText(pendingQuota.value.quotaType);
  return `确定将${quotaTypeText}的初始额度修改为 ${pendingQuota.value.initialQuota} 吗？`;
});

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

/**
 * 加载配额策略列表
 */
const loadQuotaConfigs = async () => {
  try {
    const data = await interfaceQuotaConfigService.list();
    quotaConfigs.value = data ?? [];
    quotaConfigs.value.forEach((item) => {
      quotaEditMap.value[item.quotaType] = item.initialQuota;
    });
  } catch (error) {
    console.error('[QuotaConfigView] 加载配额策略失败:', error);
    quotaConfigs.value = [];
    showToast('配额策略加载失败', 'error');
  }
};

/**
 * 校验配额并打开确认弹窗，此操作不发送更新请求
 * @param quotaType 配额类型
 */
const openQuotaConfirmModal = (quotaType: InterfaceQuotaType) => {
  const initialQuota = Number(quotaEditMap.value[quotaType]);
  if (!Number.isInteger(initialQuota) || initialQuota <= 0) {
    showToast('初始额度必须是大于 0 的整数', 'error');
    return;
  }

  pendingQuota.value = { quotaType, initialQuota };
};

/** 关闭配额确认弹窗。 */
const closeQuotaConfirmModal = () => {
  if (quotaSavingType.value) return;
  pendingQuota.value = null;
};

/**
 * 确认并保存配额配置
 * 只有用户点击确认弹窗的主操作后才会发送更新请求
 */
const saveQuotaConfig = async () => {
  if (!pendingQuota.value || quotaSavingType.value) return;

  const updateRequest = { ...pendingQuota.value };
  quotaSavingType.value = updateRequest.quotaType;
  try {
    await interfaceQuotaConfigService.update(updateRequest);
    pendingQuota.value = null;
    showToast('配额策略已更新', 'success');
    await loadQuotaConfigs();
  } catch (error) {
    console.error('[QuotaConfigView] 更新配额策略失败:', error);
    showToast('配额策略更新失败', 'error');
  } finally {
    quotaSavingType.value = null;
  }
};

onMounted(async () => {
  await loadQuotaConfigs();
});
</script>
