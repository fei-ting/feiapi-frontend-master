<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading fei-doc-section__heading--action">
      <div><span>05</span><h2>接口错误码</h2></div>
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="requestAdd">新增错误码</button>
    </div>
    <div v-if="!errorCodes.length" class="fei-doc-empty">当前接口没有专属错误码</div>
    <div v-else class="fei-doc-record-list">
      <article v-for="(errorCode, index) in errorCodes" :key="errorCode.clientKey" class="fei-doc-record">
        <div class="fei-doc-record__toolbar">
          <strong>{{ errorCode.errorCode || '未填写错误码' }}</strong>
          <button type="button" class="fei-action-btn fei-action-btn--danger" @click="requestRemove(errorCode.clientKey)">删除</button>
        </div>
        <div class="fei-form-grid fei-form-grid--three">
          <label class="fei-field"><span class="fei-label">错误码</span><input class="fei-input" :value="errorCode.errorCode" maxlength="64" required @input="updateText(errorCode.clientKey, 'errorCode', $event, true)" /></label>
          <label class="fei-field"><span class="fei-label">错误信息</span><input class="fei-input" :value="errorCode.errorMessage" maxlength="256" required @input="updateText(errorCode.clientKey, 'errorMessage', $event, true)" /></label>
          <label class="fei-field"><span class="fei-label">排序</span><input class="fei-input" type="number" :value="errorCode.sortOrder" :placeholder="String(index + 1)" @input="updateNumber(errorCode.clientKey, $event)" /></label>
        </div>
        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field"><span class="fei-label">公开说明</span><input class="fei-input" :value="errorCode.description" maxlength="512" @input="updateText(errorCode.clientKey, 'description', $event, true)" /></label>
          <label class="fei-field"><span class="fei-label">解决建议</span><input class="fei-input" :value="errorCode.solution" maxlength="512" @input="updateText(errorCode.clientKey, 'solution', $event, true)" /></label>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EditableErrorCode, ErrorCodeEditableField } from '@/types/interfaceDocEditor';

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

defineProps<ErrorCodeEditorProps>();
const emit = defineEmits<ErrorCodeEditorEmits>();

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
const requestAdd = (): void => { emit('add'); };

/** 请求删除错误码。 */
const requestRemove = (clientKey: string): void => { emit('remove', clientKey); };
</script>
