<template>
  <div
    class="fei-interface-documentation"
    :class="{
      'fei-invoke-doc': !isDetailMode,
      'fei-interface-documentation--detail': isDetailMode,
    }"
  >
    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">请求 Header</h3>
      <div v-if="hasRows(docDetail.requestHeaders)" class="fei-table-wrap fei-doc-table-wrap">
        <table class="fei-table fei-doc-table">
          <thead>
            <tr>
              <th scope="col">名称</th>
              <th scope="col">必填</th>
              <th v-if="isDetailMode" scope="col">类型</th>
              <th scope="col">值</th>
              <th scope="col">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.requestHeaders" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
              <td>{{ headerRequiredText(param) }}</td>
              <td v-if="isDetailMode">{{ param.type || '-' }}</td>
              <td><span class="fei-doc-example">{{ paramValue(param) }}</span></td>
              <td>{{ headerDescription(param) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="fei-doc-empty">无请求 Header</div>
    </div>

    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">请求参数</h3>
      <div v-if="hasRows(docDetail.requestParams)" class="fei-table-wrap fei-doc-table-wrap">
        <table class="fei-table fei-doc-table">
          <thead>
            <tr>
              <th scope="col">名称</th>
              <th v-if="isDetailMode" scope="col">位置</th>
              <th scope="col">必填</th>
              <th scope="col">类型</th>
              <th scope="col">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.requestParams" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
              <td v-if="isDetailMode">{{ paramSceneText(param.paramScene) }}</td>
              <td>{{ requiredText(param.required) }}</td>
              <td>{{ param.type || '-' }}</td>
              <td>{{ requestParamDescription(param) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="fei-doc-empty">无请求参数</div>
    </div>

    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">响应参数</h3>
      <div v-if="hasRows(docDetail.responseParams)" class="fei-table-wrap fei-doc-table-wrap">
        <table class="fei-table fei-doc-table">
          <thead>
            <tr>
              <th scope="col">字段名</th>
              <th scope="col">类型</th>
              <th scope="col">可能为空</th>
              <th v-if="isDetailMode" scope="col">父级字段</th>
              <th scope="col">说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.responseParams" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
              <td>{{ param.type || '-' }}</td>
              <td>{{ nullableText(param.nullable) }}</td>
              <td v-if="isDetailMode">{{ parentFieldText(param) }}</td>
              <td>{{ param.description || param.exampleValue || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="fei-doc-empty">暂无响应字段说明</div>
    </div>

    <div class="fei-doc-section">
      <div v-if="isDetailMode" class="fei-doc-section__head">
        <h3 class="fei-doc-heading">JSON 返回示例</h3>
        <button
          class="fei-icon-btn"
          type="button"
          :title="activeExampleCopyTitle"
          :disabled="!hasText(activeExampleText)"
          @click="requestCopy(activeExampleText)"
        >
          <slot name="copy-icon" />
        </button>
      </div>
      <h3 v-else class="fei-doc-heading">JSON 返回示例</h3>
      <div v-if="isDetailMode" class="fei-example-switch" role="tablist" aria-label="返回示例类型">
        <button
          class="fei-example-switch__button"
          :class="{ 'is-active': exampleTab === 'success' }"
          type="button"
          role="tab"
          :aria-selected="exampleTab === 'success'"
          @click="exampleTab = 'success'"
        >
          成功示例
        </button>
        <button
          class="fei-example-switch__button"
          :class="{ 'is-active': exampleTab === 'fail' }"
          type="button"
          role="tab"
          :aria-selected="exampleTab === 'fail'"
          @click="exampleTab = 'fail'"
        >
          失败示例
        </button>
      </div>
      <pre v-if="hasText(activeExampleText)" class="fei-code">{{ prettyJson(activeExampleText, '{}') }}</pre>
      <div v-else class="fei-doc-empty">{{ activeExampleEmptyText }}</div>
    </div>

    <div v-if="isDetailMode" class="fei-doc-section">
      <h3 class="fei-doc-heading">错误码</h3>
      <div v-if="hasRows(docDetail.errorCodes)" class="fei-table-wrap fei-doc-table-wrap">
        <table class="fei-table fei-doc-table">
          <thead>
            <tr>
              <th scope="col">错误码</th>
              <th scope="col">错误信息</th>
              <th scope="col">说明</th>
              <th scope="col">解决建议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="errorCode in docDetail.errorCodes" :key="errorCode.id || errorCode.errorCode">
              <td><span class="fei-doc-param-name">{{ errorCode.errorCode || '-' }}</span></td>
              <td>{{ errorCode.errorMessage || '-' }}</td>
              <td>{{ errorCode.description || '-' }}</td>
              <td>{{ errorCode.solution || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="fei-doc-empty">暂无接口级错误码</div>
    </div>

    <div class="fei-doc-section">
      <div v-if="isDetailMode" class="fei-doc-section__head">
        <h3 class="fei-doc-heading">curl 调用示例</h3>
        <button
          class="fei-icon-btn"
          type="button"
          title="复制 curl 示例"
          @click="requestCopy(docDetail.curlExample || '')"
        >
          <slot name="copy-icon" />
        </button>
      </div>
      <h3 v-else class="fei-doc-heading">curl 调用示例</h3>
      <pre class="fei-code">{{ docDetail.curlExample || '暂无调用示例' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useInterfaceDoc } from '@/composables/useInterfaceDoc';
import type { InterfaceDocDetailVO, InterfaceDocParamVO } from '@/types/interfaceDoc';

/** 接口文档展示模式。 */
type InterfaceDocumentationMode = 'compact' | 'detail';

/** 接口文档展示组件属性。 */
interface InterfaceDocumentationProps {
  /** 接口文档聚合详情。 */
  docDetail: InterfaceDocDetailVO;
  /** 展示模式。 */
  mode?: InterfaceDocumentationMode;
}

/** 接口文档展示组件事件。 */
interface InterfaceDocumentationEmits {
  /** 请求复制指定文档文本。 */
  (event: 'copy-text', text: string): void;
}

const props = withDefaults(defineProps<InterfaceDocumentationProps>(), {
  mode: 'compact',
});
const emit = defineEmits<InterfaceDocumentationEmits>();

/** 当前是否为详情展示模式。 */
const isDetailMode = computed(() => props.mode === 'detail');

/** 当前选中的 JSON 示例标签。 */
const exampleTab = ref<'success' | 'fail'>('success');

/** 当前展示的 JSON 示例。 */
const activeExampleText = computed(() => {
  if (isDetailMode.value && exampleTab.value === 'fail') {
    return props.docDetail.doc?.failExample || '';
  }
  return props.docDetail.doc?.successExample || '';
});

/** 当前 JSON 示例为空时的提示。 */
const activeExampleEmptyText = computed(() => {
  if (!isDetailMode.value) return '暂无 JSON 返回示例';
  return exampleTab.value === 'fail' ? '暂无失败 JSON 示例' : '暂无成功 JSON 示例';
});

/** 当前 JSON 示例复制按钮标题。 */
const activeExampleCopyTitle = computed(() => (
  exampleTab.value === 'fail' ? '复制失败示例' : '复制成功示例'
));

/** 响应参数 ID 与字段名映射。 */
const responseParamNameMap = computed(() => new Map(
  (props.docDetail.responseParams || [])
    .filter((param) => param.id && param.name)
    .map((param) => [param.id as number, param.name as string]),
));

const {
  hasRows,
  hasText,
  requiredText,
  nullableText,
  rowKey,
  paramValue,
  headerRequiredText,
  headerDescription,
  requestParamDescription,
  prettyJson,
} = useInterfaceDoc();

/**
 * 将参数位置转换为面向使用者的名称。
 *
 * @param paramScene 参数位置
 * @returns 参数位置名称
 */
const paramSceneText = (paramScene?: string): string => {
  if (paramScene === 'QUERY') return '查询参数';
  if (paramScene === 'BODY') return '请求体';
  return paramScene || '-';
};

/**
 * 将响应参数父级 ID 转换为父级字段名。
 *
 * @param param 响应参数
 * @returns 父级字段名
 */
const parentFieldText = (param: InterfaceDocParamVO): string => {
  if (!param.parentId) return '-';
  return responseParamNameMap.value.get(param.parentId) || `未知字段（ID：${param.parentId}）`;
};

/**
 * 请求父组件复制指定文档文本。
 *
 * @param text 待复制文本
 */
const requestCopy = (text: string): void => {
  emit('copy-text', text);
};
</script>

<style scoped>
/* 保持详情页原有文档分区的垂直间距。 */
.fei-interface-documentation--detail {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.fei-interface-documentation--detail > .fei-doc-section {
  margin-top: 0;
}
</style>
