/**
 * 登录失败限制信息
 */
type LoginAttemptRecord = {
  /**
   * 连续失败次数
   */
  failureCount: number;

  /**
   * 锁定截止时间戳
   */
  lockedUntil: number;
};

/**
 * 登录失败限制器存储键前缀
 */
const LOGIN_ATTEMPT_STORAGE_PREFIX = 'feiapi_login_attempt_';

/**
 * 连续失败次数上限
 */
const MAX_FAILURE_COUNT = 5;

/**
 * 锁定时长（15 分钟）
 */
const LOCK_DURATION_MILLIS = 15 * 60 * 1000;

/**
 * 读取账号的登录失败记录
 *
 * @param userAccount 用户账号
 * @return 登录失败记录
 */
export const getLoginAttemptRecord = (userAccount: string): LoginAttemptRecord => {
  const normalizedAccount = userAccount.trim();
  const rawRecord = localStorage.getItem(`${LOGIN_ATTEMPT_STORAGE_PREFIX}${normalizedAccount}`);
  if (!rawRecord) {
    return {
      failureCount: 0,
      lockedUntil: 0,
    };
  }

  try {
    return JSON.parse(rawRecord) as LoginAttemptRecord;
  } catch (error) {
    return {
      failureCount: 0,
      lockedUntil: 0,
    };
  }
};

/**
 * 判断账号当前是否允许继续登录
 *
 * @param userAccount 用户账号
 * @return 是否允许登录
 */
export const isLoginAllowed = (userAccount: string): boolean => {
  const record = getLoginAttemptRecord(userAccount);
  if (record.lockedUntil <= Date.now()) {
    return true;
  }
  return false;
};

/**
 * 记录一次登录失败
 *
 * @param userAccount 用户账号
 * @return 是否触发锁定
 */
export const recordLoginFailure = (userAccount: string): boolean => {
  const normalizedAccount = userAccount.trim();
  const record = getLoginAttemptRecord(normalizedAccount);
  const now = Date.now();
  const nextFailureCount = record.lockedUntil > now ? MAX_FAILURE_COUNT : record.failureCount + 1;
  const nextLockedUntil = nextFailureCount >= MAX_FAILURE_COUNT ? now + LOCK_DURATION_MILLIS : 0;

  localStorage.setItem(
    `${LOGIN_ATTEMPT_STORAGE_PREFIX}${normalizedAccount}`,
    JSON.stringify({
      failureCount: nextFailureCount,
      lockedUntil: nextLockedUntil,
    } satisfies LoginAttemptRecord),
  );

  return nextFailureCount >= MAX_FAILURE_COUNT;
};

/**
 * 清理账号登录失败记录
 *
 * @param userAccount 用户账号
 */
export const clearLoginAttemptRecord = (userAccount: string): void => {
  localStorage.removeItem(`${LOGIN_ATTEMPT_STORAGE_PREFIX}${userAccount.trim()}`);
};

/**
 * 获取账号锁定剩余时间（毫秒）
 *
 * @param userAccount 用户账号
 * @return 剩余锁定时间
 */
export const getRemainingLockTime = (userAccount: string): number => {
  const record = getLoginAttemptRecord(userAccount);
  return Math.max(0, record.lockedUntil - Date.now());
};
