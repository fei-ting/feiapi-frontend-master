<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading">
      <div><span>01</span><h2>文档主信息</h2></div>
      <p>版本、内容格式和面向调用方的公开备注</p>
    </div>
    <div class="fei-form-grid fei-form-grid--three">
      <label class="fei-field">
        <span class="fei-label">文档版本</span>
        <input class="fei-input" :value="modelValue.docVersion" maxlength="64" required @input="updateText('docVersion', $event, true)" />
      </label>
      <label class="fei-field">
        <span class="fei-label">请求格式</span>
        <select class="fei-select" :value="modelValue.requestContentType" @change="updateText('requestContentType', $event)">
          <option v-for="type in contentTypes" :key="`request-${type}`" :value="type">{{ type }}</option>
        </select>
      </label>
      <label class="fei-field">
        <span class="fei-label">响应格式</span>
        <select class="fei-select" :value="modelValue.responseContentType" @change="updateText('responseContentType', $event)">
          <option v-for="type in contentTypes" :key="`response-${type}`" :value="type">{{ type }}</option>
        </select>
      </label>
    </div>
    <label class="fei-field">
      <span class="fei-label">公开备注</span>
      <textarea class="fei-textarea fei-textarea--compact" :value="modelValue.remark" maxlength="512" @input="updateText('remark', $event, true)"></textarea>
    </label>
  </section>
</template>

<script setup lang="ts">
import type { DocMainEditableField, DocMainForm } from '@/types/interfaceDocEditor';

/** 文档主信息组件属性。 */
interface DocumentMainInfoFormProps {
  /** 文档主信息表单值。 */
  modelValue: DocMainForm;
  /** 可选内容类型。 */
  contentTypes: string[];
}

/** 文档主信息组件事件。 */
interface DocumentMainInfoFormEmits {
  /** 更新文档主信息字段。 */
  (event: 'update-field', field: DocMainEditableField, value: string): void;
}

defineProps<DocumentMainInfoFormProps>();
const emit = defineEmits<DocumentMainInfoFormEmits>();

/** 更新文本或选择字段。 */
const updateText = (field: DocMainEditableField, event: Event, trim = false): void => {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  emit('update-field', field, trim ? value.trim() : value);
};
</script>
