import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relativeTime';

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-08-10T12:00:00+08:00');

  it('格式化分钟、小时和天', () => {
    expect(formatRelativeTime('2026-08-10T11:59:30+08:00', now)).toBe('刚刚');
    expect(formatRelativeTime('2026-08-10T11:30:00+08:00', now)).toBe('30 分钟前');
    expect(formatRelativeTime('2026-08-10T09:00:00+08:00', now)).toBe('3 小时前');
    expect(formatRelativeTime('2026-08-08T12:00:00+08:00', now)).toBe('2 天前');
  });

  it('非法或空时间保持可读', () => {
    expect(formatRelativeTime(undefined, now)).toBe('未知时间');
    expect(formatRelativeTime('刚刚', now)).toBe('刚刚');
  });
});
