import { describe, expect, it } from 'vitest';
import {
  getSizeRemaining,
  jsonPayloadByteLength,
  rawUnicodeCodePointLength,
  stripUnicodeWhitespace,
  unicodeCodePointLength,
  utf8ByteLength,
} from './textSize';

describe('textSize', () => {
  it('按 Unicode 空白去除首尾字符', () => {
    expect(stripUnicodeWhitespace('\u3000\u00a0内容\t')).toBe('内容');
  });

  it('按 Unicode 码点而非 UTF-16 代码单元计数', () => {
    expect(unicodeCodePointLength(' 😀中文 ')).toBe(3);
    expect(rawUnicodeCodePointLength(' 😀 ')).toBe(3);
    expect(unicodeCodePointLength('👨‍👩‍👧')).toBe(5);
  });

  it('按 UTF-8 实际字节计算文本和 JSON 载荷', () => {
    expect(utf8ByteLength('A中😀')).toBe(8);
    expect(jsonPayloadByteLength({ value: '中' })).toBe(15);
  });

  it('准确区分剩余量、精确上限和超限状态', () => {
    expect(getSizeRemaining(9, 10)).toEqual({ current: 9, max: 10, remaining: 1, overLimit: false });
    expect(getSizeRemaining(10, 10).overLimit).toBe(false);
    expect(getSizeRemaining(11, 10)).toEqual({ current: 11, max: 10, remaining: -1, overLimit: true });
  });
});
