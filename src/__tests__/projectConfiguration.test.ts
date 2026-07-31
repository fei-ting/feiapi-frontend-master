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

  it('文档聚合保存由后端执行专用限制且代理保持统一错误契约', () => {
    const nginxConfig = readProjectFile('nginx.conf');
    const saveLocation = nginxConfig.match(
      /location = \/api\/interfaceDoc\/save \{(?<config>[\s\S]*?)\n {4}\}/,
    )?.groups?.config;
    const tooLargeLocation = nginxConfig.match(
      /location @interface_doc_request_too_large \{(?<config>[\s\S]*?)\n {4}\}/,
    )?.groups?.config;

    expect(saveLocation).toBeDefined();
    expect(saveLocation).toContain('client_max_body_size 1m;');
    expect(saveLocation).toContain('error_page 413 = @interface_doc_request_too_large;');
    expect(saveLocation).toContain('proxy_pass http://feiapi-backend:9527;');
    expect(saveLocation).not.toContain('proxy_request_buffering off;');
    expect(tooLargeLocation).toContain('default_type application/json;');
    expect(tooLargeLocation).toContain('return 413');
    expect(tooLargeLocation).toContain('"code":41300');
    expect(tooLargeLocation).toContain('接口文档保存请求体不能超过 1048576 字节');
  });
});
