/**
 * 格式化相关组合式函数
 * 提供统一的格式化方法
 */

/**
 * 格式化组合式函数
 * @returns 格式化方法
 */
export function useFormat() {
  /**
   * 格式化时间显示
   * @param time 时间字符串
   * @returns 格式化后的时间
   */
  const formatTime = (time?: string): string => {
    if (!time) return '暂无更新时间';
    try {
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('[useFormat] 格式化时间失败:', error);
      return time;
    }
  };

  /**
   * 格式化日期时间（包含秒）
   * @param value 日期时间字符串
   * @returns 格式化后的日期时间
   */
  const formatDateTime = (value?: string): string => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const pad = (num: number) => String(num).padStart(2, '0');
    return [
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    ].join(' ');
  };

  /**
   * 格式化数量显示
   * @param num 数量
   * @returns 格式化后的字符串
   */
  const formatCount = (num: number | null | undefined): string => {
    if (num == null) {
      return '--';
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1).replace(/\.0$/, '')}万`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return String(num);
  };

  /**
   * 格式化比率显示
   * @param rate 比率
   * @returns 格式化后的字符串
   */
  const formatRate = (rate: number | null | undefined): string => {
    if (rate == null) {
      return '--';
    }
    return `${rate.toFixed(1).replace(/\.0$/, '')}%`;
  };

  /**
   * 格式化响应时间显示
   * @param responseTimeMs 响应时间（毫秒）
   * @returns 格式化后的字符串
   */
  const formatResponseTime = (responseTimeMs: number | null | undefined): string => {
    if (responseTimeMs == null) {
      return '--';
    }
    return `${Math.round(responseTimeMs)}ms`;
  };

  /**
   * 格式化 JSON 显示
   * @param value JSON 字符串
   * @param fallback 默认值
   * @returns 格式化后的 JSON
   */
  const prettyJson = (value: string | undefined, fallback: string): string => {
    const content = value?.trim();
    if (!content) {
      return fallback;
    }
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  };

  return {
    formatTime,
    formatDateTime,
    formatCount,
    formatRate,
    formatResponseTime,
    prettyJson,
  };
}
