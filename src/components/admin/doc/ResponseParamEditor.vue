<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading fei-doc-section__heading--action">
      <div><span>03</span><h2>响应字段</h2></div>
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="requestAdd">新增字段</button>
    </div>
    <div v-if="!params.length" class="fei-doc-empty">暂未维护响应字段</div>
    <div v-else class="fei-doc-record-list">
      <article v-for="param in params" :key="param.paramKey" class="fei-doc-record">
        <div class="fei-doc-record__toolbar">
          <strong>{{ param.name || '未命名字段' }}</strong>
          <button type="button" class="fei-action-btn fei-action-btn--danger" @click="requestRemove(param.paramKey)">删除</button>
        </div>
        <div class="fei-form-grid fei-form-grid--four">
          <label class="fei-field"><span class="fei-label">字段名</span><input class="fei-input" :value="param.name" maxlength="128" required @input="updateText(param.paramKey, 'name', $event, true)" /></label>
          <label class="fei-field"><span class="fei-label">类型</span><select class="fei-select" :value="param.type" @change="updateText(param.paramKey, 'type', $event)"><option v-for="type in paramTypes" :key="type" :value="type">{{ type }}</option></select></label>
          <label class="fei-field"><span class="fei-label">父字段</span><select class="fei-select" :value="param.parentParamKey || ''" @change="updateText(param.paramKey, 'parentParamKey', $event)"><option value="">根节点</option><option v-for="parent in parentOptions(param.paramKey)" :key="parent.paramKey" :value="parent.paramKey">{{ parent.name || '未命名字段' }}</option></select></label>
          <label class="fei-field"><span class="fei-label">排序</span><input class="fei-input" type="number" :value="param.sortOrder" @input="updateNumber(param.paramKey, 'sortOrder', $event)" /></label>
        </div>
        <div class="fei-inline-checks">
          <label><input type="checkbox" :checked="param.required" @change="updateChecked(param.paramKey, 'required', $event)" /> 字段必须出现</label>
          <label><input type="checkbox" :checked="param.nullable" @change="updateChecked(param.paramKey, 'nullable', $event)" /> 允许空值</label>
        </div>
        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field"><span class="fei-label">字段说明</span><input class="fei-input" :value="param.description" maxlength="512" @input="updateText(param.paramKey, 'description', $event, true)" /></label>
          <label class="fei-field"><span class="fei-label">示例值</span><input class="fei-input" :value="param.exampleValue" maxlength="1024" @input="updateText(param.paramKey, 'exampleValue', $event)" /></label>
          <label class="fei-field"><span class="fei-label">默认值</span><input class="fei-input" :value="param.defaultValue" maxlength="512" @input="updateText(param.paramKey, 'defaultValue', $event)" /></label>
          <label class="fei-field"><span class="fei-label">校验规则</span><input class="fei-input" :value="param.validationRule" maxlength="512" @input="updateText(param.paramKey, 'validationRule', $event, true)" /></label>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { InterfaceDocParamSaveRequest } from '@/types/api';
import type { EditorFieldValue, ResponseParamEditableField } from '@/types/interfaceDocEditor';

/** 响应字段编辑器属性。 */
interface ResponseParamEditorProps {
  /** 响应字段列表。 */
  params: InterfaceDocParamSaveRequest[];
  /** 可选参数类型。 */
  paramTypes: string[];
}

/** 响应字段编辑器事件。 */
interface ResponseParamEditorEmits {
  /** 新增响应字段。 */
  (event: 'add'): void;
  /** 删除响应字段。 */
  (event: 'remove', paramKey: string): void;
  /** 更新响应字段。 */
  (event: 'update-param', paramKey: string, field: ResponseParamEditableField, value: EditorFieldValue): void;
}

const props = defineProps<ResponseParamEditorProps>();
const emit = defineEmits<ResponseParamEditorEmits>();

/** 获取排除当前字段后的父字段选项。 */
const parentOptions = (currentKey: string): InterfaceDocParamSaveRequest[] => (
  props.params.filter((param) => param.paramKey !== currentKey)
);

/** 更新响应字段文本。 */
const updateText = (paramKey: string, field: ResponseParamEditableField, event: Event, trim = false): void => {
  const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
  emit('update-param', paramKey, field, trim ? value.trim() : value);
};

/** 更新响应字段数字。 */
const updateNumber = (paramKey: string, field: ResponseParamEditableField, event: Event): void => {
  const value = (event.target as HTMLInputElement).value;
  emit('update-param', paramKey, field, value === '' ? '' : Number(value));
};

/** 更新响应字段布尔值。 */
const updateChecked = (paramKey: string, field: ResponseParamEditableField, event: Event): void => {
  emit('update-param', paramKey, field, (event.target as HTMLInputElement).checked);
};

/** 请求新增响应字段。 */
const requestAdd = (): void => { emit('add'); };

/** 请求删除响应字段。 */
const requestRemove = (paramKey: string): void => { emit('remove', paramKey); };
</script>
