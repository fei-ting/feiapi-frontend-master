<template>
  <section class="fei-invoke-params" aria-labelledby="invoke-param-title">
    <div class="fei-invoke-params__head">
      <h2 id="invoke-param-title">请求参数</h2>
      <span v-if="structuredParams.length" class="fei-invoke-params__hint">
        发送 API 调用会使用当前登录账号的 APIKey 发起实际调用，请谨慎操作。
      </span>
    </div>

    <div v-if="structuredParams.length" class="fei-invoke-param-list">
      <label
        v-for="param in structuredParams"
        :key="param.name"
        class="fei-invoke-param"
        :for="`invoke-param-${param.name}`"
      >
        <span class="fei-invoke-param__label">
          <span>
            {{ param.name }}
            <small>{{ param.type }}</small>
            <span v-if="param.required" class="fei-invoke-param__required" aria-label="必填">*</span>
          </span>
        </span>
        <input
          :id="`invoke-param-${param.name}`"
          class="fei-input"
          :type="param.type === 'number' ? 'number' : 'text'"
          :value="paramValues[param.name] || ''"
          :placeholder="`请输入${param.name}`"
          :required="param.required"
          @input="updateParam(param.name, $event)"
        />
      </label>
    </div>

    <div v-else class="fei-doc-empty">{{ emptyParamText }}</div>
  </section>

  <div class="fei-toolbar fei-invoke-toolbar">
    <button class="fei-btn fei-btn--primary" type="button" :disabled="invokeLoading" @click="requestInvoke">
      {{ invokeLoading ? '调用中...' : '发送请求' }}
    </button>
    <button
      v-if="canFillExample"
      class="fei-btn fei-btn--secondary"
      type="button"
      @click="requestFillExample"
    >
      填充示例
    </button>
  </div>
</template>

<script setup lang="ts">
import type { RequestParamField } from '@/composables/useInterfaceInvoke';

/** 请求参数表单组件属性。 */
interface RequestParameterFormProps {
  /** 结构化请求参数字段。 */
  structuredParams: RequestParamField[];
  /** 当前参数输入值。 */
  paramValues: Record<string, string>;
  /** 是否正在调用接口。 */
  invokeLoading: boolean;
  /** 是否允许填充示例。 */
  canFillExample: boolean;
  /** 没有结构化参数时的提示文本。 */
  emptyParamText: string;
}

/** 请求参数表单组件事件。 */
interface RequestParameterFormEmits {
  /** 更新指定参数值。 */
  (event: 'update-param', name: string, value: string): void;
  /** 请求父页面发起调用。 */
  (event: 'invoke'): void;
  /** 请求父页面填充示例。 */
  (event: 'fill-example'): void;
}

defineProps<RequestParameterFormProps>();
const emit = defineEmits<RequestParameterFormEmits>();

/**
 * 将输入值发送给父页面。
 *
 * @param name 参数名称
 * @param event 输入事件
 */
const updateParam = (name: string, event: Event): void => {
  emit('update-param', name, (event.target as HTMLInputElement).value);
};

/** 请求父页面发起调用。 */
const requestInvoke = (): void => {
  emit('invoke');
};

/** 请求父页面填充示例。 */
const requestFillExample = (): void => {
  emit('fill-example');
};
</script>
