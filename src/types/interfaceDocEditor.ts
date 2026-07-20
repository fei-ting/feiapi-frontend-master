import type { InterfaceDocErrorCodeSaveRequest } from '@/types/api';

/** 页面文档主信息表单。 */
export interface DocMainForm {
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
export interface EditableErrorCode extends InterfaceDocErrorCodeSaveRequest {
  /** 前端列表稳定键。 */
  clientKey: string;
}

/** 文档主信息允许编辑的字段。 */
export type DocMainEditableField = 'docVersion' | 'requestContentType' | 'responseContentType' | 'remark';

/** 请求参数说明允许编辑的字段。 */
export type RequestParamEditableField = 'description' | 'exampleValue' | 'defaultValue' | 'validationRule' | 'sortOrder';

/** 响应参数允许编辑的字段。 */
export type ResponseParamEditableField =
  | 'name'
  | 'type'
  | 'parentParamKey'
  | 'sortOrder'
  | 'required'
  | 'nullable'
  | 'description'
  | 'exampleValue'
  | 'defaultValue'
  | 'validationRule';

/** 错误码允许编辑的字段。 */
export type ErrorCodeEditableField = 'errorCode' | 'errorMessage' | 'sortOrder' | 'description' | 'solution';

/** 编辑器字段可用值。 */
export type EditorFieldValue = string | number | boolean | undefined;

/** JSON 示例字段。 */
export type JsonExampleField = 'successExample' | 'failExample';
