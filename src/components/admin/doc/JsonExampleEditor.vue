<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading">
      <div><span>04</span><h2>JSON 示例</h2></div>
      <p>示例只能使用模拟数据或固定脱敏占位符</p>
    </div>
    <div class="fei-form-grid fei-form-grid--two">
      <label class="fei-field">
        <span class="fei-label-row"><span class="fei-label">成功响应示例</span><button type="button" @click="requestFormat('successExample')">格式化</button></span>
        <textarea class="fei-textarea fei-code-input" spellcheck="false" :value="successExample" @input="updateExample('successExample', $event)"></textarea>
      </label>
      <label class="fei-field">
        <span class="fei-label-row"><span class="fei-label">失败响应示例</span><button type="button" @click="requestFormat('failExample')">格式化</button></span>
        <textarea class="fei-textarea fei-code-input" spellcheck="false" :value="failExample" @input="updateExample('failExample', $event)"></textarea>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { JsonExampleField } from '@/types/interfaceDocEditor';

/** JSON 示例编辑器属性。 */
interface JsonExampleEditorProps {
  /** 成功响应示例。 */
  successExample: string;
  /** 失败响应示例。 */
  failExample: string;
}

/** JSON 示例编辑器事件。 */
interface JsonExampleEditorEmits {
  /** 更新指定示例。 */
  (event: 'update-example', field: JsonExampleField, value: string): void;
  /** 请求父页面格式化指定示例。 */
  (event: 'format', field: JsonExampleField): void;
}

defineProps<JsonExampleEditorProps>();
const emit = defineEmits<JsonExampleEditorEmits>();

/** 更新 JSON 示例文本。 */
const updateExample = (field: JsonExampleField, event: Event): void => {
  emit('update-example', field, (event.target as HTMLTextAreaElement).value);
};

/** 请求父页面格式化 JSON 示例。 */
const requestFormat = (field: JsonExampleField): void => {
  emit('format', field);
};
</script>
