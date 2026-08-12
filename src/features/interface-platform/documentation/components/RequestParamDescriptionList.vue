<template>
  <section class="fei-doc-section fei-doc-request-params">
    <div class="fei-doc-section__heading fei-doc-request-params__heading">
      <div class="fei-doc-request-params__title">
        <span>03</span>
        <div>
          <h2>请求参数说明</h2>
          <p>名称、位置、类型和必填性由运行时模板生成，此处维护面向调用方的参数说明</p>
        </div>
      </div>
      <span class="fei-doc-request-params__count">当前 {{ params.length }} / {{ INTERFACE_DOC_LIMITS.requestParamCount }}</span>
    </div>
    <div v-if="!params.length" class="fei-doc-empty">当前接口没有运行时请求参数</div>
    <div v-else class="fei-doc-param-list fei-doc-request-params__list">
      <article v-for="param in params" :key="param.paramKey" class="fei-doc-param-row fei-doc-request-params__item">
        <div class="fei-doc-param-row__identity fei-doc-request-params__identity">
          <strong :title="param.name">{{ param.name }}</strong>
          <div class="fei-doc-request-params__tags" aria-label="参数运行时属性">
            <span class="fei-doc-request-params__tag fei-doc-request-params__tag--scene">{{ param.paramScene }}</span>
            <span class="fei-doc-request-params__tag fei-doc-request-params__tag--type">{{ param.type }}</span>
            <span class="fei-doc-request-params__tag" :class="param.required ? 'fei-doc-request-params__tag--required' : 'fei-doc-request-params__tag--optional'">
              <i aria-hidden="true"></i>{{ param.required ? '必填' : '选填' }}
            </span>
          </div>
        </div>
        <div class="fei-doc-request-params__fields">
          <label class="fei-field">
            <span class="fei-doc-request-params__label-row"><span class="fei-label">说明</span><BoundaryRemaining :current="unicodeCodePointLength(param.description)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></span>
            <input class="fei-input" :value="param.description" @input="updateText(param.paramKey, 'description', $event, true)" />
          </label>
          <label class="fei-field">
            <span class="fei-doc-request-params__label-row"><span class="fei-label">示例值</span><BoundaryRemaining :current="unicodeCodePointLength(param.exampleValue)" :max="INTERFACE_DOC_LIMITS.exampleValueLength" unit="字符" /></span>
            <input class="fei-input" :value="param.exampleValue" @input="updateText(param.paramKey, 'exampleValue', $event)" />
          </label>
          <label class="fei-field">
            <span class="fei-doc-request-params__label-row"><span class="fei-label">默认值</span><BoundaryRemaining :current="unicodeCodePointLength(param.defaultValue)" :max="INTERFACE_DOC_LIMITS.defaultValueLength" unit="字符" /></span>
            <input class="fei-input" :value="param.defaultValue" @input="updateText(param.paramKey, 'defaultValue', $event)" />
          </label>
          <label class="fei-field">
            <span class="fei-doc-request-params__label-row"><span class="fei-label">校验规则</span><BoundaryRemaining :current="unicodeCodePointLength(param.validationRule)" :max="INTERFACE_DOC_LIMITS.descriptionLength" unit="字符" /></span>
            <input class="fei-input" :value="param.validationRule" @input="updateText(param.paramKey, 'validationRule', $event, true)" />
          </label>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import type { InterfaceDocParamSaveRequest } from '@/features/interface-platform/documentation/types/interfaceDoc';
import type { RequestParamEditableField } from '@/features/interface-platform/documentation/types/interfaceDocEditor';
import { unicodeCodePointLength } from '@/utils/textSize';

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
</script>
