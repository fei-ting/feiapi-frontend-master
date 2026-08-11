<template>
  <div
    v-if="open"
    class="fei-modal-mask"
    role="presentation"
    @keyup.esc="requestClose"
  >
    <section
      class="fei-modal fei-interface-config-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-hidden="discardConfirmOpen ? 'true' : undefined"
      :inert="discardConfirmOpen || undefined"
    >
      <div class="fei-modal__header">
        <div>
          <p class="fei-modal__eyebrow">运行时配置</p>
          <h2 :id="titleId" class="fei-modal__title">{{ isEdit ? '编辑接口' : '新增接口' }}</h2>
        </div>
        <button
          class="fei-icon-btn fei-interface-config-modal__close"
          type="button"
          aria-label="关闭"
          title="关闭"
          :disabled="submitting"
          @click="requestClose"
        >
          <CloseOutlined aria-hidden="true" />
        </button>
      </div>

      <form class="fei-form" @submit.prevent="submitForm">
        <div class="fei-interface-config-modal__body">
          <div class="fei-form-grid fei-form-grid--two">
            <label class="fei-field">
              <span class="fei-label">接口名称 <span class="fei-required-mark" aria-hidden="true">*</span></span>
              <input v-model.trim="form.name" class="fei-input" maxlength="50" required />
            </label>
            <label class="fei-field">
              <span class="fei-label">SDK 方法名 <span class="fei-required-mark" aria-hidden="true">*</span></span>
              <select
                v-if="!isEdit"
                v-model="form.sdkMethodName"
                class="fei-select"
                required
                :disabled="sdkMethodsLoading || sdkMethodsLoadFailed"
              >
                <option value="" disabled>
                  {{ sdkMethodsLoading ? '正在加载 SDK 方法...' : '请选择 SDK 方法' }}
                </option>
                <option
                  v-for="option in sdkMethodOptions"
                  :key="option.sdkMethodName"
                  :value="option.sdkMethodName"
                >
                  {{ option.sdkMethodName }}（{{ option.needParams ? '需要请求参数' : '无请求参数' }}）
                </option>
              </select>
              <input v-else v-model.trim="form.sdkMethodName" class="fei-input" maxlength="128" required />
            </label>
            <label class="fei-field">
              <span class="fei-label">请求方法 <span class="fei-required-mark" aria-hidden="true">*</span></span>
              <select v-model="form.method" class="fei-select" required>
                <option v-for="method in requestMethods" :key="method" :value="method">{{ method }}</option>
              </select>
            </label>
            <label class="fei-field">
              <span class="fei-label">配额类型 <span class="fei-required-mark" aria-hidden="true">*</span></span>
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
              <span class="fei-label">网关路径 <span class="fei-required-mark" aria-hidden="true">*</span></span>
              <input v-model.trim="form.path" class="fei-input" maxlength="512" placeholder="/api/example" required />
            </label>
            <label class="fei-field">
              <span class="fei-label">真实后端地址 <span class="fei-required-mark" aria-hidden="true">*</span></span>
              <input v-model.trim="form.targetHost" class="fei-input" maxlength="512" placeholder="http://service:8080" required />
            </label>
          </div>

          <label class="fei-field">
            <span class="fei-label">
              展示地址
              <span class="fei-interface-config-modal__optional">可选</span>
            </span>
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
            <span class="fei-interface-config-modal__remaining">
              <BoundaryRemaining :current="runtimeTemplateBytes" :max="INTERFACE_DOC_LIMITS.invokeBodyBytes" unit="字节" />
            </span>
          </label>

          <p v-if="errorMessage" class="fei-form-error" role="alert">{{ errorMessage }}</p>
        </div>

        <div class="fei-modal__footer fei-interface-config-modal__footer">
          <button class="fei-btn fei-btn--secondary" type="button" :disabled="submitting" @click="requestClose">取消</button>
          <button
            class="fei-btn fei-btn--primary"
            type="submit"
            :disabled="submitting || (!isEdit && (sdkMethodsLoading || sdkMethodsLoadFailed))"
          >
            {{ submitting ? '保存中...' : isEdit ? '保存配置' : '创建并维护文档' }}
          </button>
        </div>
      </form>
    </section>
  </div>

  <ConfirmDialog
    :open="discardConfirmOpen"
    title="放弃未保存内容"
    message="当前接口配置尚未保存，关闭后已填写的内容将会丢失。"
    primary-text="放弃修改"
    cancel-text="继续编辑"
    title-id="interface-config-discard-title"
    @confirm="discardChanges"
    @cancel="continueEditing"
  />
</template>

<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue';
import { computed, reactive, ref, watch } from 'vue';
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { QUOTA_TYPE_OPTIONS } from '@/composables/useQuota';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import { interfaceService } from '@/services/interfaceInfo';
import type {
  InterfaceInfoAddRequest,
  InterfaceInfoUpdateRequest,
  InterfaceInfoVO,
  SdkMethodOption,
} from '@/types/interface';
import type { InterfaceQuotaType } from '@/types/quota';
import {
  rawUnicodeCodePointLength,
  stripUnicodeWhitespace,
  unicodeCodePointLength,
  utf8ByteLength,
} from '@/utils/textSize';

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
/** 是否显示放弃未保存内容确认弹窗。 */
const discardConfirmOpen = ref(false);
/** 弹窗打开时的初始表单快照。 */
const initialFormSnapshot = ref('');
/** 管理员可选择的已注册 SDK 方法。 */
const sdkMethodOptions = ref<SdkMethodOption[]>([]);
/** SDK 方法列表是否正在加载。 */
const sdkMethodsLoading = ref(false);
/** SDK 方法列表是否加载失败或为空。 */
const sdkMethodsLoadFailed = ref(false);
const isEdit = computed(() => Boolean(props.interfaceInfo?.id));
const titleId = computed(() => `interface-config-title-${props.interfaceInfo?.id ?? 'new'}`);
/** 当前运行时模板的 UTF-8 字节数。 */
const runtimeTemplateBytes = computed(() => utf8ByteLength(form.requestParams));
/** 当前表单是否存在未保存修改。 */
const hasUnsavedChanges = computed(() => (
  Boolean(initialFormSnapshot.value) && initialFormSnapshot.value !== JSON.stringify({ ...form })
));

/** 运行时模板支持的参数类型标记。 */
const supportedTypeMarkers = new Set(['string', 'number', 'boolean', 'object', 'array']);

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
  initialFormSnapshot.value = JSON.stringify({ ...form });
};

/** 请求关闭弹窗；存在未保存修改时先要求确认。 */
const requestClose = () => {
  if (submitting.value) return;
  if (hasUnsavedChanges.value) {
    discardConfirmOpen.value = true;
    return;
  }
  emit('close');
};

/** 放弃未保存修改并关闭弹窗。 */
const discardChanges = () => {
  discardConfirmOpen.value = false;
  emit('close');
};

/** 取消放弃操作并继续编辑。 */
const continueEditing = () => {
  discardConfirmOpen.value = false;
};

/** 加载管理员新增接口时可选择的 SDK 方法。 */
const loadSdkMethodOptions = async () => {
  sdkMethodsLoading.value = true;
  sdkMethodsLoadFailed.value = false;
  sdkMethodOptions.value = [];
  try {
    const options = await interfaceService.listSdkMethods();
    sdkMethodOptions.value = options;
    if (options.length === 0) {
      sdkMethodsLoadFailed.value = true;
      errorMessage.value = '当前没有可用的 SDK 方法';
    }
  } catch (error) {
    sdkMethodsLoadFailed.value = true;
    errorMessage.value = error instanceof Error ? error.message : 'SDK 方法列表加载失败';
  } finally {
    sdkMethodsLoading.value = false;
  }
};

/** 按后端同步规则解析运行时模板示例值。 */
const resolveTemplateExampleValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return supportedTypeMarkers.has(value.trim().toLowerCase()) ? '' : value;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

/** 校验运行时请求参数模板的字节、结构、数量、名称和示例值边界。 */
const validateRequestParamsTemplate = (): string => {
  if (!form.requestParams.trim()) return '';
  if (runtimeTemplateBytes.value > INTERFACE_DOC_LIMITS.invokeBodyBytes) {
    return '请求参数模板不能超过 65535 个 UTF-8 字节';
  }
  try {
    const template = JSON.parse(form.requestParams) as unknown;
    if (template === null || Array.isArray(template) || typeof template !== 'object') {
      return '请求参数模板必须是 JSON 对象';
    }
    const entries = Object.entries(template as Record<string, unknown>);
    if (entries.length > INTERFACE_DOC_LIMITS.requestParamCount) return '请求参数数量不能超过 100';
    const invalidName = entries.find(([name]) => {
      const strippedName = stripUnicodeWhitespace(name);
      return !strippedName || strippedName !== name;
    })?.[0];
    if (invalidName !== undefined) {
      return stripUnicodeWhitespace(invalidName).length === 0
        ? '请求参数名称不能为空'
        : `请求参数名称不能包含首尾空白：${JSON.stringify(invalidName)}`;
    }
    if (entries.some(([name]) => rawUnicodeCodePointLength(name) > INTERFACE_DOC_LIMITS.paramNameLength)) {
      return '参数名称长度不能超过 128 个字符';
    }
    if (entries.some(([, value]) => (
      unicodeCodePointLength(resolveTemplateExampleValue(value)) > INTERFACE_DOC_LIMITS.exampleValueLength
    ))) {
      return '参数示例值长度不能超过 1024 个字符';
    }
    return '';
  } catch {
    return '请求参数模板必须是合法 JSON';
  }
};

/** 提交接口运行时配置。 */
const submitForm = async () => {
  const templateError = validateRequestParamsTemplate();
  if (templateError) {
    errorMessage.value = templateError;
    return;
  }
  if (!isEdit.value && (!form.sdkMethodName || sdkMethodsLoadFailed.value)) {
    errorMessage.value = sdkMethodsLoadFailed.value ? errorMessage.value : '请选择 SDK 方法';
    return;
  }
  submitting.value = true;
  errorMessage.value = '';
  try {
    const payload: InterfaceInfoAddRequest = {
      name: form.name,
      description: form.description,
      ...(form.url ? { url: form.url } : {}),
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

watch(() => props.open, async (open) => {
  discardConfirmOpen.value = false;
  if (!open) return;
  resetForm();
  if (!isEdit.value) await loadSdkMethodOptions();
}, { immediate: true });
</script>
