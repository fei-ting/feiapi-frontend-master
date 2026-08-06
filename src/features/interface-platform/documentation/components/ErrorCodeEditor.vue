<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading fei-doc-section__heading--action">
      <div><span>06</span><h2>接口错误码</h2></div>
      <div class="fei-doc-boundary-action">
        <p>当前 {{ errorCodes.length }}/{{ INTERFACE_DOC_LIMITS.errorCodeCount }}</p>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" :disabled="addDisabled" :title="addDisabled ? '错误码数量已达到 100' : ''" @click="requestAdd">新增错误码</button>
      </div>
    </div>
    <div v-if="!errorCodes.length" class="fei-doc-empty">当前接口没有专属错误码</div>
    <div v-else class="fei-doc-record-list">
      <article v-for="(errorCode, index) in errorCodes" :key="errorCode.clientKey" class="fei-doc-record">
        <div class="fei-doc-record__toolbar">
          <strong>{{ errorCode.errorCode || '未填写错误码' }}</strong>
          <button type="button" class="fei-action-btn fei-action-btn--danger" @click="requestRemove(errorCode.clientKey)">删除</button>
        </div>
        <div class="fei-form-grid fei-form-grid--three">
          <label class="fei-field"><span class="fei-label">错误码</span><input class="fei-input" :value="errorCode.errorCode" required @input="updateText(errorCode.clientKey, 'errorCode', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(errorCode.errorCode)" :max="INTERFACE_DOC_LIMITS.errorCodeLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">错误信息</span><input class="fei-input" :value="errorCode.errorMessage" required @input="updateText(errorCode.clientKey, 'errorMessage', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(errorCode.errorMessage)" :max="INTERFACE_DOC_LIMITS.errorMessageLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">排序</span><input class="fei-input" type="number" :value="errorCode.sortOrder" :placeholder="String(index + 1)" @input="updateNumber(errorCode.clientKey, $event)" /></label>
        </div>
        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field"><span class="fei-label">公开说明</span><input class="fei-input" :value="errorCode.description" @input="updateText(errorCode.clientKey, 'description', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(errorCode.description)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">解决建议</span><input class="fei-input" :value="errorCode.solution" @input="updateText(errorCode.clientKey, 'solution', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(errorCode.solution)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></label>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import type { EditableErrorCode, ErrorCodeEditableField } from '@/features/interface-platform/documentation/types/interfaceDocEditor';
import { unicodeCodePointLength } from '@/utils/textSize';

/** 错误码编辑器属性。 */
interface ErrorCodeEditorProps {
  /** 接口错误码列表。 */
  errorCodes: EditableErrorCode[];
}

/** 错误码编辑器事件。 */
interface ErrorCodeEditorEmits {
  /** 新增错误码。 */
  (event: 'add'): void;
  /** 删除错误码。 */
  (event: 'remove', clientKey: string): void;
  /** 更新错误码字段。 */
  (event: 'update-error-code', clientKey: string, field: ErrorCodeEditableField, value: string | number): void;
}

const props = defineProps<ErrorCodeEditorProps>();
const emit = defineEmits<ErrorCodeEditorEmits>();

/** 是否已达到错误码数量上限。 */
const addDisabled = computed(() => props.errorCodes.length >= INTERFACE_DOC_LIMITS.errorCodeCount);

/** 更新错误码文本字段。 */
const updateText = (clientKey: string, field: ErrorCodeEditableField, event: Event, trim = false): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update-error-code', clientKey, field, trim ? value.trim() : value);
};

/** 更新错误码排序。 */
const updateNumber = (clientKey: string, event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update-error-code', clientKey, 'sortOrder', value === '' ? '' : Number(value));
};

/** 请求新增错误码。 */
const requestAdd = (): void => {
  if (!addDisabled.value) emit('add');
};

/** 请求删除错误码。 */
const requestRemove = (clientKey: string): void => { emit('remove', clientKey); };
</script>
