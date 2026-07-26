import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** 项目根目录。 */
const projectRoot = process.cwd();

/** 读取项目根目录中的文本文件。 */
const readProjectFile = (relativePath: string): string => (
  readFileSync(resolve(projectRoot, relativePath), 'utf8')
);

describe('项目配置边界', () => {
  it('不保留已退出技术栈的配置文件和忽略规则', () => {
    expect(existsSync(resolve(projectRoot, '.prettierrc.js'))).toBe(false);
    expect(existsSync(resolve(projectRoot, 'jsconfig.json'))).toBe(false);

    const gitignore = readProjectFile('.gitignore');
    expect(gitignore).not.toContain('roadhog-api-doc');
    expect(gitignore).not.toContain('request-temp.js');
    expect(gitignore).not.toMatch(/^build\/?$/m);
  });
});
