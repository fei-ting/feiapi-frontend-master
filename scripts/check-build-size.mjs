import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

/**
 * 构建体积指标。
 *
 * @typedef {object} BuildMetrics
 * @property {number} fileCount 构建文件数量
 * @property {number} totalRawBytes 全部文件未压缩字节数
 * @property {number} totalGzipBytes 全部文件逐个 Gzip 后的字节数
 * @property {number} largestJavaScriptRawBytes 最大 JavaScript 文件未压缩字节数
 * @property {number} largestJavaScriptGzipBytes 最大 JavaScript 文件 Gzip 字节数
 * @property {string} largestJavaScriptFile 最大未压缩 JavaScript 文件相对路径
 * @property {string} largestGzipJavaScriptFile 最大 Gzip JavaScript 文件相对路径
 */

/**
 * 性能预算配置。
 *
 * @typedef {object} PerformanceBudget
 * @property {Pick<BuildMetrics, 'totalRawBytes' | 'totalGzipBytes' | 'largestJavaScriptRawBytes' | 'largestJavaScriptGzipBytes'>} baseline 四项构建体积基线
 * @property {number} warningGrowthRate 产生警告的增长比例
 * @property {number} failureGrowthRate 阻断持续集成的增长比例
 */

/** 构建体积门禁使用的指标定义。 */
const METRIC_DEFINITIONS = [
  { key: 'totalRawBytes', label: '未压缩总量' },
  { key: 'totalGzipBytes', label: 'Gzip 总量' },
  { key: 'largestJavaScriptRawBytes', label: '最大 JavaScript 未压缩体积' },
  { key: 'largestJavaScriptGzipBytes', label: '最大 JavaScript Gzip 体积' },
];

/**
 * 将平台相关路径转换为统一的正斜杠路径。
 *
 * @param {string} filePath 文件路径
 * @returns {string} 统一分隔符后的路径
 */
const normalizePath = (filePath) => filePath.split(sep).join('/');

/**
 * 判断输入是否为正整数。
 *
 * @param {unknown} value 待判断的值
 * @returns {boolean} 是否为正整数
 */
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

/**
 * 校验当前构建指标并返回通过校验的数据。
 *
 * @param {unknown} metrics 待校验的构建指标
 * @returns {BuildMetrics} 通过校验的构建指标
 */
export const validateBuildMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    throw new Error('构建体积指标必须是对象');
  }
  if (!isPositiveInteger(metrics.fileCount)) {
    throw new Error('构建文件数量必须是正整数');
  }

  METRIC_DEFINITIONS.forEach(({ key, label }) => {
    if (!isPositiveInteger(metrics[key])) {
      throw new Error(`${label}必须是正整数`);
    }
  });

  if (typeof metrics.largestJavaScriptFile !== 'string'
    || metrics.largestJavaScriptFile.trim().length === 0) {
    throw new Error('最大未压缩 JavaScript 文件路径不能为空');
  }
  if (typeof metrics.largestGzipJavaScriptFile !== 'string'
    || metrics.largestGzipJavaScriptFile.trim().length === 0) {
    throw new Error('最大 Gzip JavaScript 文件路径不能为空');
  }

  return /** @type {BuildMetrics} */ (metrics);
};

/**
 * 校验性能预算配置并返回通过校验的配置。
 *
 * @param {unknown} budget 待校验的配置
 * @returns {PerformanceBudget} 通过校验的性能预算
 */
export const validatePerformanceBudget = (budget) => {
  if (!budget || typeof budget !== 'object' || Array.isArray(budget)) {
    throw new Error('性能预算配置必须是对象');
  }

  const baseline = budget.baseline;
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    throw new Error('性能预算必须包含 baseline 对象');
  }

  METRIC_DEFINITIONS.forEach(({ key, label }) => {
    if (!isPositiveInteger(baseline[key])) {
      throw new Error(`${label}基线必须是正整数`);
    }
  });

  if (!Number.isFinite(budget.warningGrowthRate) || budget.warningGrowthRate <= 0) {
    throw new Error('警告增长比例必须是大于 0 的有限数字');
  }

  if (!Number.isFinite(budget.failureGrowthRate)
    || budget.failureGrowthRate <= budget.warningGrowthRate) {
    throw new Error('失败增长比例必须是大于警告增长比例的有限数字');
  }

  return /** @type {PerformanceBudget} */ (budget);
};

/**
 * 读取性能预算 JSON 文件。
 *
 * @param {string} budgetPath 性能预算文件路径
 * @returns {PerformanceBudget} 通过校验的性能预算
 */
export const readPerformanceBudget = (budgetPath) => {
  let parsedBudget;
  try {
    parsedBudget = JSON.parse(readFileSync(budgetPath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`无法读取性能预算配置：${message}`);
  }

  return validatePerformanceBudget(parsedBudget);
};

/**
 * 递归收集构建目录中的普通文件。
 *
 * @param {string} directory 当前扫描目录
 * @returns {string[]} 普通文件绝对路径列表
 */
const collectFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(entryPath);
    }
    return entry.isFile() ? [entryPath] : [];
  });

/**
 * 测量构建目录的四项体积指标。
 *
 * @param {string} buildDirectory 构建目录路径
 * @returns {BuildMetrics} 构建体积指标
 */
export const measureBuildDirectory = (buildDirectory) => {
  if (!existsSync(buildDirectory)) {
    throw new Error(`构建目录不存在：${buildDirectory}`);
  }

  const filePaths = collectFiles(buildDirectory);
  if (filePaths.length === 0) {
    throw new Error(`构建目录为空：${buildDirectory}`);
  }

  const measuredFiles = filePaths.map((filePath) => {
    const content = readFileSync(filePath);
    return {
      path: normalizePath(relative(buildDirectory, filePath)),
      rawBytes: content.length,
      gzipBytes: gzipSync(content).length,
    };
  });
  const javaScriptFiles = measuredFiles.filter(({ path }) => extname(path).toLowerCase() === '.js');

  if (javaScriptFiles.length === 0) {
    throw new Error(`构建目录中没有 JavaScript 文件：${buildDirectory}`);
  }

  const largestJavaScript = javaScriptFiles.reduce((largestFile, currentFile) => (
    currentFile.rawBytes > largestFile.rawBytes ? currentFile : largestFile
  ));
  const largestGzipJavaScript = javaScriptFiles.reduce((largestFile, currentFile) => (
    currentFile.gzipBytes > largestFile.gzipBytes ? currentFile : largestFile
  ));

  return validateBuildMetrics({
    fileCount: measuredFiles.length,
    totalRawBytes: measuredFiles.reduce((total, file) => total + file.rawBytes, 0),
    totalGzipBytes: measuredFiles.reduce((total, file) => total + file.gzipBytes, 0),
    largestJavaScriptRawBytes: largestJavaScript.rawBytes,
    largestJavaScriptGzipBytes: largestGzipJavaScript.gzipBytes,
    largestJavaScriptFile: largestJavaScript.path,
    largestGzipJavaScriptFile: largestGzipJavaScript.path,
  });
};

/**
 * 根据增长比例确定单项指标状态。
 *
 * @param {number} growthRate 当前增长比例
 * @param {PerformanceBudget} budget 性能预算
 * @returns {'passed' | 'warning' | 'failed'} 单项指标状态
 */
const determineMetricStatus = (growthRate, budget) => {
  if (growthRate >= budget.failureGrowthRate) {
    return 'failed';
  }
  if (growthRate >= budget.warningGrowthRate) {
    return 'warning';
  }
  return 'passed';
};

/**
 * 根据单项结果确定整体状态。
 *
 * @param {Array<{ status: 'passed' | 'warning' | 'failed' }>} results 单项结果
 * @returns {'passed' | 'warning' | 'failed'} 整体状态
 */
const determineOverallStatus = (results) => {
  if (results.some((result) => result.status === 'failed')) {
    return 'failed';
  }
  if (results.some((result) => result.status === 'warning')) {
    return 'warning';
  }
  return 'passed';
};

/**
 * 比较当前构建指标和性能预算。
 *
 * @param {BuildMetrics} metrics 当前构建指标
 * @param {PerformanceBudget} budget 性能预算
 * @returns {{ status: 'passed' | 'warning' | 'failed', results: Array<{ key: string, label: string, current: number, baseline: number, growthRate: number, status: 'passed' | 'warning' | 'failed' }> }} 比较结果
 */
export const evaluatePerformanceBudget = (metrics, budget) => {
  const validatedMetrics = validateBuildMetrics(metrics);
  const validatedBudget = validatePerformanceBudget(budget);
  const results = METRIC_DEFINITIONS.map(({ key, label }) => {
    const current = validatedMetrics[key];
    const baseline = validatedBudget.baseline[key];
    const growthRate = (current - baseline) / baseline;
    const status = determineMetricStatus(growthRate, validatedBudget);

    return { key, label, current, baseline, growthRate, status };
  });
  const status = determineOverallStatus(results);

  return { status, results };
};

/**
 * 格式化字节数。
 *
 * @param {number} bytes 字节数
 * @returns {string} 中文可读字节文本
 */
const formatBytes = (bytes) => `${bytes.toLocaleString('zh-CN')} 字节（${(bytes / 1024).toFixed(2)} KiB）`;

/**
 * 格式化增长比例。
 *
 * @param {number} growthRate 增长比例
 * @returns {string} 带正负号的百分比
 */
const formatGrowthRate = (growthRate) => {
  const percentage = growthRate * 100;
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

/**
 * 获取检查状态的中文文本。
 *
 * @param {'passed' | 'warning' | 'failed'} status 检查状态
 * @returns {string} 状态文本
 */
const getStatusText = (status) => ({ passed: '通过', warning: '警告', failed: '失败' })[status];

/**
 * 生成 GitHub Actions 任务摘要。
 *
 * @param {BuildMetrics} metrics 当前构建指标
 * @param {{ status: 'passed' | 'warning' | 'failed', results: Array<{ label: string, current: number, baseline: number, growthRate: number, status: 'passed' | 'warning' | 'failed' }> }} evaluation 比较结果
 * @returns {string} Markdown 摘要
 */
export const createGithubSummary = (metrics, evaluation) => {
  const rows = evaluation.results.map((result) => (
    `| ${result.label} | ${result.current.toLocaleString('zh-CN')} | ${result.baseline.toLocaleString('zh-CN')} | ${formatGrowthRate(result.growthRate)} | ${getStatusText(result.status)} |`
  ));

  return [
    '## 构建性能预算',
    '',
    `最大未压缩 JavaScript：\`${metrics.largestJavaScriptFile}\``,
    `最大 Gzip JavaScript：\`${metrics.largestGzipJavaScriptFile}\``,
    '',
    '| 指标 | 当前字节数 | 基线字节数 | 变化 | 结论 |',
    '| --- | ---: | ---: | ---: | --- |',
    ...rows,
    '',
    `总体结论：**${getStatusText(evaluation.status)}**`,
    '',
  ].join('\n');
};

/**
 * 在终端输出构建体积比较结果。
 *
 * @param {BuildMetrics} metrics 当前构建指标
 * @param {{ status: 'passed' | 'warning' | 'failed', results: Array<{ label: string, current: number, baseline: number, growthRate: number, status: 'passed' | 'warning' | 'failed' }> }} evaluation 比较结果
 * @returns {void}
 */
const printTerminalSummary = (metrics, evaluation) => {
  console.log('构建性能预算检查');
  console.log(`构建文件：${metrics.fileCount} 个`);
  console.log(`最大未压缩 JavaScript：${metrics.largestJavaScriptFile}`);
  console.log(`最大 Gzip JavaScript：${metrics.largestGzipJavaScriptFile}`);
  evaluation.results.forEach((result) => {
    console.log(`${result.label}：${formatBytes(result.current)}，基线 ${formatBytes(result.baseline)}，变化 ${formatGrowthRate(result.growthRate)}，${getStatusText(result.status)}`);
  });
  console.log(`总体结论：${getStatusText(evaluation.status)}`);
};

/**
 * 输出 GitHub Actions 警告或错误注解。
 *
 * @param {{ results: Array<{ label: string, growthRate: number, status: 'passed' | 'warning' | 'failed' }> }} evaluation 比较结果
 * @returns {void}
 */
const printGithubAnnotations = (evaluation) => {
  evaluation.results
    .filter((result) => result.status !== 'passed')
    .forEach((result) => {
      const annotation = result.status === 'failed' ? 'error' : 'warning';
      console.log(`::${annotation} title=构建性能预算::${result.label}较基线增长 ${formatGrowthRate(result.growthRate)}`);
    });
};

/**
 * 执行构建性能预算检查。
 *
 * @param {string} projectDirectory 项目根目录
 * @returns {{ metrics: BuildMetrics, evaluation: ReturnType<typeof evaluatePerformanceBudget> }} 检查结果
 */
export const runBuildSizeCheck = (projectDirectory = process.cwd()) => {
  const budget = readPerformanceBudget(join(projectDirectory, 'performance-budget.json'));
  const metrics = measureBuildDirectory(join(projectDirectory, 'dist'));
  const evaluation = evaluatePerformanceBudget(metrics, budget);

  printTerminalSummary(metrics, evaluation);
  printGithubAnnotations(evaluation);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, createGithubSummary(metrics, evaluation), 'utf8');
  }

  return { metrics, evaluation };
};

/**
 * 判断当前文件是否作为命令行入口直接执行。
 *
 * @returns {boolean} 是否为命令行入口
 */
const isMainModule = () => Boolean(process.argv[1])
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule()) {
  try {
    const { evaluation } = runBuildSizeCheck();
    if (evaluation.status === 'failed') {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`构建性能预算检查失败：${message}`);
    process.exitCode = 1;
  }
}
