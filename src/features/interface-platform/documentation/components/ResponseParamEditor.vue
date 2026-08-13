<template>
  <section class="fei-doc-section fei-doc-response-params">
    <div class="fei-doc-section__heading fei-doc-response-params__heading">
      <div class="fei-doc-response-params__title">
        <span>04</span>
        <div>
          <h2>响应字段</h2>
          <p>维护响应结构、字段约束和面向调用方的字段说明</p>
        </div>
      </div>
      <div class="fei-doc-boundary-action">
        <span class="fei-doc-response-params__count">响应 {{ params.length }} / {{ INTERFACE_DOC_LIMITS.responseParamCount }}</span>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" :disabled="addDisabled" :title="addDisabledReason" @click="requestAdd">新增字段</button>
      </div>
    </div>
    <div v-if="!params.length" class="fei-doc-empty">暂未维护响应字段</div>
    <div v-else class="fei-doc-record-list">
      <article v-for="param in params" :key="param.paramKey" class="fei-doc-record fei-doc-response-params__item" :class="{ 'fei-doc-response-params__item--child': param.parentParamKey }">
        <div class="fei-doc-record__toolbar">
          <div class="fei-doc-response-params__identity">
            <strong>{{ param.name || '未命名字段' }}</strong>
            <div class="fei-doc-response-params__tags" aria-label="响应字段属性">
              <span class="fei-doc-response-params__tag fei-doc-response-params__tag--parent">{{ parentLabel(param) }}</span>
              <span class="fei-doc-response-params__tag fei-doc-response-params__tag--type">{{ param.type }}</span>
              <span class="fei-doc-response-params__tag" :class="param.required ? 'fei-doc-response-params__tag--required' : 'fei-doc-response-params__tag--optional'">{{ param.required ? '必填' : '选填' }}</span>
              <span class="fei-doc-response-params__tag" :class="param.nullable ? 'fei-doc-response-params__tag--nullable' : 'fei-doc-response-params__tag--not-null'">{{ param.nullable ? '可为空' : '非空' }}</span>
            </div>
          </div>
          <button type="button" class="fei-action-btn fei-action-btn--danger fei-doc-response-params__delete" @click="requestRemove(param.paramKey)">删除</button>
        </div>
        <div class="fei-form-grid fei-form-grid--four">
          <label class="fei-field">
            <span class="fei-doc-response-params__label-row">
              <span class="fei-label">字段名</span>
              <BoundaryRemaining :current="unicodeCodePointLength(param.name)" :max="INTERFACE_DOC_LIMITS.paramNameLength" unit="字符" />
            </span>
            <input class="fei-input" :value="param.name" required @input="updateText(param.paramKey, 'name', $event, true)" />
          </label>
          <label class="fei-field">
            <span class="fei-label">类型</span>
            <select class="fei-select" :value="param.type" @change="updateText(param.paramKey, 'type', $event)">
              <option v-for="type in paramTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="fei-field">
            <span class="fei-label">父字段</span>
            <select class="fei-select" :value="param.parentParamKey || ''" @change="updateText(param.paramKey, 'parentParamKey', $event)">
              <option value="">根节点</option>
              <option v-for="parent in parentOptions(param.paramKey)" :key="parent.paramKey" :value="parent.paramKey">{{ parent.label }}</option>
            </select>
          </label>
          <label class="fei-field">
            <span class="fei-label">排序</span>
            <input class="fei-input" type="number" :value="param.sortOrder" @input="updateNumber(param.paramKey, 'sortOrder', $event)" />
          </label>
        </div>
        <div class="fei-doc-response-params__detail-row">
          <label class="fei-field">
            <span class="fei-doc-response-params__label-row">
              <span class="fei-label">字段说明</span>
              <BoundaryRemaining :current="unicodeCodePointLength(param.description)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" />
            </span>
            <input class="fei-input fei-doc-response-params__description-input" :value="param.description" @input="updateText(param.paramKey, 'description', $event, true)" />
          </label>
          <div class="fei-doc-response-params__checks">
            <label>
              <input type="checkbox" :checked="param.required" @change="updateChecked(param.paramKey, 'required', $event)" />
              <span>字段必须出现</span>
            </label>
            <label>
              <input type="checkbox" :checked="param.nullable" @change="updateChecked(param.paramKey, 'nullable', $event)" />
              <span>允许空值</span>
            </label>
          </div>
        </div>
      </article>
      <button
        type="button"
        class="fei-doc-response-params__bottom-add"
        :disabled="addDisabled"
        :title="addDisabledReason || '新增响应字段'"
        @click="requestAdd"
      >
        <span class="fei-doc-response-params__bottom-add-icon" aria-hidden="true">+</span>
        <span>新增响应字段</span>
      </button>
    </div>
    <p v-if="params.length" class="fei-doc-response-params__total">参数合计 {{ totalParamCount }} / {{ INTERFACE_DOC_LIMITS.totalParamCount }} · 父字段关系用于组织响应 JSON 层级，同级字段按排序值展示</p>
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

/** 获取响应字段当前父级的展示名称。 */
const parentLabel = (param: InterfaceDocParamSaveRequest): string => {
  if (!param.parentParamKey) return '根字段';
  return props.params.find((candidate) => candidate.paramKey === param.parentParamKey)?.name || '父字段缺失';
};

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
