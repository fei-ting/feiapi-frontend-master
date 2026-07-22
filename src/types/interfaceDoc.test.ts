import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 读取接口文档类型源码。
 */
const readInterfaceDocTypeSource = () => readFileSync(resolve(process.cwd(), 'src/types/interfaceDoc.ts'), 'utf8');

describe('接口文档类型定义', () => {
  /**
   * 验证接口文档公开类型不再包含旧字段，并保留后台维护摘要所需字段。
   */
  it('接口文档详情类型不暴露旧文档字段', () => {
    const source = readInterfaceDocTypeSource();
    const interfaceInfoBlock = source.match(/export interface InterfaceDocInterfaceInfoVO \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(source).not.toContain('legacyFallback');
    expect(source).toContain('structuredDocMissing');
    expect(interfaceInfoBlock).not.toContain('requestParams');
    expect(interfaceInfoBlock).not.toContain('requestHeader');
    expect(interfaceInfoBlock).not.toContain('responseHeader');
    expect(interfaceInfoBlock).toContain('sdkMethodName');
    expect(interfaceInfoBlock).not.toContain('userId');
  });
});
