<template>
  <div class="fei-doc-editor">
    <div class="fei-doc-editor__topbar">
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="backToList">返回列表</button>
      <div class="fei-doc-editor__actions">
        <span v-if="dirty" class="fei-save-state">存在未保存修改</span>
        <button class="fei-btn fei-btn--primary fei-btn--sm" type="button" :disabled="!canSave" @click="saveDocument">
          {{ saving ? '保存中...' : '保存文档' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="fei-card fei-empty">正在加载接口文档...</div>
    <div v-else-if="loadError" class="fei-card fei-doc-editor__error" role="alert">
      <h2>文档加载失败</h2>
      <p>{{ loadError }}</p>
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="loadDocument">重新加载</button>
    </div>

    <template v-else-if="detail">
      <InterfaceDocSummary :detail="detail" :editable="editable" />

      <fieldset class="fei-doc-editor__fieldset" :disabled="!editable || saving">
        <DocumentMainInfoForm :model-value="form" :content-types="contentTypes" @update-field="updateMainField" />
        <RequestParamDescriptionList :params="requestParams" @update-param="updateRequestParam" />
        <ResponseParamEditor
          :params="responseParams"
          :param-types="paramTypes"
          @add="addResponseParam"
          @remove="removeResponseParam"
          @update-param="updateResponseParam"
        />
        <JsonExampleEditor
          :success-example="form.successExample"
          :fail-example="form.failExample"
          @update-example="updateJsonExample"
          @format="formatJson"
        />
        <ErrorCodeEditor
          :error-codes="errorCodes"
          @add="addErrorCode"
          @remove="removeErrorCode"
          @update-error-code="updateErrorCode"
        />
      </fieldset>

      <div class="fei-doc-editor__bottom-actions">
        <span v-if="saveError" class="fei-form-error" role="alert">{{ saveError }}</span>
        <button class="fei-btn fei-btn--primary" type="button" :disabled="!canSave" @click="saveDocument">
          {{ saving ? '保存中...' : '保存文档' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import DocumentMainInfoForm from '@/components/admin/doc/DocumentMainInfoForm.vue';
import ErrorCodeEditor from '@/components/admin/doc/ErrorCodeEditor.vue';
import InterfaceDocSummary from '@/components/admin/doc/InterfaceDocSummary.vue';
import JsonExampleEditor from '@/components/admin/doc/JsonExampleEditor.vue';
import RequestParamDescriptionList from '@/components/admin/doc/RequestParamDescriptionList.vue';
import ResponseParamEditor from '@/components/admin/doc/ResponseParamEditor.vue';
import { interfaceService } from '@/services/interfaceInfo';
import type {
  InterfaceDocDetailVO,
  InterfaceDocParamSaveRequest,
  InterfaceDocParamVO,
  InterfaceDocSaveRequest,
} from '@/types/interfaceDoc';
import type {
  DocMainEditableField,
  DocMainForm,
  EditableErrorCode,
  EditorFieldValue,
  ErrorCodeEditableField,
  JsonExampleField,
  RequestParamEditableField,
  ResponseParamEditableField,
} from '@/types/interfaceDocEditor';
const route = useRoute();
const router = useRouter();
const emit = defineEmits<{
  /** 页面 Toast 事件。 */
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

/** 支持的文档内容类型。 */
const contentTypes = [
  'application/json',
  'application/xml',
  'text/plain',
  'text/html',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'application/octet-stream',
];
/** 支持的接口参数类型。 */
const paramTypes = ['string', 'number', 'boolean', 'object', 'array'];
/** 页面加载状态。 */
const loading = ref(true);
/** 页面保存状态。 */
const saving = ref(false);
/** 文档加载错误。 */
const loadError = ref('');
/** 文档保存错误。 */
const saveError = ref('');
/** 接口文档聚合详情。 */
const detail = ref<InterfaceDocDetailVO | null>(null);
/** 运行时请求参数。 */
const requestParams = ref<InterfaceDocParamSaveRequest[]>([]);
/** 文档响应字段。 */
const responseParams = ref<InterfaceDocParamSaveRequest[]>([]);
/** 接口错误码。 */
const errorCodes = ref<EditableErrorCode[]>([]);
/** 最近加载或保存后的文档快照。 */
const baseline = ref('');
/** 新增记录稳定键序号。 */
const keySequence = ref(0);
/** 文档主信息表单。 */
const form = reactive<DocMainForm>({
  docVersion: 'v1',
  requestContentType: 'application/json',
  responseContentType: 'application/json',
  successExample: '',
  failExample: '',
  remark: '',
});
/** 当前路由接口 ID。 */
const interfaceInfoId = computed(() => Number(route.params.id));
/** 当前接口是否允许编辑。 */
const editable = computed(() => detail.value?.interfaceInfo.status === 0);
/** 当前编辑状态序列化快照。 */
const currentSnapshot = computed(() => JSON.stringify(buildSaveRequest()));
/** 当前页面是否存在未保存修改。 */
const dirty = computed(() => Boolean(detail.value) && currentSnapshot.value !== baseline.value);
/** 当前页面是否允许保存。 */
const canSave = computed(() => editable.value && !loading.value && !loadError.value && !saving.value && dirty.value);
/** 生成前端稳定键。 */
const nextClientKey = (prefix: string): string => `${prefix}-${Date.now()}-${++keySequence.value}`;
/** 将接口参数转换为保存请求，并保留父子关系。 */
const mapParams = (params: InterfaceDocParamVO[], scene: 'request' | 'response'): InterfaceDocParamSaveRequest[] => {
  const keyMap = new Map(params.filter((param) => param.id).map((param) => [param.id as number, `${scene}-${param.id}`]));
  return params.map((param, index) => ({
    paramKey: param.id ? `${scene}-${param.id}` : nextClientKey(scene),
    parentParamKey: param.parentId ? keyMap.get(param.parentId) : undefined,
    paramScene: scene === 'response' ? 'RESPONSE' : param.paramScene === 'QUERY' ? 'QUERY' : 'BODY',
    name: param.name ?? '',
    type: param.type ?? 'string',
    required: param.required ?? false,
    nullable: scene === 'response' ? (param.nullable ?? false) : param.nullable,
    defaultValue: param.defaultValue ?? '',
    exampleValue: param.exampleValue ?? '',
    description: param.description ?? '',
    validationRule: param.validationRule ?? '',
    sortOrder: param.sortOrder ?? index + 1,
  }));
};

/** 加载接口文档并初始化编辑快照。 */
const loadDocument = async (): Promise<void> => {
  if (!Number.isInteger(interfaceInfoId.value) || interfaceInfoId.value <= 0) {
    loadError.value = '接口 ID 无效';
    loading.value = false;
    return;
  }
  loading.value = true;
  loadError.value = '';
  saveError.value = '';
  try {
    const data = await interfaceService.getDocDetail(interfaceInfoId.value);
    detail.value = data;
    Object.assign(form, {
      docVersion: data.doc?.docVersion ?? 'v1',
      requestContentType: data.doc?.requestContentType ?? 'application/json',
      responseContentType: data.doc?.responseContentType ?? 'application/json',
      successExample: data.doc?.successExample ?? '',
      failExample: data.doc?.failExample ?? '',
      remark: data.doc?.remark ?? '',
    });
    requestParams.value = mapParams(data.requestParams ?? [], 'request');
    responseParams.value = mapParams(data.responseParams ?? [], 'response');
    errorCodes.value = (data.errorCodes ?? []).map((item, index) => ({
      clientKey: item.id ? `error-${item.id}` : nextClientKey('error'),
      errorCode: item.errorCode ?? '',
      errorMessage: item.errorMessage ?? '',
      description: item.description ?? '',
      solution: item.solution ?? '',
      sortOrder: item.sortOrder ?? index + 1,
    }));
    baseline.value = JSON.stringify(buildSaveRequest());
  } catch (error) {
    detail.value = null;
    loadError.value = error instanceof Error ? error.message : '接口文档加载失败';
  } finally {
    loading.value = false;
  }
};

/** 构建文档聚合保存请求。 */
const buildSaveRequest = (): InterfaceDocSaveRequest => ({
  interfaceInfoId: interfaceInfoId.value,
  docVersion: form.docVersion,
  requestContentType: form.requestContentType,
  responseContentType: form.responseContentType,
  successExample: form.successExample,
  failExample: form.failExample,
  remark: form.remark,
  params: [...requestParams.value, ...responseParams.value].map(({ ...param }) => ({
    ...param,
    parentParamKey: param.parentParamKey || undefined,
  })),
  errorCodes: errorCodes.value.map(({ clientKey: _clientKey, ...errorCode }) => errorCode),
});

/** 校验表单中的必填字段。 */
const validateForm = (): string => {
  if (!form.docVersion || !form.requestContentType || !form.responseContentType) return '文档版本和内容格式不能为空';
  if (responseParams.value.some((param) => !param.name || !param.type)) return '响应字段名称和类型不能为空';
  if (errorCodes.value.some((item) => !item.errorCode || !item.errorMessage)) return '错误码和错误信息不能为空';
  return '';
};

/** 保存结构化接口文档。 */
const saveDocument = async (): Promise<void> => {
  const validationMessage = validateForm();
  if (validationMessage) {
    saveError.value = validationMessage;
    return;
  }
  saving.value = true;
  saveError.value = '';
  try {
    await interfaceService.saveDoc(buildSaveRequest());
    await loadDocument();
    emit('show-toast', '接口文档已保存', 'success');
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : '接口文档保存失败';
  } finally {
    saving.value = false;
  }
};

/** 更新文档主信息字段。 */
const updateMainField = (field: DocMainEditableField, value: string): void => {
  form[field] = value;
};

/** 更新运行时请求参数说明字段。 */
const updateRequestParam = (paramKey: string, field: RequestParamEditableField, value: string | number): void => {
  const param = requestParams.value.find((item) => item.paramKey === paramKey);
  if (param) Object.assign(param, { [field]: value });
};

/** 更新响应字段。 */
const updateResponseParam = (paramKey: string, field: ResponseParamEditableField, value: EditorFieldValue): void => {
  const param = responseParams.value.find((item) => item.paramKey === paramKey);
  if (param) Object.assign(param, { [field]: value });
};

/** 更新 JSON 示例。 */
const updateJsonExample = (field: JsonExampleField, value: string): void => {
  form[field] = value;
};

/** 更新错误码字段。 */
const updateErrorCode = (clientKey: string, field: ErrorCodeEditableField, value: string | number): void => {
  const errorCode = errorCodes.value.find((item) => item.clientKey === clientKey);
  if (errorCode) Object.assign(errorCode, { [field]: value });
};

/** 新增响应字段。 */
const addResponseParam = (): void => {
  responseParams.value.push({
    paramKey: nextClientKey('response'),
    paramScene: 'RESPONSE',
    name: '',
    type: 'string',
    required: false,
    nullable: true,
    defaultValue: '',
    exampleValue: '',
    description: '',
    validationRule: '',
    sortOrder: responseParams.value.length + 1,
  });
};

/** 删除响应字段及引用该字段父级关系的配置。 */
const removeResponseParam = (paramKey: string): void => {
  responseParams.value = responseParams.value
    .filter((param) => param.paramKey !== paramKey)
    .map((param) => param.parentParamKey === paramKey ? { ...param, parentParamKey: undefined } : param);
};

/** 新增接口错误码。 */
const addErrorCode = (): void => {
  errorCodes.value.push({
    clientKey: nextClientKey('error'),
    errorCode: '',
    errorMessage: '',
    description: '',
    solution: '',
    sortOrder: errorCodes.value.length + 1,
  });
};

/** 删除接口错误码。 */
const removeErrorCode = (clientKey: string): void => {
  errorCodes.value = errorCodes.value.filter((item) => item.clientKey !== clientKey);
};

/** 格式化 JSON 示例。 */
const formatJson = (field: JsonExampleField): void => {
  const value = form[field].trim();
  if (!value) return;
  try {
    form[field] = JSON.stringify(JSON.parse(value), null, 2);
    saveError.value = '';
  } catch {
    saveError.value = field === 'successExample' ? '成功响应示例不是合法 JSON' : '失败响应示例不是合法 JSON';
  }
};

/** 返回接口列表。 */
const backToList = () => router.push({ name: 'admin-interfaces' });

/** 确认是否允许离开存在未保存修改的页面。 */
const confirmLeave = (): boolean => !dirty.value || window.confirm('当前文档存在未保存修改，确定离开吗？');

/** 处理浏览器关闭或刷新。 */
const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = '';
};

onBeforeRouteLeave(confirmLeave);
onBeforeRouteUpdate(confirmLeave);
watch(interfaceInfoId, async (current, previous) => {
  if (current !== previous) await loadDocument();
});
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  void loadDocument();
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
</script>
