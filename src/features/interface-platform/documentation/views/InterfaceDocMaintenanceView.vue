<template>
  <div class="fei-doc-editor">
    <div class="fei-doc-editor__topbar">
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="backToList">返回列表</button>
      <div v-if="editable" class="fei-doc-editor__actions">
        <span v-if="dirty" class="fei-save-state">存在未保存修改</span>
        <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" :disabled="!canSaveDraft" @click="saveDocument('DRAFT')">
          {{ saving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="fei-btn fei-btn--primary fei-btn--sm" type="button" :disabled="!canComplete" @click="saveDocument('READY')">
          {{ saving ? '保存中...' : '完成维护' }}
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
        <SystemRequestHeaderSummary :request-content-type="form.requestContentType" />
        <RequestParamDescriptionList :params="requestParams" @update-param="updateRequestParam" />
        <ResponseParamEditor
          :params="responseParams"
          :param-types="paramTypes"
          :request-param-count="requestParams.length"
          @add="addResponseParam"
          @remove="removeResponseParam"
          @update-param="updateResponseParam"
        />
        <ResponseFieldDeleteDialog
          :open="Boolean(responseFieldDeleteState)"
          :target-path="responseFieldDeleteState?.targetPath ?? ''"
          :descendant-paths="responseFieldDeleteState?.descendantPaths ?? []"
          :error-message="responseFieldDeleteError"
          @delete-subtree="confirmDeleteResponseSubtree"
          @promote-children="confirmPromoteResponseChildren"
          @cancel="cancelResponseFieldDelete"
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

      <div v-if="editable" class="fei-doc-editor__bottom-actions">
        <div>
          <span v-if="saveError" class="fei-form-error" role="alert">{{ saveError }}</span>
          <BoundaryRemaining :current="aggregatePayloadBytes" :max="INTERFACE_DOC_LIMITS.aggregateSaveBodyBytes" unit="字节" />
        </div>
        <div class="fei-doc-editor__actions">
          <button class="fei-btn fei-btn--secondary" type="button" :disabled="!canSaveDraft" @click="saveDocument('DRAFT')">
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button class="fei-btn fei-btn--primary" type="button" :disabled="!canComplete" @click="saveDocument('READY')">
            {{ saving ? '保存中...' : '完成维护' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import DocumentMainInfoForm from '@/features/interface-platform/documentation/components/DocumentMainInfoForm.vue';
import BoundaryRemaining from '@/components/common/BoundaryRemaining.vue';
import ErrorCodeEditor from '@/features/interface-platform/documentation/components/ErrorCodeEditor.vue';
import InterfaceDocSummary from '@/features/interface-platform/documentation/components/InterfaceDocSummary.vue';
import JsonExampleEditor from '@/features/interface-platform/documentation/components/JsonExampleEditor.vue';
import RequestParamDescriptionList from '@/features/interface-platform/documentation/components/RequestParamDescriptionList.vue';
import ResponseFieldDeleteDialog from '@/features/interface-platform/documentation/components/ResponseFieldDeleteDialog.vue';
import ResponseParamEditor from '@/features/interface-platform/documentation/components/ResponseParamEditor.vue';
import SystemRequestHeaderSummary from '@/features/interface-platform/documentation/components/SystemRequestHeaderSummary.vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import { interfaceService } from '@/services/interfaceInfo';
import type {
  InterfaceDocDetailVO,
  InterfaceDocParamSaveRequest,
  InterfaceDocParamVO,
  InterfaceDocSaveRequest,
  InterfaceDocStatus,
} from '@/features/interface-platform/documentation/types/interfaceDoc';
import type {
  DocMainEditableField,
  DocMainForm,
  EditableErrorCode,
  EditorFieldValue,
  ErrorCodeEditableField,
  JsonExampleField,
  RequestParamEditableField,
  ResponseFieldDeleteState,
  ResponseParamEditableField,
} from '@/features/interface-platform/documentation/types/interfaceDocEditor';
import {
  deleteResponseFieldSubtree,
  getResponseFieldDescendants,
  getResponseFieldPath,
  promoteResponseFieldChildren,
  validateResponseFieldTree,
} from '@/features/interface-platform/documentation/utils/responseFieldTree';
import { formatJsonPreservingNumbers } from '@/utils/jsonFormatter';
import { jsonPayloadByteLength, unicodeCodePointLength, utf8ByteLength } from '@/utils/textSize';
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
/** 响应字段快照操作上下文。 */
type SnapshotContext = 'dialog' | 'inline';
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
/** 当前非叶子响应字段删除状态。 */
const responseFieldDeleteState = ref<ResponseFieldDeleteState | null>(null);
/** 非叶子响应字段删除操作错误。 */
const responseFieldDeleteError = ref('');
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
const currentSnapshot = computed(() => JSON.stringify(buildSaveRequest(detail.value?.docStatus ?? 'DRAFT')));
/** 当前聚合保存载荷的 UTF-8 字节数。 */
const aggregatePayloadBytes = computed(() => utf8ByteLength(currentSnapshot.value));
/** 当前页面是否存在未保存修改。 */
const dirty = computed(() => Boolean(detail.value) && currentSnapshot.value !== baseline.value);
/** 当前页面是否允许保存。 */
const canOperate = computed(() => editable.value && !loading.value && !loadError.value && !saving.value);
/** 当前页面是否允许保存草稿。 */
const canSaveDraft = computed(() => canOperate.value && dirty.value);
/** 当前页面是否允许完成维护。 */
const canComplete = computed(() => canOperate.value && (dirty.value || detail.value?.docStatus === 'DRAFT'));
/** 生成前端稳定键。 */
const nextClientKey = (prefix: string): string => `${prefix}-${Date.now()}-${++keySequence.value}`;
/** 校验聚合详情是否包含全部可替换集合。 */
const validateCompleteCollectionSnapshot = (data: InterfaceDocDetailVO): void => {
  if (!Array.isArray(data.requestParams)
    || !Array.isArray(data.responseParams)
    || !Array.isArray(data.errorCodes)) {
    throw new Error('接口文档聚合数据不完整，请重新加载');
  }
};
/** 将接口参数转换为保存请求，并保留父子关系。 */
const mapParams = (params: InterfaceDocParamVO[], scene: 'request' | 'response'): InterfaceDocParamSaveRequest[] => {
  const keyMap = new Map(params.filter((param) => param.id).map((param) => [param.id as number, `${scene}-${param.id}`]));
  const missingParentKeyMap = new Map<number, string>();
  return params.map((param, index) => {
    let parentParamKey = param.parentId ? keyMap.get(param.parentId) : undefined;
    if (scene === 'response' && param.parentId && parentParamKey === undefined) {
      parentParamKey = missingParentKeyMap.get(param.parentId);
      if (!parentParamKey) {
        parentParamKey = nextClientKey('response-missing-parent');
        missingParentKeyMap.set(param.parentId, parentParamKey);
      }
    }
    const nullable = scene === 'response' ? (param.nullable ?? false) : false;
    return {
      paramKey: param.id ? `${scene}-${param.id}` : nextClientKey(scene),
      ...(parentParamKey !== undefined ? { parentParamKey } : {}),
      paramScene: scene === 'response' ? 'RESPONSE' : param.paramScene === 'QUERY' ? 'QUERY' : 'BODY',
      name: param.name ?? '',
      type: param.type ?? 'string',
      required: param.required ?? false,
      ...(nullable !== undefined ? { nullable } : {}),
      ...(scene === 'request' ? { exampleValue: param.exampleValue ?? '' } : {}),
      description: param.description ?? '',
      ...(scene === 'request' ? { validationRule: param.validationRule ?? '' } : {}),
      sortOrder: param.sortOrder ?? index + 1,
    };
  });
};

/** 加载接口文档并初始化编辑快照。 */
const loadDocument = async (): Promise<boolean> => {
  if (!Number.isInteger(interfaceInfoId.value) || interfaceInfoId.value <= 0) {
    loadError.value = '接口 ID 无效';
    loading.value = false;
    return false;
  }
  loading.value = true;
  loadError.value = '';
  saveError.value = '';
  try {
    const data = await interfaceService.getDocDetail(interfaceInfoId.value);
    validateCompleteCollectionSnapshot(data);
    const loadedForm: DocMainForm = {
      docVersion: data.doc?.docVersion ?? 'v1',
      requestContentType: data.doc?.requestContentType ?? 'application/json',
      responseContentType: data.doc?.responseContentType ?? 'application/json',
      successExample: data.doc?.successExample ?? '',
      failExample: data.doc?.failExample ?? '',
      remark: data.doc?.remark ?? '',
    };
    const loadedRequestParams = mapParams(data.requestParams, 'request');
    const loadedResponseParams = mapParams(data.responseParams, 'response');
    const loadedErrorCodes = data.errorCodes.map((item, index) => ({
      clientKey: item.id ? `error-${item.id}` : nextClientKey('error'),
      errorCode: item.errorCode ?? '',
      errorMessage: item.errorMessage ?? '',
      description: item.description ?? '',
      solution: item.solution ?? '',
      sortOrder: item.sortOrder ?? index + 1,
    }));
    const loadedBaseline = JSON.stringify(buildSaveRequestFromModel(
      data.docStatus,
      loadedForm,
      loadedRequestParams,
      loadedResponseParams,
      loadedErrorCodes,
    ));

    detail.value = data;
    Object.assign(form, loadedForm);
    requestParams.value = loadedRequestParams;
    responseParams.value = loadedResponseParams;
    responseFieldDeleteState.value = null;
    responseFieldDeleteError.value = '';
    errorCodes.value = loadedErrorCodes;
    baseline.value = loadedBaseline;
    return true;
  } catch (error) {
    detail.value = null;
    loadError.value = error instanceof Error ? error.message : '接口文档加载失败';
    return false;
  } finally {
    loading.value = false;
  }
};

/** 根据指定编辑模型构建文档聚合保存请求。 */
const buildSaveRequestFromModel = (
  docStatus: InterfaceDocStatus,
  mainForm: DocMainForm,
  requestParamSnapshot: InterfaceDocParamSaveRequest[],
  responseParamSnapshot: InterfaceDocParamSaveRequest[],
  errorCodeSnapshot: EditableErrorCode[],
): InterfaceDocSaveRequest => ({
  interfaceInfoId: interfaceInfoId.value,
  docStatus,
  docVersion: mainForm.docVersion,
  requestContentType: mainForm.requestContentType,
  responseContentType: mainForm.responseContentType,
  successExample: mainForm.successExample,
  failExample: mainForm.failExample,
  remark: mainForm.remark,
  params: [...requestParamSnapshot, ...responseParamSnapshot].map(({ parentParamKey, ...param }) => (
    parentParamKey ? { ...param, parentParamKey } : param
  )),
  errorCodes: errorCodeSnapshot.map(({ clientKey: _clientKey, ...errorCode }) => errorCode),
});

/** 构建当前页面的文档聚合保存请求。 */
const buildSaveRequest = (docStatus: InterfaceDocStatus): InterfaceDocSaveRequest => buildSaveRequestFromModel(
  docStatus,
  form,
  requestParams.value,
  responseParams.value,
  errorCodes.value,
);

/** 校验单个文档参数的普通文本边界。 */
const validateParamBoundaries = (param: InterfaceDocParamSaveRequest): string => {
  if (unicodeCodePointLength(param.name) > INTERFACE_DOC_LIMITS.paramNameLength) return '参数名称长度不能超过 128 个字符';
  if (unicodeCodePointLength(param.exampleValue) > INTERFACE_DOC_LIMITS.exampleValueLength) return '参数示例值长度不能超过 1024 个字符';
  if (unicodeCodePointLength(param.description) > INTERFACE_DOC_LIMITS.descriptionLength) return '参数说明长度不能超过 512 个字符';
  if (unicodeCodePointLength(param.validationRule) > INTERFACE_DOC_LIMITS.descriptionLength) return '校验规则长度不能超过 512 个字符';
  return '';
};

/** 校验表单中的数量、文本、字节和必填字段。 */
const validateForm = (targetStatus: InterfaceDocStatus): string => {
  if (requestParams.value.length > INTERFACE_DOC_LIMITS.requestParamCount) return '请求参数数量不能超过 100';
  if (responseParams.value.length > INTERFACE_DOC_LIMITS.responseParamCount) return '响应字段数量不能超过 200';
  if (requestParams.value.length + responseParams.value.length > INTERFACE_DOC_LIMITS.totalParamCount) {
    return '请求参数与响应字段合计数量不能超过 200';
  }
  if (errorCodes.value.length > INTERFACE_DOC_LIMITS.errorCodeCount) return '错误码数量不能超过 100';
  if (unicodeCodePointLength(form.remark) > INTERFACE_DOC_LIMITS.descriptionLength) return '文档备注长度不能超过 512 个字符';
  if (utf8ByteLength(form.successExample) > INTERFACE_DOC_LIMITS.jsonExampleBytes) return '成功响应示例不能超过 65535 个 UTF-8 字节';
  if (utf8ByteLength(form.failExample) > INTERFACE_DOC_LIMITS.jsonExampleBytes) return '失败响应示例不能超过 65535 个 UTF-8 字节';
  const invalidParamBoundary = [...requestParams.value, ...responseParams.value]
    .map(validateParamBoundaries)
    .find(Boolean);
  if (invalidParamBoundary) return invalidParamBoundary;
  const invalidErrorCodeBoundary = errorCodes.value.map((item) => {
    if (unicodeCodePointLength(item.errorCode) > INTERFACE_DOC_LIMITS.errorCodeLength) return '错误码长度不能超过 64 个字符';
    if (unicodeCodePointLength(item.errorMessage) > INTERFACE_DOC_LIMITS.errorMessageLength) return '错误信息长度不能超过 256 个字符';
    if (unicodeCodePointLength(item.description) > INTERFACE_DOC_LIMITS.descriptionLength) return '错误说明长度不能超过 512 个字符';
    if (unicodeCodePointLength(item.solution) > INTERFACE_DOC_LIMITS.descriptionLength) return '解决建议长度不能超过 512 个字符';
    return '';
  }).find(Boolean);
  if (invalidErrorCodeBoundary) return invalidErrorCodeBoundary;
  if (!form.docVersion || !form.requestContentType || !form.responseContentType) return '文档版本和内容格式不能为空';
  if (responseParams.value.some((param) => !param.name || !param.type)) return '响应字段名称和类型不能为空';
  const responseTreeValidation = validateResponseFieldTree(responseParams.value);
  if (!responseTreeValidation.valid) return responseTreeValidation.message;
  if (errorCodes.value.some((item) => !item.errorCode || !item.errorMessage)) return '错误码和错误信息不能为空';
  const errorCodeCompareKeys = new Set<string>();
  if (errorCodes.value.some((item) => {
    const compareKey = item.errorCode.trim().toLowerCase();
    if (!compareKey) return false;
    if (errorCodeCompareKeys.has(compareKey)) return true;
    errorCodeCompareKeys.add(compareKey);
    return false;
  })) return '同一接口的错误码不能重复';
  const invalidJsonField = ([
    ['成功响应示例', form.successExample],
    ['失败响应示例', form.failExample],
  ] as const).find(([, value]) => {
    if (!value.trim()) return false;
    try {
      JSON.parse(value);
      return false;
    } catch {
      return true;
    }
  });
  if (invalidJsonField) return `${invalidJsonField[0]}不是合法 JSON`;
  if (jsonPayloadByteLength(buildSaveRequest(targetStatus)) > INTERFACE_DOC_LIMITS.aggregateSaveBodyBytes) {
    return '接口文档保存请求体不能超过 1048576 字节';
  }
  if (targetStatus === 'DRAFT') return '';
  if (requestParams.value.some((param) => {
    const description = param.description?.trim() ?? '';
    return !description || description === '由接口运行时参数模板自动生成';
  })) return '请求参数必须填写有效的公开说明';
  const incompleteResponseParam = responseParams.value.find((param) => !param.description?.trim());
  if (incompleteResponseParam) return `响应字段 ${incompleteResponseParam.name} 必须填写有效的公开说明`;
  if (form.responseContentType.toLowerCase() === 'application/json' && !form.successExample.trim()) {
    return 'JSON 响应必须填写成功响应示例';
  }
  return '';
};

/** 保存前格式化非空 JSON 示例，并保留非法原值。 */
const formatJsonExamplesBeforeSave = (): string => {
  const fields: JsonExampleField[] = ['successExample', 'failExample'];
  const formattedValues: Partial<Record<JsonExampleField, string>> = {};
  for (const field of fields) {
    const value = form[field].trim();
    if (!value) continue;
    try {
      formattedValues[field] = formatJsonPreservingNumbers(value);
    } catch {
      return field === 'successExample' ? '成功响应示例不是合法 JSON' : '失败响应示例不是合法 JSON';
    }
  }
  fields.forEach((field) => {
    const formattedValue = formattedValues[field];
    if (formattedValue !== undefined) form[field] = formattedValue;
  });
  return '';
};

/** 保存结构化接口文档。 */
const saveDocument = async (targetStatus: InterfaceDocStatus): Promise<void> => {
  if (saving.value) return;
  const jsonFormatMessage = formatJsonExamplesBeforeSave();
  if (jsonFormatMessage) {
    saveError.value = jsonFormatMessage;
    return;
  }
  const validationMessage = validateForm(targetStatus);
  if (validationMessage) {
    saveError.value = validationMessage;
    return;
  }
  saving.value = true;
  saveError.value = '';
  try {
    await interfaceService.saveDoc(buildSaveRequest(targetStatus));
    const reloaded = await loadDocument();
    if (!reloaded) {
      loadError.value = '文档已保存，但重新加载后端数据失败，请重新加载';
      return;
    }
    emit('show-toast', targetStatus === 'READY' ? '文档维护已完成' : '草稿已保存', 'success');
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
  if (!param) return;
  if (field !== 'type' && field !== 'parentParamKey') {
    Object.assign(param, { [field]: value });
    return;
  }
  const candidate = responseParams.value.map((item) => {
    if (item.paramKey !== paramKey) return { ...item };
    if (field === 'parentParamKey' && !value) {
      const { parentParamKey: _parentParamKey, ...rootField } = item;
      return rootField;
    }
    return { ...item, [field]: value };
  });
  const validation = validateResponseFieldTree(candidate);
  if (!validation.valid) {
    saveError.value = validation.message;
    return;
  }
  responseParams.value = candidate;
  saveError.value = '';
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
  if (responseParams.value.length >= INTERFACE_DOC_LIMITS.responseParamCount) {
    saveError.value = '响应字段数量不能超过 200';
    return;
  }
  if (requestParams.value.length + responseParams.value.length >= INTERFACE_DOC_LIMITS.totalParamCount) {
    saveError.value = '请求参数与响应字段合计数量不能超过 200';
    return;
  }
  responseParams.value.push({
    paramKey: nextClientKey('response'),
    paramScene: 'RESPONSE',
    name: '',
    type: 'string',
    required: false,
    nullable: true,
    description: '',
    sortOrder: responseParams.value.length + 1,
  });
};

/** 请求删除响应字段。 */
const removeResponseParam = (paramKey: string): void => {
  const descendants = getResponseFieldDescendants(responseParams.value, paramKey);
  if (!descendants.length) {
    applyResponseFieldSnapshot(deleteResponseFieldSubtree(responseParams.value, paramKey), 'inline');
    return;
  }
  responseFieldDeleteState.value = {
    paramKey,
    targetPath: getResponseFieldPath(responseParams.value, paramKey),
    descendantPaths: descendants.map((field) => getResponseFieldPath(responseParams.value, field.paramKey)),
  };
  responseFieldDeleteError.value = '';
};

/** 校验并应用响应字段树候选快照。 */
const applyResponseFieldSnapshot = (
  candidate: InterfaceDocParamSaveRequest[],
  context: SnapshotContext,
): boolean => {
  const validation = validateResponseFieldTree(candidate);
  if (!validation.valid) {
    if (context === 'dialog') responseFieldDeleteError.value = validation.message;
    else saveError.value = validation.message;
    return false;
  }
  responseParams.value = candidate;
  saveError.value = '';
  responseFieldDeleteError.value = '';
  return true;
};

/** 确认删除当前响应字段及全部后代。 */
const confirmDeleteResponseSubtree = (): void => {
  const state = responseFieldDeleteState.value;
  if (!state) return;
  const candidate = deleteResponseFieldSubtree(responseParams.value, state.paramKey);
  if (applyResponseFieldSnapshot(candidate, 'dialog')) responseFieldDeleteState.value = null;
};

/** 确认删除当前响应字段并提升直接子字段。 */
const confirmPromoteResponseChildren = (): void => {
  const state = responseFieldDeleteState.value;
  if (!state) return;
  const candidate = promoteResponseFieldChildren(responseParams.value, state.paramKey);
  if (applyResponseFieldSnapshot(candidate, 'dialog')) responseFieldDeleteState.value = null;
};

/** 取消删除非叶子响应字段。 */
const cancelResponseFieldDelete = (): void => {
  responseFieldDeleteState.value = null;
  responseFieldDeleteError.value = '';
};

/** 新增接口错误码。 */
const addErrorCode = (): void => {
  if (errorCodes.value.length >= INTERFACE_DOC_LIMITS.errorCodeCount) {
    saveError.value = '错误码数量不能超过 100';
    return;
  }
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
    form[field] = formatJsonPreservingNumbers(value);
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
