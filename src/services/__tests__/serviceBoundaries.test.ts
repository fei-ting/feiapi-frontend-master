import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** 前端项目根目录。 */
const projectDir = process.cwd();

/** 前端服务和类型文件所在目录。 */
const srcDir = resolve(projectDir, 'src');

/** 读取源码文件内容，用于验证领域边界和无效导出。 */
function readSource(relativePath: string): string {
  return readFileSync(resolve(srcDir, relativePath), 'utf8');
}

describe('服务与类型边界', () => {
  it('分析服务文件已删除', () => {
    expect(existsSync(resolve(srcDir, 'services/analysis.ts'))).toBe(false);
  });

  it('TypeScript 配置不再引用已删除的分析服务', () => {
    const tsconfigSource = readFileSync(resolve(projectDir, 'tsconfig.json'), 'utf8');

    expect(tsconfigSource).not.toContain('src/services/analysis.ts');
  });

  it('Dashboard 服务只保留当前页面使用的接口', () => {
    const dashboardSource = readSource('services/dashboard.ts');

    expect(dashboardSource).not.toContain('getTopInterfaces');
    expect(dashboardSource).not.toContain('/analysis/top/interface/invoke');
    expect(dashboardSource).toContain('getOverview');
    expect(dashboardSource).toContain('getTrends');
    expect(dashboardSource).toContain('getAlerts');
    expect(dashboardSource).toContain('getChanges');
  });

  it('用户接口信息服务只保留个人调用记录查询', () => {
    const serviceSource = readSource('services/userInterfaceInfo.ts');

    expect(serviceSource).not.toContain('adminListPage');
    expect(serviceSource).not.toContain('/userInterfaceInfo/admin/list/page');
    expect(serviceSource).toContain('myListPage');
  });

  it('Dashboard 类型不声明未使用的聚合类型', () => {
    const dashboardTypes = readSource('types/dashboard.ts');

    expect(dashboardTypes).not.toContain('DashboardData');
    expect(dashboardTypes).toContain('DashboardOverview');
    expect(dashboardTypes).toContain('DashboardTrends');
    expect(dashboardTypes).toContain('AlertInterface');
    expect(dashboardTypes).toContain('ChangedInterface');
  });
});
