/** 接口文档与调用链路固定边界。 */
export const INTERFACE_DOC_LIMITS = {
  requestParamCount: 100,
  responseParamCount: 200,
  totalParamCount: 200,
  errorCodeCount: 100,
  paramNameLength: 128,
  exampleValueLength: 1024,
  descriptionLength: 512,
  errorCodeLength: 64,
  errorMessageLength: 256,
  jsonExampleBytes: 65_535,
  aggregateSaveBodyBytes: 1_048_576,
  invokeBodyBytes: 65_535,
} as const;

