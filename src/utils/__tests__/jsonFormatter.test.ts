import { describe, expect, it } from 'vitest';
import { formatJsonPreservingNumbers } from '@/utils/jsonFormatter';

describe('formatJsonPreservingNumbers', () => {
  it('格式化时保留超出安全整数范围的数字原文', () => {
    const result = formatJsonPreservingNumbers(
      '{"id":9007199254740993,"orderNo":9223372036854775807}',
    );

    expect(result).toContain('9007199254740993');
    expect(result).toContain('9223372036854775807');
    expect(result).not.toContain('9007199254740992');
    expect(result).not.toContain('9223372036854776000');
  });

  it('保留指数形式和负零的数字词法', () => {
    const result = formatJsonPreservingNumbers('{"scientific":1e+10,"negativeZero":-0}');

    expect(result).toContain('1e+10');
    expect(result).toContain('-0');
  });

  it('保留嵌套 JSON 的结构和数字原文', () => {
    const result = formatJsonPreservingNumbers('{"items":[{"value":9007199254740993}]}');

    expect(result).toContain('"items": [');
    expect(result).toContain('"value": 9007199254740993');
  });

  it('拒绝非法 JSON', () => {
    expect(() => formatJsonPreservingNumbers('{bad json')).toThrow();
  });
});
