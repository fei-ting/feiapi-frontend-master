<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading fei-doc-section__heading--action">
      <div><span>04</span><h2>响应字段</h2></div>
      <div class="fei-doc-boundary-action">
        <p>响应 {{ params.length }}/{{ INTERFACE_DOC_LIMITS.responseParamCount }} · 参数合计 {{ totalParamCount }}/{{ INTERFACE_DOC_LIMITS.totalParamCount }}</p>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" :disabled="addDisabled" :title="addDisabledReason" @click="requestAdd">新增字段</button>
      </div>
    </div>
    <div v-if="!params.length" class="fei-doc-empty">暂未维护响应字段</div>
    <div v-else class="fei-doc-record-list">
      <article v-for="param in params" :key="param.paramKey" class="fei-doc-record">
        <div class="fei-doc-record__toolbar">
          <strong>{{ param.name || '未命名字段' }}</strong>
          <button type="button" class="fei-action-btn fei-action-btn--danger" @click="requestRemove(param.paramKey)">删除</button>
        </div>
        <div class="fei-form-grid fei-form-grid--four">
          <label class="fei-field"><span class="fei-label">字段名</span><input class="fei-input" :value="param.name" required @input="updateText(param.paramKey, 'name', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(param.name)" :max="INTERFACE_DOC_LIMITS.paramNameLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">类型</span><select class="fei-select" :value="param.type" @change="updateText(param.paramKey, 'type', $event)"><option v-for="type in paramTypes" :key="type" :value="type">{{ type }}</option></select></label>
          <label class="fei-field"><span class="fei-label">父字段</span><select class="fei-select" :value="param.parentParamKey || ''" @change="updateText(param.paramKey, 'parentParamKey', $event)"><option value="">根节点</option><option v-for="parent in parentOptions(param.paramKey)" :key="parent.paramKey" :value="parent.paramKey">{{ parent.label }}</option></select></label>
          <label class="fei-field"><span class="fei-label">排序</span><input class="fei-input" type="number" :value="param.sortOrder" @input="updateNumber(param.paramKey, 'sortOrder', $event)" /></label>
        </div>
        <div class="fei-inline-checks">
          <label><input type="checkbox" :checked="param.required" @change="updateChecked(param.paramKey, 'required', $event)" /> 字段必须出现</label>
          <label><input type="checkbox" :checked="param.nullable" @change="updateChecked(param.paramKey, 'nullable', $event)" /> 允许空值</label>
        </div>
        <div class="fei-form-grid fei-form-grid--two">
          <label class="fei-field"><span class="fei-label">字段说明</span><input class="fei-input" :value="param.description" @input="updateText(param.paramKey, 'description', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(param.description)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">示例值</span><input class="fei-input" :value="param.exampleValue" @input="updateText(param.paramKey, 'exampleValue', $event)" /><BoundaryRemaining :current="unicodeCodePointLength(param.exampleValue)" :max="INTERFACE_DOC_LIMITS.exampleValueLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">默认值</span><input class="fei-input" :value="param.defaultValue" @input="updateText(param.paramKey, 'defaultValue', $event)" /><BoundaryRemaining :current="unicodeCodePointLength(param.defaultValue)" :max="INTERFACE_DOC_LIMITS.defaultValueLength" unit="字符" /></label>
          <label class="fei-field"><span class="fei-label">校验规则</span><input class="fei-input" :value="param.validationRule" @input="updateText(param.paramKey, 'validationRule', $event, true)" /><BoundaryRemaining :current="unicodeCodePointLength(param.validationRule)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></label>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue';
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import type { InterfaceDocParamSaveRequest } from '@/features/interface-platform/documentation/types/interfaceDoc';
import type { EditorFieldValue, ResponseParamEditableField } from '@/features/interface-platform/documentation/types/interfaceDocEditor';
import { getResponseFieldParentOptions, type ResponseFieldParentOption } from '@/features/interface-platform/documentation/utils/responseFieldTree';
import { unicodeCodePointLength } from '@/utils/textSize';

/** 响应字段编辑器属性。 */
interface ResponseParamEditorProps {
  /** 响应字段列表。 */
  params: InterfaceDocParamSaveRequest[];
  /** 可选参数类型。 */
  paramTypes: string[];
  /** 当前运行时请求参数数量。 */
  requestParamCount: number;
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

/** 请求参数与响应字段合计数量。 */
const totalParamCount = computed(() => props.requestParamCount + props.params.length);
/** 是否已达到响应字段或参数合计上限。 */
const addDisabled = computed(() => (
  props.params.length >= INTERFACE_DOC_LIMITS.responseParamCount
  || totalParamCount.value >= INTERFACE_DOC_LIMITS.totalParamCount
));
/** 禁用新增响应字段时的具体原因。 */
const addDisabledReason = computed(() => {
  if (props.params.length >= INTERFACE_DOC_LIMITS.responseParamCount) return '响应字段数量已达到 200';
  if (totalParamCount.value >= INTERFACE_DOC_LIMITS.totalParamCount) return '请求参数与响应字段合计数量已达到 200';
  return '';
});

/** 获取当前字段的合法父字段选项。 */
const parentOptions = (currentKey: string): ResponseFieldParentOption[] => (
  getResponseFieldParentOptions(props.params, currentKey)
);

/** 更新响应字段文本。 */
const updateText = (paramKey: string, field: ResponseParamEditableField, event: Event, trim = false): void => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const value = target.value;
  emit('update-param', paramKey, field, trim ? value.trim() : value);
  if (field === 'type' || field === 'parentParamKey') {
    nextTick(() => {
      const currentParam = props.params.find((param) => param.paramKey === paramKey);
      target.value = String(currentParam?.[field] ?? '');
    });
  }
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
const requestAdd = (): void => {
  if (!addDisabled.value) emit('add');
};

/** 请求删除响应字段。 */
const requestRemove = (paramKey: string): void => { emit('remove', paramKey); };
</script>
