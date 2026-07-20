/**
 * 个人中心表单相关类型定义。
 */

/** 个人资料表单模型。 */
export interface ProfileFormModel {
  /** 用户昵称。 */
  userName: string;
  /** 用户性别，0 为男，1 为女。 */
  gender: 0 | 1;
}

/** 密码修改表单模型。 */
export interface PasswordFormModel {
  /** 当前密码。 */
  oldPassword: string;
  /** 新密码。 */
  newPassword: string;
  /** 新密码确认值。 */
  checkPassword: string;
}

/** 密码修改表单错误模型。 */
export interface PasswordFormErrors {
  /** 当前密码错误文本。 */
  oldPassword: string;
  /** 新密码错误文本。 */
  newPassword: string;
  /** 确认密码错误文本。 */
  checkPassword: string;
}
