<template>
  <section class="fei-doc-section fei-doc-main-info">
    <div class="fei-doc-section__heading fei-doc-main-info__heading">
      <div class="fei-doc-main-info__title">
        <span>01</span>
        <div>
          <h2>文档主信息</h2>
          <p>配置内容格式和面向调用方的公开备注</p>
        </div>
      </div>
    </div>
    <div class="fei-form-grid fei-doc-main-info__grid">
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
      <span class="fei-doc-main-info__label-row">
        <span class="fei-label">公开备注</span>
        <BoundaryRemaining :current="unicodeCodePointLength(modelValue.remark)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" />
      </span>
      <textarea class="fei-textarea fei-doc-main-info__remark" :value="modelValue.remark" @input="updateText('remark', $event, true)"></textarea>
    </label>
    <p class="fei-doc-main-info__hint">
      <InfoCircleOutlined aria-hidden="true" />
      <span>公开备注将展示给接口调用方，请避免填写内部地址、密钥或其他敏感信息。</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { InfoCircleOutlined } from '@ant-design/icons-vue';
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import type { DocMainEditableField, DocMainForm } from '@/features/interface-platform/documentation/types/interfaceDocEditor';
import { unicodeCodePointLength } from '@/utils/textSize';

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
