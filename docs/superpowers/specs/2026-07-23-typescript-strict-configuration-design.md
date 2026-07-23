# TypeScript 严格配置整改设计

## 背景

前端工程已启用 `strict: true`，当前类型检查通过，但 `tsconfig.json` 仍使用已弃用的 `moduleResolution: "Node"`，并通过 `ignoreDeprecations: "6.0"` 隐藏提示。`exclude` 还保留 18 个已经不存在的 Umi/React 历史路径。

以下不属于 `strict` 自动启用范围的增强选项尚未配置：

- `noUncheckedIndexedAccess`
- `noImplicitOverride`
- `exactOptionalPropertyTypes`

命令行覆盖验证结果如下：

| 验证项 | 结果 |
| --- | --- |
| 当前基线类型检查 | 通过 |
| `moduleResolution: "Bundler"` | 通过 |
| `noImplicitOverride` | 通过 |
| `noUncheckedIndexedAccess` | 4 个错误 |
| `exactOptionalPropertyTypes` | 14 个错误 |

## 目标

1. 将模块解析策略迁移到适配 Vite 的 `Bundler` 模式。
2. 启用三个增强严格选项，并修复全部现有类型错误。
3. 删除无效的历史 `exclude` 配置和不再需要的弃用提示屏蔽。
4. 保持当前页面行为、API 请求语义、默认展示和错误上报内容不变。
5. 通过类型检查、全量单元测试、覆盖率门禁和生产构建。

## 非目标

- 不升级 TypeScript、Vite 或其他依赖。
- 不调整业务接口、页面交互、视觉样式或路由。
- 不借本次整改重构无关模块。
- 不把可选字段批量改成必填字段，也不通过宽泛类型绕过严格检查。

## 配置设计

`tsconfig.json` 调整如下：

1. 将 `moduleResolution` 从 `Node` 改为 `Bundler`。
2. 删除 `ignoreDeprecations`，不再隐藏旧模块解析策略的弃用提示。
3. 显式启用 `noUncheckedIndexedAccess`、`noImplicitOverride` 和 `exactOptionalPropertyTypes`。
4. 删除全部 18 个不存在的 Umi/React 历史 `exclude` 路径；现有 `include` 已明确限定参与编译的 Vue 前端源码。

## 索引访问整改

### 趋势图最新值

`TrendChart.vue` 在读取数组末项前已经判断数组非空，但 TypeScript 无法把该判断跨越响应式访问稳定地传播到后续索引表达式。整改时先保存末项并做显式空值保护，空值仍返回 `-`，避免使用无依据的非空断言。

### 弹窗焦点陷阱

`useDialogFocusTrap.ts` 在确认可聚焦元素非空后读取首尾元素。整改时继续保留长度检查，并对首尾元素增加显式守卫，使 DOM 在处理过程中发生变化时也不会调用空值的 `focus()`。

### 默认配额类型

`useQuota.ts` 的配额选项业务上必须至少包含一个默认项。配置改为只读非空元组，使类型系统能够表达该不变量，避免重复定义默认项或使用无依据断言。

## 可选属性整改

### 请求对象和领域对象

对 `InterfaceConfigModal.vue`、`useInterfaceInvoke.ts`、`errorReporter.ts` 和 `InterfaceDocMaintenanceView.vue` 采用“值不存在时省略属性”的策略：

- 空接口展示地址不写入 `url`。
- 文档可选参数不存在时不写入对应字段。
- 错误堆栈和 Vue 上下文不存在时不写入错误报告。
- 父参数关系被清除时删除 `parentParamKey`，不保留值为 `undefined` 的属性。

该策略使序列化结果与可选字段语义一致，避免把“字段缺失”和“字段显式为 undefined”混为一谈。

### Vue 组件属性

`UserAvatar.vue`、`MethodTag.vue` 和 `StatusTag.vue` 当前允许模板绑定后端可能缺失的字段，组件内部已有默认头像、默认请求方法和默认状态展示。对应 props 将显式声明允许 `undefined`，准确表达 Vue 模板的实际调用边界，不要求所有调用方重复补默认值。

## 测试设计

1. 复用趋势图、配额、确认弹窗、头像、错误上报和接口文档维护现有测试，确认默认行为不变。
2. 补充或调整请求对象断言，确认不存在的可选字段被省略。
3. 补充错误报告断言，确认有值的上下文字段保留、无值字段不出现在报告对象中。
4. 补充接口文档父子关系断言，确认移除父节点后保存请求不携带 `parentParamKey`。
5. 执行 `yarn typecheck`，确保全部严格选项通过。
6. 执行 `yarn test` 和 `yarn coverage`，确保现有行为及覆盖率门禁不回退。
7. 执行 `yarn build`，验证 Vue 类型检查和 Vite 生产构建。

## 预计修改文件

- `tsconfig.json`
- `src/components/dashboard/TrendChart.vue`
- `src/composables/useDialogFocusTrap.ts`
- `src/composables/useQuota.ts`
- `src/components/admin/InterfaceConfigModal.vue`
- `src/components/UserAvatar.vue`
- `src/components/MethodTag.vue`
- `src/components/StatusTag.vue`
- `src/composables/useInterfaceInvoke.ts`
- `src/services/errorReporter.ts`
- `src/views/admin/InterfaceDocMaintenanceView.vue`
- `src/components/admin/__tests__/InterfaceConfigModal.test.ts`（新增）
- `src/components/dashboard/__tests__/TrendChart.test.ts`
- `src/components/common/__tests__/ConfirmDialog.test.ts`
- `src/components/__tests__/UserAvatar.test.ts`
- `src/composables/__tests__/useQuota.test.ts`
- `src/composables/__tests__/useBusinessLogic.test.ts`
- `src/services/__tests__/errorReporter.test.ts`
- `src/views/admin/__tests__/InterfaceDocMaintenanceView.test.ts`
- `src/views/__tests__/InterfaceDetailView.test.ts`
- `src/views/__tests__/InterfaceInvokeView.test.ts`
- `src/views/__tests__/InterfaceMarketView.test.ts`
- `src/views/profile/__tests__/InvocationRecordsView.test.ts`

仓库外的 `doc/前端代码架构审查报告.md` 在实现和验证完成后更新 10.3，不纳入前端仓库提交。

## Git 流程

1. 从前端 `dev` 分支创建 `feature/typescript-strict-config`。
2. 先提交本设计文档。
3. 完成配置、源码和测试修改后提交实现。
4. 人工审查并通过全部验证后合并回 `dev`。
5. 删除临时 feature 分支。
