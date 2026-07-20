import { reactive, ref, type Ref } from 'vue';
import type { InterfaceDocDetailVO } from '@/types/api';

/** 在线调用支持的参数值类型 */
export type RequestParamValue = string | number | boolean | Record<string, unknown> | unknown[];

/** 结构化请求参数字段 */
export interface RequestParamField {
  name: string;
  type: string;
  example: unknown;
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

  /** 解析接口文档中的结构化参数 */
  const parseStructuredParams = (doc: InterfaceDocDetailVO | null): RequestParamField[] => {
    if (!doc || doc.structuredDocMissing) return [];
    return (doc.requestParams || [])
      .filter((param) => param.name)
      .map((param) => ({
        name: param.name as string,
        type: param.type || 'string',
        example: param.exampleValue || param.defaultValue || '',
        required: param.required !== false,
        defaultValue: param.defaultValue,
        description: param.description,
        validationRule: param.validationRule,
      }));
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

  /** 将字段值同步为请求 JSON */
  const syncRequestParamsFromFields = () => {
    if (!structuredParams.value.length) return '';
    const params: Record<string, RequestParamValue> = {};
    for (const param of structuredParams.value) {
      const parsedValue = parseParamValue(param, paramValues[param.name] || '');
      if (!parsedValue.valid) return parsedValue.message || '请求参数格式错误';
      if (parsedValue.value !== undefined) params[param.name] = parsedValue.value as RequestParamValue;
    }
    requestParams.value = JSON.stringify(params);
    return '';
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
      if (param.example === null || param.example === undefined) {
        paramValues[param.name] = '';
      } else if (typeof param.example === 'string' && ['string', 'number', 'boolean', 'object', 'array'].includes(param.example.toLowerCase())) {
        paramValues[param.name] = '';
      } else if (typeof param.example === 'object') {
        paramValues[param.name] = JSON.stringify(param.example);
      } else {
        paramValues[param.name] = String(param.example);
      }
    });
    syncRequestParamsFromFields();
  };

  /** 根据最新文档初始化参数状态 */
  const syncFromDocument = () => {
    structuredParams.value = parseStructuredParams(docDetail.value);
    if (structuredParams.value.length) {
      fillStructuredExample();
    } else {
      requestParams.value = '';
    }
  };

  return {
    requestParams,
    requestParamError,
    structuredParams,
    paramValues,
    parseStructuredParams,
    syncRequestParamsFromFields,
    validateRequestParams,
    fillStructuredExample,
    syncFromDocument,
  };
}
