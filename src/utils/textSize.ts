/** 文本边界剩余量。 */
export interface SizeRemaining {
  /** 当前计量值。 */
  current: number;
  /** 最大允许值。 */
  max: number;
  /** 剩余可用量，超限时为负数。 */
  remaining: number;
  /** 是否已经超过上限。 */
  overLimit: boolean;
}

/** 去除首尾 Unicode White_Space 属性字符。 */
export const stripUnicodeWhitespace = (value: string | null | undefined): string => (
  (value ?? '').replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '')
);

/** 计算去除首尾 Unicode 空白后的码点数量。 */
export const unicodeCodePointLength = (value: string | null | undefined): number => (
  Array.from(stripUnicodeWhitespace(value)).length
);

/** 计算原始文本的 Unicode 码点数量，不执行空白标准化。 */
export const rawUnicodeCodePointLength = (value: string | null | undefined): number => (
  Array.from(value ?? '').length
);

/** 计算文本编码为 UTF-8 后的实际字节数。 */
export const utf8ByteLength = (value: string | null | undefined): number => (
  new TextEncoder().encode(value ?? '').byteLength
);

/** 计算 JSON 序列化结果的 UTF-8 字节数。 */
export const jsonPayloadByteLength = (value: unknown): number => utf8ByteLength(JSON.stringify(value));

/** 根据当前值和上限生成统一剩余量状态。 */
export const getSizeRemaining = (current: number, max: number): SizeRemaining => ({
  current,
  max,
  remaining: max - current,
  overLimit: current > max,
});
