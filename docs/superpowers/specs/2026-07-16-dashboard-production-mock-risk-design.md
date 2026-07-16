# Dashboard 生产环境 Mock 风险修复设计

## 背景

Dashboard 部分后端接口暂未实现，前端需要在开发阶段使用 Mock 数据完成页面联调。后端接口将逐步补齐，前端必须优先使用真实接口，并在接口可用后自动切换到真实数据。

当前服务在真实接口成功返回 `null` 时会使用 Mock 数据，却把来源标记为 `real`。生产环境可能因此展示没有业务依据的运营指标。页面在错误状态下还会把缺失概览转换为零值，容易被误认为真实统计结果。

## 目标

1. 保留 Mock 作为后端接口未完成期间的开发适配能力。
2. 始终优先请求真实接口，使后端接口上线后无需修改页面即可自动切换。
3. 仅允许在开发环境且 `VITE_ENABLE_MOCK=true` 时降级到 Mock。
4. 生产环境或未启用 Mock 时，请求异常和空响应统一进入显式错误状态。
5. 错误状态下概览指标显示 `--`，不展示 Mock 数据或可能被误解的零值。
6. 保持 `DataResult<T>` 返回契约稳定，便于后续删除 Mock 实现。

## 非目标

1. 本次不实现缺失的后端 Dashboard 接口。
2. 本次不删除 `dashboardMock.ts` 和现有 Mock 数据。
3. 本次不调整 Dashboard 的整体布局、图表样式和业务字段。
4. 本次不引入按接口划分的多个 Mock 环境变量。

## 方案选择

采用“真实接口优先、开发环境显式降级 Mock”的自动过渡方案。

不采用按接口配置独立 Mock 开关，因为真实请求优先已经支持接口逐个上线，额外开关会增加配置维护成本。不采用 Mock 优先方案，因为它会绕过已经实现的真实接口，延迟暴露联调问题。

## 数据流

每个 Dashboard 数据请求遵循相同流程：

```text
请求真实接口
  ├─ 返回非 null 数据
  │    └─ 返回 data: 真实数据，source: real
  ├─ 请求异常或返回 null，且 DEV && VITE_ENABLE_MOCK=true
  │    └─ 返回 data: Mock 数据，source: mock
  └─ 请求异常或返回 null，且未启用 Mock
       └─ 返回 data: null，source: error
```

真实接口返回空数组属于有效业务数据，不触发 Mock。只有请求异常或顶层数据为 `null`、`undefined` 时才视为接口暂不可用。

## 服务层设计

在 `dashboard.ts` 内集中封装真实请求和 Mock 降级判断，四个 Dashboard 数据方法复用相同逻辑：

- `getOverview()`
- `getTrends()`
- `getAlerts()`
- `getChanges()`

服务层继续返回 `DataResult<T>`。Mock 工厂只在 `isMockEnabled()` 返回 `true` 时执行，任何 Mock 数据都必须使用 `source: 'mock'`。未启用 Mock 时不得引用 Mock 数据作为空值保护。

后端接口逐个上线后，对应真实请求会直接返回 `source: 'real'`。后端全部完成时，只需关闭 `VITE_ENABLE_MOCK`；后续删除 Mock 文件时，页面消费的 `DataResult<T>` 契约保持不变。

## 页面设计

`DashboardView.vue` 的概览状态使用 `DashboardOverview | null` 表达数据是否可用，不再用全零对象表示错误状态。

指标展示规则：

- 有真实或 Mock 概览数据时展示数值。
- 概览数据为空时，六个指标统一显示 `--`。
- 趋势数据为空时保持空图表状态。
- 告警和变更数据为空时保持空列表状态。
- 任一分区来源为 `error` 时保留现有错误提示。
- 任一分区来源为 `mock` 且没有错误时保留开发模式提示。

页面不根据具体数值判断数据来源，只使用结构化的 `source` 字段。

## 环境配置

`VITE_ENABLE_MOCK` 作为可选的公开构建配置：

- 开发联调需要 Mock 时设置为 `true`。
- 未设置或设置为其他值时禁用 Mock。
- 即使生产构建错误地设置为 `true`，`import.meta.env.DEV` 仍会阻止 Mock 生效。

在 `src/env.d.ts` 中声明该环境变量，并通过 `.env.example` 记录使用方式。现有本地 `.env` 不做修改，避免擅自改变开发者本地行为。

## 测试设计

服务层测试覆盖：

1. 真实接口成功时返回真实数据和 `real` 来源。
2. 真实接口异常、开发 Mock 已启用时返回 Mock 和 `mock` 来源。
3. 真实接口返回 `null`、开发 Mock 已启用时返回 Mock 和 `mock` 来源。
4. 未启用 Mock 时，请求异常返回 `null` 和 `error` 来源。
5. 未启用 Mock 时，空响应返回 `null` 和 `error` 来源。
6. 空数组作为有效真实数据返回，不触发 Mock。

页面测试覆盖：

1. 错误状态下六个概览指标显示 `--`。
2. 错误状态不显示 Mock 指标。
3. Mock 状态正常显示数据来源提示。

完成后执行完整单元测试、TypeScript 类型检查和生产构建。

## 拟修改文件

- `src/services/dashboard.ts`
- `src/views/admin/DashboardView.vue`
- `src/services/__tests__/dashboard.test.ts`
- `src/views/admin/__tests__/DashboardView.test.ts`
- `src/env.d.ts`
- `.env.example`

## Git 流程

开发在 `feature/fix-dashboard-production-mock-risk` 分支完成。验证通过后使用中文提交说明并合并回 `dev`，随后删除临时 feature 分支。
