<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading">
      <div><span>02</span><h2>请求参数说明</h2></div>
      <p>名称、位置、类型和必填性来自运行时模板，仅维护说明性内容</p>
    </div>
    <div v-if="!params.length" class="fei-doc-empty">当前接口没有运行时请求参数</div>
    <div v-else class="fei-doc-param-list">
      <article v-for="param in params" :key="param.paramKey" class="fei-doc-param-row">
        <div class="fei-doc-param-row__identity">
          <strong>{{ param.name }}</strong>
          <span>{{ param.paramScene }} · {{ param.type }} · {{ param.required ? '必填' : '选填' }}</span>
        </div>
        <label class="fei-field"><span class="fei-label">说明</span><input class="fei-input" :value="param.description" maxlength="512" @input="updateText(param.paramKey, 'description', $event, true)" /></label>
        <label class="fei-field"><span class="fei-label">示例值</span><input class="fei-input" :value="param.exampleValue" maxlength="1024" @input="updateText(param.paramKey, 'exampleValue', $event)" /></label>
        <label class="fei-field"><span class="fei-label">默认值</span><input class="fei-input" :value="param.defaultValue" maxlength="512" @input="updateText(param.paramKey, 'defaultValue', $event)" /></label>
        <label class="fei-field"><span class="fei-label">校验规则</span><input class="fei-input" :value="param.validationRule" maxlength="512" @input="updateText(param.paramKey, 'validationRule', $event, true)" /></label>
        <label class="fei-field fei-field--sort"><span class="fei-label">排序</span><input class="fei-input" type="number" :value="param.sortOrder" @input="updateSort(param.paramKey, $event)" /></label>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { InterfaceDocParamSaveRequest } from '@/types/api';
import type { RequestParamEditableField } from '@/types/interfaceDocEditor';

/** 请求参数说明组件属性。 */
interface RequestParamDescriptionListProps {
  /** 运行时请求参数列表。 */
  params: InterfaceDocParamSaveRequest[];
}

/** 请求参数说明组件事件。 */
interface RequestParamDescriptionListEmits {
  /** 更新请求参数说明字段。 */
  (event: 'update-param', paramKey: string, field: RequestParamEditableField, value: string | number): void;
}

defineProps<RequestParamDescriptionListProps>();
const emit = defineEmits<RequestParamDescriptionListEmits>();

/** 更新请求参数文本字段。 */
const updateText = (paramKey: string, field: RequestParamEditableField, event: Event, trim = false): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update-param', paramKey, field, trim ? value.trim() : value);
};

/** 更新请求参数排序。 */
const updateSort = (paramKey: string, event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update-param', paramKey, 'sortOrder', value === '' ? '' : Number(value));
};
</script>
