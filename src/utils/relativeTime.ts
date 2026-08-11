/**
 * 将后端 ISO 时间格式化为中文相对时间。
 *
 * @param value ISO 时间字符串
 * @param now 当前时间戳，便于测试注入
 * @returns 相对时间文本
 */
export const formatRelativeTime = (value: string | null | undefined, now = Date.now()): string => {
  if (!value) return '未知时间';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
};
