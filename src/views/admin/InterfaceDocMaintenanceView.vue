<template>
  <div class="fei-doc-editor">
    <div class="fei-doc-editor__topbar">
      <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="backToList">返回列表</button>
      <div class="fei-doc-editor__actions">
        <span v-if="dirty" class="fei-save-state">存在未保存修改</span>
        <button
          class="fei-btn fei-btn--primary fei-btn--sm"
          type="button"
          :disabled="!canSave"
          @click="saveDocument"
        >
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
      <section class="fei-doc-summary">
        <div class="fei-doc-summary__identity">
          <span class="fei-method-badge">{{ detail.interfaceInfo.method || 'HTTP' }}</span>
          <div>
            <p class="fei-doc-summary__path">{{ detail.interfaceInfo.path || '-' }}</p>
            <h1>{{ detail.interfaceInfo.name }}</h1>
          </div>
        </div>
        <div class="fei-doc-summary__meta">
          <div><span>当前状态</span><strong>{{ getInterfaceStatusText(detail.interfaceInfo.status) }}</strong></div>
          <div><span>配额类型</span><strong>{{ getQuotaTypeText(detail.interfaceInfo.quotaType, detail.interfaceInfo.quotaTypeText) }}</strong></div>
          <div><span>SDK 方法</span><strong>{{ detail.interfaceInfo.sdkMethodName || '-' }}</strong></div>
        </div>
        <p v-if="!editable" class="fei-doc-summary__notice">
          当前接口不可编辑。请先返回接口列表执行下线操作，再维护运行时配置或接口文档。
        </p>
      </section>

      <fieldset class="fei-doc-editor__fieldset" :disabled="!editable || saving">
        <section class="fei-doc-section">
          <div class="fei-doc-section__heading">
            <div><span>01</span><h2>文档主信息</h2></div>
            <p>版本、内容格式和面向调用方的公开备注</p>
          </div>
          <div class="fei-form-grid fei-form-grid--three">
            <label class="fei-field">
              <span class="fei-label">文档版本</span>
              <input v-model.trim="form.docVersion" class="fei-input" maxlength="64" required />
            </label>
            <label class="fei-field">
              <span class="fei-label">请求格式</span>
              <select v-model="form.requestContentType" class="fei-select">
                <option v-for="type in contentTypes" :key="`request-${type}`" :value="type">{{ type }}</option>
              </select>
            </label>
            <label class="fei-field">
              <span class="fei-label">响应格式</span>
              <select v-model="form.responseContentType" class="fei-select">
                <option v-for="type in contentTypes" :key="`response-${type}`" :value="type">{{ type }}</option>
              </select>
            </label>
          </div>
          <label class="fei-field">
            <span class="fei-label">公开备注</span>
            <textarea v-model.trim="form.remark" class="fei-textarea fei-textarea--compact" maxlength="512"></textarea>
          </label>
        </section>

        <section class="fei-doc-section">
          <div class="fei-doc-section__heading">
            <div><span>02</span><h2>请求参数说明</h2></div>
            <p>名称、位置、类型和必填性来自运行时模板，仅维护说明性内容</p>
          </div>
          <div v-if="!requestParams.length" class="fei-doc-empty">当前接口没有运行时请求参数</div>
          <div v-else class="fei-doc-param-list">
            <article v-for="param in requestParams" :key="param.paramKey" class="fei-doc-param-row">
              <div class="fei-doc-param-row__identity">
                <strong>{{ param.name }}</strong>
                <span>{{ param.paramScene }} · {{ param.type }} · {{ param.required ? '必填' : '选填' }}</span>
              </div>
              <label class="fei-field"><span class="fei-label">说明</span><input v-model.trim="param.description" class="fei-input" maxlength="512" /></label>
              <label class="fei-field"><span class="fei-label">示例值</span><input v-model="param.exampleValue" class="fei-input" maxlength="1024" /></label>
              <label class="fei-field"><span class="fei-label">默认值</span><input v-model="param.defaultValue" class="fei-input" maxlength="512" /></label>
              <label class="fei-field"><span class="fei-label">校验规则</span><input v-model.trim="param.validationRule" class="fei-input" maxlength="512" /></label>
              <label class="fei-field fei-field--sort"><span class="fei-label">排序</span><input v-model.number="param.sortOrder" class="fei-input" type="number" /></label>
            </article>
          </div>
        </section>

        <section class="fei-doc-section">
          <div class="fei-doc-section__heading fei-doc-section__heading--action">
            <div><span>03</span><h2>响应字段</h2></div>
            <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="addResponseParam">新增字段</button>
          </div>
          <div v-if="!responseParams.length" class="fei-doc-empty">暂未维护响应字段</div>
          <div v-else class="fei-doc-record-list">
            <article v-for="param in responseParams" :key="param.paramKey" class="fei-doc-record">
              <div class="fei-doc-record__toolbar">
                <strong>{{ param.name || '未命名字段' }}</strong>
                <button type="button" class="fei-action-btn fei-action-btn--danger" @click="removeResponseParam(param.paramKey)">删除</button>
              </div>
              <div class="fei-form-grid fei-form-grid--four">
                <label class="fei-field"><span class="fei-label">字段名</span><input v-model.trim="param.name" class="fei-input" maxlength="128" required /></label>
                <label class="fei-field"><span class="fei-label">类型</span><select v-model="param.type" class="fei-select"><option v-for="type in paramTypes" :key="type" :value="type">{{ type }}</option></select></label>
                <label class="fei-field"><span class="fei-label">父字段</span><select v-model="param.parentParamKey" class="fei-select"><option value="">根节点</option><option v-for="parent in parentOptions(param.paramKey)" :key="parent.paramKey" :value="parent.paramKey">{{ parent.name || '未命名字段' }}</option></select></label>
                <label class="fei-field"><span class="fei-label">排序</span><input v-model.number="param.sortOrder" class="fei-input" type="number" /></label>
              </div>
              <div class="fei-inline-checks">
                <label><input v-model="param.required" type="checkbox" /> 字段必须出现</label>
                <label><input v-model="param.nullable" type="checkbox" /> 允许空值</label>
              </div>
              <div class="fei-form-grid fei-form-grid--two">
                <label class="fei-field"><span class="fei-label">字段说明</span><input v-model.trim="param.description" class="fei-input" maxlength="512" /></label>
                <label class="fei-field"><span class="fei-label">示例值</span><input v-model="param.exampleValue" class="fei-input" maxlength="1024" /></label>
                <label class="fei-field"><span class="fei-label">默认值</span><input v-model="param.defaultValue" class="fei-input" maxlength="512" /></label>
                <label class="fei-field"><span class="fei-label">校验规则</span><input v-model.trim="param.validationRule" class="fei-input" maxlength="512" /></label>
              </div>
            </article>
          </div>
        </section>

        <section class="fei-doc-section">
          <div class="fei-doc-section__heading">
            <div><span>04</span><h2>JSON 示例</h2></div>
            <p>示例只能使用模拟数据或固定脱敏占位符</p>
          </div>
          <div class="fei-form-grid fei-form-grid--two">
            <label class="fei-field">
              <span class="fei-label-row"><span class="fei-label">成功响应示例</span><button type="button" @click="formatJson('successExample')">格式化</button></span>
              <textarea v-model="form.successExample" class="fei-textarea fei-code-input" spellcheck="false"></textarea>
            </label>
            <label class="fei-field">
              <span class="fei-label-row"><span class="fei-label">失败响应示例</span><button type="button" @click="formatJson('failExample')">格式化</button></span>
              <textarea v-model="form.failExample" class="fei-textarea fei-code-input" spellcheck="false"></textarea>
            </label>
          </div>
        </section>

        <section class="fei-doc-section">
          <div class="fei-doc-section__heading fei-doc-section__heading--action">
            <div><span>05</span><h2>接口错误码</h2></div>
            <button class="fei-btn fei-btn--secondary fei-btn--sm" type="button" @click="addErrorCode">新增错误码</button>
          </div>
          <div v-if="!errorCodes.length" class="fei-doc-empty">当前接口没有专属错误码</div>
          <div v-else class="fei-doc-record-list">
            <article v-for="(errorCode, index) in errorCodes" :key="errorCode.clientKey" class="fei-doc-record">
              <div class="fei-doc-record__toolbar">
                <strong>{{ errorCode.errorCode || '未填写错误码' }}</strong>
                <button type="button" class="fei-action-btn fei-action-btn--danger" @click="removeErrorCode(errorCode.clientKey)">删除</button>
              </div>
              <div class="fei-form-grid fei-form-grid--three">
                <label class="fei-field"><span class="fei-label">错误码</span><input v-model.trim="errorCode.errorCode" class="fei-input" maxlength="64" required /></label>
                <label class="fei-field"><span class="fei-label">错误信息</span><input v-model.trim="errorCode.errorMessage" class="fei-input" maxlength="256" required /></label>
                <label class="fei-field"><span class="fei-label">排序</span><input v-model.number="errorCode.sortOrder" class="fei-input" type="number" :placeholder="String(index + 1)" /></label>
              </div>
              <div class="fei-form-grid fei-form-grid--two">
                <label class="fei-field"><span class="fei-label">公开说明</span><input v-model.trim="errorCode.description" class="fei-input" maxlength="512" /></label>
                <label class="fei-field"><span class="fei-label">解决建议</span><input v-model.trim="errorCode.solution" class="fei-input" maxlength="512" /></label>
              </div>
            </article>
          </div>
        </section>
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
import { interfaceService } from '@/services/interfaceInfo';
import { getInterfaceStatusText, getQuotaTypeText } from '@/composables/useQuota';
import type {
  InterfaceDocDetailVO,
  InterfaceDocErrorCodeSaveRequest,
  InterfaceDocParamSaveRequest,
  InterfaceDocParamVO,
  InterfaceDocSaveRequest,
} from '@/types/api';

/** 页面文档主信息表单。 */
interface DocMainForm {
  /** 文档版本。 */
  docVersion: string;
  /** 请求格式。 */
  requestContentType: string;
  /** 响应格式。 */
  responseContentType: string;
  /** 成功示例。 */
  successExample: string;
  /** 失败示例。 */
  failExample: string;
  /** 公开备注。 */
  remark: string;
}

/** 带前端标识的错误码表单。 */
interface EditableErrorCode extends InterfaceDocErrorCodeSaveRequest {
  /** 前端列表稳定键。 */
  clientKey: string;
}

const route = useRoute();
const router = useRouter();
const emit = defineEmits<{
  /** 页面 Toast 事件。 */
  (event: 'show-toast', message: string, type: 'success' | 'error' | 'info'): void;
}>();

const contentTypes = [
  'application/json',
  'application/xml',
  'text/plain',
  'text/html',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'application/octet-stream',
];
const paramTypes = ['string', 'number', 'boolean', 'object', 'array'];
const loading = ref(true);
const saving = ref(false);
const loadError = ref('');
const saveError = ref('');
const detail = ref<InterfaceDocDetailVO | null>(null);
const requestParams = ref<InterfaceDocParamSaveRequest[]>([]);
const responseParams = ref<InterfaceDocParamSaveRequest[]>([]);
const errorCodes = ref<EditableErrorCode[]>([]);
const baseline = ref('');
const keySequence = ref(0);
const form = reactive<DocMainForm>({
  docVersion: 'v1',
  requestContentType: 'application/json',
  responseContentType: 'application/json',
  successExample: '',
  failExample: '',
  remark: '',
});

const interfaceInfoId = computed(() => Number(route.params.id));
const editable = computed(() => detail.value?.interfaceInfo.status === 0);
const currentSnapshot = computed(() => JSON.stringify(buildSaveRequest()));
const dirty = computed(() => Boolean(detail.value) && currentSnapshot.value !== baseline.value);
const canSave = computed(() => editable.value && !loading.value && !loadError.value && !saving.value && dirty.value);

/** 生成前端稳定键。 */
const nextClientKey = (prefix: string) => `${prefix}-${Date.now()}-${++keySequence.value}`;

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
const loadDocument = async () => {
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
const validateForm = () => {
  if (!form.docVersion || !form.requestContentType || !form.responseContentType) return '文档版本和内容格式不能为空';
  if (responseParams.value.some((param) => !param.name || !param.type)) return '响应字段名称和类型不能为空';
  if (errorCodes.value.some((item) => !item.errorCode || !item.errorMessage)) return '错误码和错误信息不能为空';
  return '';
};

/** 保存结构化接口文档。 */
const saveDocument = async () => {
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

/** 新增响应字段。 */
const addResponseParam = () => {
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
const removeResponseParam = (paramKey: string) => {
  responseParams.value = responseParams.value
    .filter((param) => param.paramKey !== paramKey)
    .map((param) => param.parentParamKey === paramKey ? { ...param, parentParamKey: undefined } : param);
};

/** 获取可选父字段。 */
const parentOptions = (currentKey: string) => responseParams.value.filter((param) => param.paramKey !== currentKey);

/** 新增接口错误码。 */
const addErrorCode = () => {
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
const removeErrorCode = (clientKey: string) => {
  errorCodes.value = errorCodes.value.filter((item) => item.clientKey !== clientKey);
};

/** 格式化 JSON 示例。 */
const formatJson = (field: 'successExample' | 'failExample') => {
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
const confirmLeave = () => !dirty.value || window.confirm('当前文档存在未保存修改，确定离开吗？');

/** 处理浏览器关闭或刷新。 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
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
