<template>
  <div class="fei-invoke-doc">
    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">请求 Header</h3>
      <div v-if="hasRows(docDetail.requestHeaders)" class="fei-table-wrap fei-doc-table-wrap">
        <table class="fei-table fei-doc-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>必填</th>
              <th>值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.requestHeaders" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
              <td>{{ headerRequiredText(param) }}</td>
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
              <th>名称</th>
              <th>必填</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.requestParams" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
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
              <th>字段名</th>
              <th>类型</th>
              <th>可能为空</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in docDetail.responseParams" :key="rowKey(param)">
              <td><span class="fei-doc-param-name">{{ param.name || '-' }}</span></td>
              <td>{{ param.type || '-' }}</td>
              <td>{{ nullableText(param.nullable) }}</td>
              <td>{{ param.description || param.exampleValue || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="fei-doc-empty">暂无响应字段说明</div>
    </div>

    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">JSON 返回示例</h3>
      <pre v-if="hasText(docDetail.doc?.successExample)" class="fei-code">{{ prettyJson(docDetail.doc?.successExample, '{}') }}</pre>
      <div v-else class="fei-doc-empty">暂无 JSON 返回示例</div>
    </div>

    <div class="fei-doc-section">
      <h3 class="fei-doc-heading">curl 调用示例</h3>
      <pre class="fei-code">{{ docDetail.curlExample || '暂无调用示例' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInterfaceDoc } from '@/composables/useInterfaceDoc';
import type { InterfaceDocDetailVO } from '@/types/api';

/** 接口文档展示组件属性。 */
interface InterfaceDocumentationProps {
  /** 接口文档聚合详情。 */
  docDetail: InterfaceDocDetailVO;
}

defineProps<InterfaceDocumentationProps>();

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
</script>
