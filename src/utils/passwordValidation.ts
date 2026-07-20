/** 密码中至少包含一个字母。 */
const PASSWORD_LETTER_PATTERN = /[a-zA-Z]/;

/** 密码中至少包含一个数字。 */
const PASSWORD_DIGIT_PATTERN = /\d/;

/** 密码只能包含字母和数字。 */
const PASSWORD_ALLOWED_PATTERN = /^[a-zA-Z\d]+$/;

/**
 * 获取密码格式错误文本。
 *
 * @param password 待校验密码
 * @returns 格式正确时返回空字符串，否则返回错误文本
 */
export function getPasswordFormatError(password: string): string {
  if (password.length < 8 || password.length > 16) {
    return '密码长度应为 8-16 位';
  }
  if (
    !PASSWORD_LETTER_PATTERN.test(password)
    || !PASSWORD_DIGIT_PATTERN.test(password)
    || !PASSWORD_ALLOWED_PATTERN.test(password)
  ) {
    return '密码只能包含字母和数字，且必须同时包含字母和数字';
  }
  return '';
}
