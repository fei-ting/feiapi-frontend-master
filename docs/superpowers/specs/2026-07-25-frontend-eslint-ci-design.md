# 前端 ESLint 与 CI 门禁整改设计

## 背景

前端已经具备依赖安全审计、TypeScript 类型检查、Vitest 单元测试与覆盖率门禁、Vite 构建、构建体积门禁和 Playwright 端到端测试，但没有实际运行的 ESLint。现有 `.eslintrc.js` 仍引用已经移除的 React/Umi 依赖 `@umijs/fabric`，项目又启用了 ES Module，因此该配置既不会被现有脚本或 CI 使用，也无法直接兼容现代 ESLint。

本次整改补齐 Vue 3 和 TypeScript 静态检查，使代码质量问题能够在类型检查和测试之前被发现，并将 ESLint 作为阻断式 CI 门禁。

## 目标

- 使用 ESLint Flat Config 替换无效的旧配置。
- 启用 JavaScript、TypeScript 和 Vue 3 官方推荐规则。
- 检查生产代码、测试代码、构建配置和项目脚本。
- 修复推荐规则发现的全部存量错误和警告，不以白名单或降低规则强度绕过。
- 在 CI 的 TypeScript 类型检查之前执行 ESLint，失败时阻止后续流程。
- 保持现有类型检查、覆盖率、构建、体积预算和端到端测试门禁有效。

## 非本次范围

- 不启用需要 TypeScript 类型信息的严格或风格型规则集。
- 不把 ESLint 用作代码格式化工具，不引入与 Prettier 重叠的格式规则。
- 不重构与静态检查结果无关的业务代码。
- 不处理仍引用 `@umijs/fabric` 的旧 Prettier 配置；该问题不影响本次 ESLint 门禁，并应在独立格式化整改中处理。
- 不统一或删除项目中现存的其他包管理器锁文件；CI 继续以 Yarn 锁文件为准。

## 技术选型

采用以下固定版本，避免 CI 因上游版本漂移产生不可复现结果：

- `eslint@10.8.0`
- `@eslint/js@10.0.1`
- `typescript-eslint@8.65.0`
- `eslint-plugin-vue@10.10.0`
- `globals@17.7.0`

ESLint 10.8.0 要求 Node.js `^20.19.0`、`^22.13.0` 或 `>=24`，兼容本地 Node.js 20.20.2。GitHub Actions 使用 Node.js 22 的当前补丁版本，满足同一约束。`typescript-eslint@8.65.0` 支持 ESLint 10 和 TypeScript `>=4.8.4 <6.1.0`，兼容项目当前 TypeScript 6.0.3。

## 配置设计

新增根目录 `eslint.config.js`，使用项目现有 ES Module 语法导出 Flat Config。配置按职责分为以下部分：

1. 全局忽略生成物、依赖目录、报告目录和不属于本次整改的旧 Prettier 配置。
2. 对 JavaScript 和 ECMAScript Module 文件启用 `@eslint/js` 推荐规则。
3. 对 TypeScript 文件启用 `typescript-eslint` 推荐规则。
4. 对 Vue 单文件组件启用 `eslint-plugin-vue` 的 Vue 3 推荐规则，并使用 TypeScript 解析器处理 `<script setup lang="ts">`。
5. 按文件环境声明浏览器、Node.js 和测试所需的全局变量，避免把真实未声明变量误判为合法环境变量。

全局忽略范围包括：

- `node_modules/`
- `dist/`
- `coverage/`
- `playwright-report/`
- `test-results/`
- `.eslintcache`
- `.prettierrc.js`

删除 `.eslintrc.js` 和 `.eslintignore`，避免旧配置与 Flat Config 并存。忽略项全部迁移到 `eslint.config.js`。

## 规则强度

采用官方推荐规则集，不额外引入个人风格偏好。`package.json` 增加：

```json
"lint": "eslint . --max-warnings 0"
```

`--max-warnings 0` 保证警告也会使命令失败，避免 CI 长期积累已知问题。现有代码中的 ESLint 禁用注释必须指向明确规则；只有确有接口边界原因且无法通过更准确类型表达时才保留，并在代码旁用中文说明原因。

## 存量问题处理

首次运行 `yarn lint` 后，按以下顺序处理结果：

1. 修复解析、环境和配置错误，确认文件使用了正确的解析器与全局变量。
2. 修复未使用导入、未使用变量、无效分支和 Vue 模板问题。
3. 对可以通过准确类型表达的问题修复类型，不使用 `any` 或禁用规则掩盖。
4. 对仅由格式差异产生的问题不引入额外格式规则，也不批量重排无关代码。
5. 每轮修复后重新执行 ESLint，并复跑类型检查和相关测试，防止静态修复改变业务行为。

本次不预设需要修改的业务源码。只有首次 ESLint 输出能够证明文件违反已确认的推荐规则时，才对该文件做最小修改，并在实施结果中逐项列明。

## CI 流程

在 `.github/workflows/ci-frontend.yml` 的冻结锁文件安装之后、TypeScript 类型检查之前增加阻断步骤：

```text
依赖安全审计
  -> 冻结锁文件安装
  -> ESLint 静态检查
  -> TypeScript 类型检查
  -> 单元测试与覆盖率
  -> 构建
  -> 构建体积门禁
  -> Playwright E2E
```

ESLint 失败时工作流保持失败。现有报告上传步骤继续使用 `if: always()` 和 `continue-on-error: true`，不改变原有测试失败产物策略。

## 验证方案

实施后依次执行：

1. `yarn lint`
2. `yarn typecheck`
3. `yarn coverage`
4. `yarn build`
5. `yarn check:size`
6. `yarn e2e`
7. `yarn audit:dependencies`

同时检查 GitHub Actions 工作流语法和步骤顺序。依赖安装使用 `yarn install --frozen-lockfile` 复核锁文件完整性，不以更新锁文件的方式掩盖 CI 安装失败。

## 验收标准

- `yarn lint` 以零错误、零警告退出。
- `.ts`、`.vue` 和 `.mjs` 文件均被实际检查。
- Vue 3 与 TypeScript 推荐规则实际生效，故意引入可识别违规时命令能够失败。
- CI 在类型检查之前运行 `yarn lint`，Lint 失败能够阻止后续必要门禁。
- `yarn typecheck`、`yarn coverage`、`yarn build`、`yarn check:size`、`yarn e2e` 和 `yarn audit:dependencies` 全部通过。
- 不通过规则白名单、降低规则强度或弱化现有测试使检查通过。
- 审查报告第 11.3 项更新为 ESLint 整改完成，并记录本地与 CI 验证边界。

## 预计修改文件

确定修改：

- `package.json`
- `yarn.lock`
- `.github/workflows/ci-frontend.yml`
- 外层项目的 `doc/前端代码架构审查报告.md`

新增：

- `eslint.config.js`
- `docs/superpowers/specs/2026-07-25-frontend-eslint-ci-design.md`

删除：

- `.eslintrc.js`
- `.eslintignore`

首次执行 ESLint 后，只补充修改被推荐规则准确检出的源码文件。

## Git 流程

全部工作在从 `dev` 创建的 `feature/frontend-eslint-ci` 分支完成。设计文档与实现分别使用中文提交说明提交；合并前执行多维代码审查和完整验证。通过后将 feature 分支合并回 `dev`，再删除 feature 分支。工作区中与本任务无关的既有修改始终不纳入本次提交。
