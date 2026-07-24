import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createGithubSummary,
  evaluatePerformanceBudget,
  measureBuildDirectory,
  validateBuildMetrics,
  validatePerformanceBudget,
} from './check-build-size.mjs';

/** 测试创建的临时目录。 */
const temporaryDirectories = [];

/** 构建体积检查命令行脚本路径。 */
const checkBuildSizeScript = resolve(process.cwd(), 'scripts/check-build-size.mjs');

/** 标准性能预算测试数据。 */
const standardBudget = {
  baseline: {
    totalRawBytes: 100,
    totalGzipBytes: 100,
    largestJavaScriptRawBytes: 100,
    largestJavaScriptGzipBytes: 100,
  },
  warningGrowthRate: 0.1,
  failureGrowthRate: 0.25,
};

/**
 * 创建会在测试后自动清理的临时目录。
 *
 * @returns {string} 临时目录路径
 */
const createTemporaryDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'feiapi-build-size-'));
  temporaryDirectories.push(directory);
  return directory;
};

/**
 * 创建构建指标测试数据。
 *
 * @param {Partial<import('./check-build-size.mjs').BuildMetrics>} overrides 需要覆盖的指标
 * @returns {object} 完整构建指标
 */
const createMetrics = (overrides = {}) => ({
  fileCount: 1,
  totalRawBytes: 100,
  totalGzipBytes: 100,
  largestJavaScriptRawBytes: 100,
  largestJavaScriptGzipBytes: 100,
  largestJavaScriptFile: 'assets/index.js',
  largestGzipJavaScriptFile: 'assets/index.js',
  ...overrides,
});

/**
 * 根据目标增长比例生成性能预算。
 *
 * @param {ReturnType<typeof createMetrics>} metrics 当前构建指标
 * @param {number} targetGrowthRate 目标增长比例
 * @returns {object} 性能预算
 */
const createBudgetForGrowth = (metrics, targetGrowthRate) => ({
  baseline: {
    totalRawBytes: Math.ceil(metrics.totalRawBytes / (1 + targetGrowthRate)),
    totalGzipBytes: Math.ceil(metrics.totalGzipBytes / (1 + targetGrowthRate)),
    largestJavaScriptRawBytes: Math.ceil(metrics.largestJavaScriptRawBytes / (1 + targetGrowthRate)),
    largestJavaScriptGzipBytes: Math.ceil(metrics.largestJavaScriptGzipBytes / (1 + targetGrowthRate)),
  },
  warningGrowthRate: 0.1,
  failureGrowthRate: 0.25,
});

/**
 * 创建可由命令行脚本检查的临时项目。
 *
 * @param {number} targetGrowthRate 目标增长比例
 * @returns {string} 临时项目目录
 */
const createCommandLineProject = (targetGrowthRate) => {
  const projectDirectory = createTemporaryDirectory();
  const buildDirectory = join(projectDirectory, 'dist');
  mkdirSync(buildDirectory);
  writeFileSync(join(buildDirectory, 'index.js'), 'console.log("feiapi-performance-budget");'.repeat(200));
  const metrics = measureBuildDirectory(buildDirectory);
  writeFileSync(
    join(projectDirectory, 'performance-budget.json'),
    JSON.stringify(createBudgetForGrowth(metrics, targetGrowthRate)),
  );
  return projectDirectory;
};

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('构建目录体积测量', () => {
  it('应统计嵌套文件并识别最大的 JavaScript 文件', () => {
    const buildDirectory = createTemporaryDirectory();
    const assetsDirectory = join(buildDirectory, 'assets');
    const largestRawJavaScriptContent = Buffer.alloc(1_000, 'a');
    const largestGzipJavaScriptContent = Buffer.from(Array.from({ length: 200 }, (_, index) => index));
    const cssContent = Buffer.from('body{color:#123456}');
    mkdirSync(assetsDirectory);
    writeFileSync(join(assetsDirectory, 'largest-raw.js'), largestRawJavaScriptContent);
    writeFileSync(join(assetsDirectory, 'largest-gzip.js'), largestGzipJavaScriptContent);
    writeFileSync(join(buildDirectory, 'index.css'), cssContent);

    const metrics = measureBuildDirectory(buildDirectory);

    expect(metrics).toEqual({
      fileCount: 3,
      totalRawBytes: largestRawJavaScriptContent.length + largestGzipJavaScriptContent.length + cssContent.length,
      totalGzipBytes: gzipSync(largestRawJavaScriptContent).length + gzipSync(largestGzipJavaScriptContent).length + gzipSync(cssContent).length,
      largestJavaScriptRawBytes: largestRawJavaScriptContent.length,
      largestJavaScriptGzipBytes: gzipSync(largestGzipJavaScriptContent).length,
      largestJavaScriptFile: 'assets/largest-raw.js',
      largestGzipJavaScriptFile: 'assets/largest-gzip.js',
    });
  });

  it('构建目录不存在时应明确失败', () => {
    const missingDirectory = join(tmpdir(), `feiapi-missing-${Date.now()}`);
    expect(() => measureBuildDirectory(missingDirectory)).toThrow('构建目录不存在');
  });

  it('构建目录为空时应明确失败', () => {
    const buildDirectory = createTemporaryDirectory();
    expect(() => measureBuildDirectory(buildDirectory)).toThrow('构建目录为空');
  });

  it('构建目录没有 JavaScript 文件时应明确失败', () => {
    const buildDirectory = createTemporaryDirectory();
    writeFileSync(join(buildDirectory, 'index.css'), 'body{}');
    expect(() => measureBuildDirectory(buildDirectory)).toThrow('没有 JavaScript 文件');
  });
});

describe('性能预算配置校验', () => {
  it('基线不是正整数时应拒绝配置', () => {
    const invalidBudget = structuredClone(standardBudget);
    invalidBudget.baseline.totalRawBytes = 0;
    expect(() => validatePerformanceBudget(invalidBudget)).toThrow('基线必须是正整数');
  });

  it('警告比例不是正数时应拒绝配置', () => {
    expect(() => validatePerformanceBudget({ ...standardBudget, warningGrowthRate: 0 })).toThrow('警告增长比例');
  });

  it('失败比例没有超过警告比例时应拒绝配置', () => {
    expect(() => validatePerformanceBudget({ ...standardBudget, failureGrowthRate: 0.1 })).toThrow('失败增长比例');
  });

  it('当前构建指标缺失时应失败关闭', () => {
    const invalidMetrics = createMetrics({ totalGzipBytes: undefined });
    expect(() => validateBuildMetrics(invalidMetrics)).toThrow('Gzip 总量必须是正整数');
  });
});

describe('性能预算比较', () => {
  it('所有指标低于警告线时应通过', () => {
    const evaluation = evaluatePerformanceBudget(createMetrics({ totalRawBytes: 109 }), standardBudget);
    expect(evaluation.status).toBe('passed');
  });

  it('任一指标达到警告线时应返回警告', () => {
    const evaluation = evaluatePerformanceBudget(createMetrics({ totalGzipBytes: 110 }), standardBudget);
    expect(evaluation.status).toBe('warning');
    expect(evaluation.results.find(({ key }) => key === 'totalGzipBytes')?.status).toBe('warning');
  });

  it('任一指标达到失败线时应返回失败并优先于警告', () => {
    const evaluation = evaluatePerformanceBudget(createMetrics({
      totalRawBytes: 110,
      largestJavaScriptRawBytes: 125,
    }), standardBudget);
    expect(evaluation.status).toBe('failed');
    expect(evaluation.results.find(({ key }) => key === 'totalRawBytes')?.status).toBe('warning');
    expect(evaluation.results.find(({ key }) => key === 'largestJavaScriptRawBytes')?.status).toBe('failed');
  });

  it('指标下降时应保留负增长且不产生警告', () => {
    const evaluation = evaluatePerformanceBudget(createMetrics({ totalRawBytes: 80 }), standardBudget);
    const totalRawResult = evaluation.results.find(({ key }) => key === 'totalRawBytes');
    expect(evaluation.status).toBe('passed');
    expect(totalRawResult?.growthRate).toBe(-0.2);
  });

  it('应生成包含两类最大 JavaScript 文件和总体结论的任务摘要', () => {
    const metrics = createMetrics({
      largestJavaScriptFile: 'assets/largest-raw.js',
      largestGzipJavaScriptFile: 'assets/largest-gzip.js',
    });
    const evaluation = evaluatePerformanceBudget(metrics, standardBudget);

    const summary = createGithubSummary(metrics, evaluation);

    expect(summary).toContain('最大未压缩 JavaScript：`assets/largest-raw.js`');
    expect(summary).toContain('最大 Gzip JavaScript：`assets/largest-gzip.js`');
    expect(summary).toContain('总体结论：**通过**');
  });
});

describe('命令行退出码', () => {
  it('达到警告线时应返回成功退出码', () => {
    const projectDirectory = createCommandLineProject(0.15);
    const commandResult = spawnSync(process.execPath, [checkBuildSizeScript], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(commandResult.status).toBe(0);
    expect(commandResult.stdout).toContain('总体结论：警告');
  });

  it('达到失败线时应返回失败退出码', () => {
    const projectDirectory = createCommandLineProject(0.35);
    const commandResult = spawnSync(process.execPath, [checkBuildSizeScript], {
      cwd: projectDirectory,
      encoding: 'utf8',
    });

    expect(commandResult.status).toBe(1);
    expect(commandResult.stdout).toContain('总体结论：失败');
  });
});
