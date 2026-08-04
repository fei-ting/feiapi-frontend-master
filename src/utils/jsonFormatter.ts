import { applyEdits, format } from 'jsonc-parser';

/**
 * 基于原始 JSON 文本的词法标记执行格式化，避免数字先转换为 JavaScript Number。
 *
 * @param value 待校验和格式化的 JSON 文本
 * @returns 两空格缩进的格式化 JSON 文本
 */
export const formatJsonPreservingNumbers = (value: string): string => {
  // 只使用解析结果确认严格 JSON 语法，不使用结果重新序列化，避免数字精度丢失。
  JSON.parse(value);
  const edits = format(value, undefined, {
    insertSpaces: true,
    tabSize: 2,
    eol: '\n',
  });
  return applyEdits(value, edits);
};
