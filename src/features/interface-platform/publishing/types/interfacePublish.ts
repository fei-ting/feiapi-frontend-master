/**
 * 接口发布检查领域类型。
 */

/** 发布检查问题分类。 */
export type InterfacePublishIssueCategory =
  | 'INTERFACE_CONFIG'
  | 'SDK'
  | 'RUNTIME_TEMPLATE'
  | 'DOCUMENT'
  | 'CALL_EXAMPLE';

/** 发布检查问题视图对象。 */
export interface InterfacePublishIssueVO {
  /** 问题分类。 */
  category: InterfacePublishIssueCategory;
  /** 稳定规则编码。 */
  ruleCode: string;
  /** 公开字段路径。 */
  field?: string | null;
  /** 中文问题说明。 */
  message: string;
}

/** 发布检查结果视图对象。 */
export interface InterfacePublishCheckVO {
  /** 是否通过全部静态检查。 */
  passed: boolean;
  /** 检查问题列表。 */
  issues: InterfacePublishIssueVO[];
}

/** 发布探测失败视图对象。 */
export interface InterfacePublishProbeFailureVO {
  /** 探测失败阶段。 */
  stage: string;
  /** 安全公开失败原因。 */
  reason: string;
}

/** 发布相关错误响应数据。 */
export type InterfacePublishErrorData = InterfacePublishCheckVO | InterfacePublishProbeFailureVO;

/** 发布前静态检查失败业务码。 */
export const PUBLISH_CHECK_FAILED_CODE = 40901;

/** 发布探测失败业务码。 */
export const PUBLISH_PROBE_FAILED_CODE = 40902;
