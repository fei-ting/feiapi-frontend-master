<template>
  <div
    v-if="open"
    class="fei-modal-mask"
    role="presentation"
    @click.self="closeModal"
    @keyup.esc="closeModal"
  >
    <section class="fei-modal fei-interface-config-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <div class="fei-modal__header">
        <div>
          <p class="fei-modal__eyebrow">运行时配置</p>
          <h2 :id="titleId" class="fei-modal__title">{{ isEdit ? '编辑接口' : '新增接口' }}</h2>
        </div>
        <button class="fei-icon-btn" type="button" aria-label="关闭" title="关闭" @click="closeModal">×</button>
      </div>

      <form class="fei-form" @submit.prevent="submitForm">
        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field">
            <span class="fei-label">接口名称</span>
            <input v-model.trim="form.name" class="fei-input" maxlength="50" required />
          </label>
          <label class="fei-field">
            <span class="fei-label">SDK 方法名</span>
            <input v-model.trim="form.sdkMethodName" class="fei-input" maxlength="128" required />
          </label>
          <label class="fei-field">
            <span class="fei-label">请求方法</span>
            <select v-model="form.method" class="fei-select" required>
              <option v-for="method in requestMethods" :key="method" :value="method">{{ method }}</option>
            </select>
          </label>
          <label class="fei-field">
            <span class="fei-label">配额类型</span>
            <select v-model="form.quotaType" class="fei-select" required>
              <option v-for="option in QUOTA_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <label class="fei-field">
          <span class="fei-label">接口描述</span>
          <textarea v-model.trim="form.description" class="fei-textarea fei-textarea--compact" maxlength="512"></textarea>
        </label>

        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field">
            <span class="fei-label">网关路径</span>
            <input v-model.trim="form.path" class="fei-input" maxlength="512" placeholder="/api/example" required />
          </label>
          <label class="fei-field">
            <span class="fei-label">真实后端地址</span>
            <input v-model.trim="form.targetHost" class="fei-input" maxlength="512" placeholder="http://service:8080" required />
          </label>
        </div>

        <label class="fei-field">
          <span class="fei-label">展示地址</span>
          <input v-model.trim="form.url" class="fei-input" maxlength="512" placeholder="留空时由后端根据地址和路径生成" />
        </label>

        <label class="fei-field">
          <span class="fei-label">运行时请求参数模板</span>
          <textarea
            v-model="form.requestParams"
            class="fei-textarea fei-code-input"
            spellcheck="false"
            placeholder='{"name":"string"}'
          ></textarea>
        </label>

        <p v-if="errorMessage" class="fei-form-error" role="alert">{{ errorMessage }}</p>
        <div class="fei-modal__footer">
          <button class="fei-btn fei-btn--secondary" type="button" :disabled="submitting" @click="closeModal">取消</button>
          <button class="fei-btn fei-btn--primary" type="submit" :disabled="submitting">
            {{ submitting ? '保存中...' : isEdit ? '保存配置' : '创建并维护文档' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { QUOTA_TYPE_OPTIONS } from '@/composables/useQuota';
import { interfaceService } from '@/services/interfaceInfo';
import type { InterfaceInfoAddRequest, InterfaceInfoUpdateRequest, InterfaceInfoVO } from '@/types/interface';
import type { InterfaceQuotaType } from '@/types/quota';

/** 组件属性。 */
interface Props {
  /** 是否显示弹窗。 */
  open: boolean;
  /** 当前编辑的接口；为空时表示新增。 */
  interfaceInfo?: InterfaceInfoVO | null;
}

/** 接口配置表单。 */
interface InterfaceConfigForm {
  /** 接口名称。 */
  name: string;
  /** 接口描述。 */
  description: string;
  /** 展示地址。 */
  url: string;
  /** 网关路径。 */
  path: string;
  /** 真实后端地址。 */
  targetHost: string;
  /** 运行时请求参数模板。 */
  requestParams: string;
  /** 请求方法。 */
  method: string;
  /** 配额类型。 */
  quotaType: InterfaceQuotaType;
  /** SDK 方法名。 */
  sdkMethodName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  /** 关闭弹窗。 */
  (event: 'close'): void;
  /** 保存完成。 */
  (event: 'saved', id: number, created: boolean): void;
}>();

/** 请求方法选项。 */
const requestMethods = ['GET', 'POST', 'PUT', 'DELETE'];

/** 默认配置表单。 */
const createDefaultForm = (): InterfaceConfigForm => ({
  name: '',
  description: '',
  url: '',
  path: '',
  targetHost: '',
  requestParams: '{}',
  method: 'POST',
  quotaType: 'BASIC_QUOTA',
  sdkMethodName: '',
});

const form = reactive<InterfaceConfigForm>(createDefaultForm());
const submitting = ref(false);
const errorMessage = ref('');
const isEdit = computed(() => Boolean(props.interfaceInfo?.id));
const titleId = computed(() => `interface-config-title-${props.interfaceInfo?.id ?? 'new'}`);

/** 根据当前接口重置表单。 */
const resetForm = () => {
  const current = props.interfaceInfo;
  Object.assign(form, current ? {
    name: current.name ?? '',
    description: current.description ?? '',
    url: current.url ?? '',
    path: current.path ?? '',
    targetHost: current.targetHost ?? '',
    requestParams: current.requestParams ?? '{}',
    method: current.method ?? 'POST',
    quotaType: current.quotaType ?? 'BASIC_QUOTA',
    sdkMethodName: current.sdkMethodName ?? '',
  } : createDefaultForm());
  errorMessage.value = '';
};

/** 关闭弹窗。 */
const closeModal = () => {
  if (!submitting.value) emit('close');
};

/** 提交接口运行时配置。 */
const submitForm = async () => {
  submitting.value = true;
  errorMessage.value = '';
  try {
    const payload: InterfaceInfoAddRequest = {
      name: form.name,
      description: form.description,
      url: form.url || undefined,
      path: form.path,
      targetHost: form.targetHost,
      requestParams: form.requestParams,
      method: form.method,
      quotaType: form.quotaType,
      sdkMethodName: form.sdkMethodName,
    };
    if (props.interfaceInfo?.id) {
      await interfaceService.update({ ...payload, id: props.interfaceInfo.id } as InterfaceInfoUpdateRequest);
      emit('saved', props.interfaceInfo.id, false);
      return;
    }
    const id = await interfaceService.add(payload);
    emit('saved', id, true);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '接口配置保存失败';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.open, (open) => {
  if (open) resetForm();
});
</script>
