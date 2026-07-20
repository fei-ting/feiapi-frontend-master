/** 账号格式：以字母开头，由 4～10 位字母或数字组成。 */
export const ACCOUNT_PATTERN = /^[a-zA-Z][a-zA-Z0-9]{3,9}$/;

/** 认证字段错误抖动持续时间，单位为毫秒。 */
export const AUTH_FIELD_SHAKE_DURATION_MS = 400;
