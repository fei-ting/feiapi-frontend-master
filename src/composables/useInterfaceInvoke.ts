import { computed, reactive, ref, type Ref } from 'vue';
import { INTERFACE_DOC_LIMITS } from '@/features/interface-platform/documentation/constants/interfaceDocLimits';
import type { InterfaceDocDetailVO } from '@/features/interface-platform/documentation/types/interfaceDoc';
import { utf8ByteLength } from '@/utils/textSize';

/** 在线调用支持的参数值类型 */
export type RequestParamValue = string | number | boolean | Record<string, unknown> | unknown[];

/** 结构化请求参数字段 */
export interface RequestParamField {
  name: string;
  type: string;
  example?: unknown;
  required: boolean;
  defaultValue?: string;
  description?: string;
  validationRule?: string;
}

/**
 * 在线调用参数组合式函数
 * 负责结构化参数解析、类型转换、JSON 校验和示例值填充
 * @param docDetail 接口文档详情
 */
export function useInterfaceInvoke(docDetail: Ref<InterfaceDocDetailVO | null>) {
  const requestParams = ref('');
  const requestParamError = ref('');
  const structuredParams = ref<RequestParamField[]>([]);
  const paramValues = reactive<Record<string, string>>({});
  /** 当前最终在线调用参数的 UTF-8 字节数。 */
  const requestParamBytes = computed(() => utf8ByteLength(requestParams.value));
  /** 当前最终在线调用参数是否超过网关签名正文上限。 */
  const requestParamOverLimit = computed(() => requestParamBytes.value > INTERFACE_DOC_LIMITS.invokeBodyBytes);

  /** 判断字段示例是否只是类型占位标记。 */
  const isTypePlaceholder = (param: RequestParamField, value: unknown): boolean => (
    typeof value === 'string'
    && ['string', 'number', 'boolean', 'object', 'array'].includes(value.trim().toLowerCase())
    && value.trim().toLowerCase() === param.type.toLowerCase()
  );

  /** 解析接口文档中的结构化参数 */
  const parseStructuredParams = (doc: InterfaceDocDetailVO | null): RequestParamField[] => {
    if (!doc || doc.structuredDocMissing) return [];
    return (doc.requestParams || [])
      .filter((param) => param.name)
      .map((param) => {
        const field: RequestParamField = {
          name: param.name as string,
          type: param.type || 'string',
          required: param.required !== false,
        };
        if (param.exampleValue !== undefined) field.example = param.exampleValue;
        if (param.defaultValue !== undefined) field.defaultValue = param.defaultValue;
        if (param.description !== undefined) field.description = param.description;
        if (param.validationRule !== undefined) field.validationRule = param.validationRule;
        return field;
      });
  };

  /** 将输入文本转换为字段声明的类型 */
  const parseParamValue = (param: RequestParamField, rawValue: string) => {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue && param.required) {
      return { valid: false, message: `请求参数缺少必填字段：${param.name}`, value: undefined };
    }
    if (!trimmedValue) return { valid: true, value: undefined };
    if (param.type === 'number') {
      const numberValue = Number(trimmedValue);
      return Number.isFinite(numberValue)
        ? { valid: true, value: numberValue }
        : { valid: false, message: `请求参数字段类型错误：${param.name} 应为 number`, value: undefined };
    }
    if (param.type === 'boolean') {
      if (trimmedValue === 'true' || trimmedValue === '1') return { valid: true, value: true };
      if (trimmedValue === 'false' || trimmedValue === '0') return { valid: true, value: false };
      return { valid: false, message: `请求参数字段类型错误：${param.name} 应为 boolean`, value: undefined };
    }
    if (param.type === 'object' || param.type === 'array') {
      try {
        const parsedValue = JSON.parse(trimmedValue);
        const isExpectedType = param.type === 'array'
          ? Array.isArray(parsedValue)
          : parsedValue !== null && !Array.isArray(parsedValue) && typeof parsedValue === 'object';
        return isExpectedType
          ? { valid: true, value: parsedValue as RequestParamValue }
          : { valid: false, message: `请求参数字段类型错误：${param.name} 应为 ${param.type}`, value: undefined };
      } catch {
        return { valid: false, message: `请求参数字段类型错误：${param.name} 应为 ${param.type}`, value: undefined };
      }
    }
    return { valid: true, value: rawValue };
  };

  /** 将示例值转换为字段输入框使用的文本。 */
  const exampleToInputValue = (param: RequestParamField): string | null => {
    const value = param.example ?? param.defaultValue;
    if (value === null || value === undefined || isTypePlaceholder(param, value)) return null;
    const rawValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (!rawValue.trim()) return null;
    return parseParamValue(param, rawValue).valid ? rawValue : null;
  };

  /** 当前文档是否至少存在一个可转换的示例值。 */
  const canFillExample = computed(() => (
    structuredParams.value.some((param) => exampleToInputValue(param) !== null)
  ));

  /** 将字段值同步为请求 JSON */
  const syncRequestParamsFromFields = () => {
    if (!structuredParams.value.length) return '';
    const params: Record<string, RequestParamValue> = {};
    let firstError = '';
    for (const param of structuredParams.value) {
      const parsedValue = parseParamValue(param, paramValues[param.name] || '');
      if (!parsedValue.valid) {
        if (!firstError) firstError = parsedValue.message || '请求参数格式错误';
        continue;
      }
      if (parsedValue.value !== undefined) params[param.name] = parsedValue.value as RequestParamValue;
    }
    requestParams.value = JSON.stringify(params);
    return firstError;
  };

  /** 校验当前请求参数 */
  const validateRequestParams = () => {
    requestParamError.value = '';
    const fieldError = syncRequestParamsFromFields();
    if (fieldError) {
      requestParamError.value = fieldError;
      return false;
    }
    const content = requestParams.value.trim();
    if (!content) return true;
    if (requestParamOverLimit.value) {
      requestParamError.value = '请求参数不能超过 65535 个 UTF-8 字节';
      return false;
    }
    try {
      JSON.parse(content);
      return true;
    } catch {
      requestParamError.value = '请求参数必须是合法 JSON';
      return false;
    }
  };

  /** 从文档示例填充字段值 */
  const fillStructuredExample = () => {
    structuredParams.value.forEach((param) => {
      const inputValue = exampleToInputValue(param);
      if (inputValue !== null) paramValues[param.name] = inputValue;
    });
    requestParamError.value = syncRequestParamsFromFields();
  };

  /** 根据最新文档初始化参数状态 */
  const syncFromDocument = () => {
    Object.keys(paramValues).forEach((name) => delete paramValues[name]);
    structuredParams.value = parseStructuredParams(docDetail.value);
    requestParams.value = '';
    requestParamError.value = '';
  };

  return {
    requestParams,
    requestParamError,
    requestParamBytes,
    requestParamOverLimit,
    structuredParams,
    paramValues,
    canFillExample,
    parseStructuredParams,
    syncRequestParamsFromFields,
    validateRequestParams,
    fillStructuredExample,
    syncFromDocument,
  };
}
