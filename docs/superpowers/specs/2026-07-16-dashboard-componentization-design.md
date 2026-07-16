# Dashboard 看板组件化设计

## 1. 背景与目标

`src/views/admin/DashboardView.vue` 当前包含概览指标、趋势图、告警、最近变更、快捷操作、数据请求、错误状态和页面样式，文件共 895 行。第一项整改只调整组件职责，不改变现有页面的视觉、文案、路由、请求行为和用户交互。

## 2. 设计原则

1. 父页面保留数据请求和页面级状态，避免在本次重构中改变服务层契约。
2. 展示组件只接收明确的 `props`，通过事件向父页面报告用户操作，不直接依赖服务层或路由。
3. 保留现有 class 名称和主要 DOM 层级，局部样式随对应展示组件迁移。
4. 空数据、错误数据、Mock 数据和刷新行为必须与重构前一致。

## 3. 组件边界

### `OverviewCards.vue`

- 输入：`DashboardOverview | null`。
- 负责：六张概览卡片、数值占位符和数字格式化展示。
- 不负责：请求、路由和用户会话。

### `TrendChart.vue`

- 输入：趋势数据、趋势配置和当前激活的趋势键。
- 输出：`update:activeTrend` 事件。
- 负责：趋势切换、当前指标摘要、Y 轴刻度、柱状图和空趋势展示。
- 不负责：加载趋势数据和处理服务错误。

### `AlertList.vue`

- 输入：`AlertInterface[]`。
- 输出：`select-interface` 事件。
- 负责：告警图标、告警文本、时间和空状态。

### `ChangeList.vue`

- 输入：`ChangedInterface[]`。
- 输出：`select-interface` 事件。
- 负责：变更类型文本、变更名称、时间和空状态。

### `QuickActions.vue`

- 输出：`refresh` 事件。
- 负责：管理接口、接口广场、刷新数据和返回首页四个快捷入口。
- 路径、文案、图标和交互保持现状。

### `DashboardView.vue`

- 负责：欢迎语、用户名称、四组 Dashboard 服务并行请求、加载结果归并、数据源状态、刷新、路由跳转、Mock/错误提示和子组件组合。
- 不负责：各看板区块的展示细节和展示算法。

## 4. 数据流与错误处理

```text
DashboardView
  -> dashboardService.getOverview/getTrends/getAlerts/getChanges
  -> 页面状态（overview/trends/alerts/changes/dataSource）
  -> 展示组件 props
  <- 展示组件事件（趋势切换、接口选择、刷新）
```

进入加载流程时继续清空旧数据并使用空趋势数据；四个请求仍通过 `Promise.all` 并行执行。结果来源判定顺序保持为 `error`、`mock`、`real`。请求异常时继续显示错误提示和不可用指标占位符，不展示伪造数据。

子组件不执行请求，也不吞掉异常。接口选择事件由父页面统一转换为 `/interface/:id` 路由跳转，刷新事件由父页面重新执行原有加载函数。

## 5. 样式迁移

保留现有 class 名称、颜色、间距、响应式规则和 DOM 结构。概览、趋势、告警、变更、快捷操作相关的 scoped 样式分别移动到对应组件；父页面保留整体 Dashboard 布局、区块网格和 Mock/错误提示样式。迁移后不引入新的视觉设计或公共样式抽象。

## 6. 测试与验收

1. 保留 Dashboard 错误状态测试，验证六张概览卡片仍显示 `--`，并显示错误提示。
2. 增加概览组件的正常数据和空数据测试。
3. 增加趋势组件的趋势切换、最新值、空数据和柱高计算测试。
4. 增加告警、变更组件的列表渲染、空状态和接口选择事件测试。
5. 增加快捷操作组件的四个入口和刷新事件测试。
6. 执行 `npm test`、`npm run typecheck` 和 `npm run build`。
7. 通过页面级测试确认四个服务仍并行调用，错误、Mock、刷新和路由跳转行为不变。

## 7. 变更文件

```text
src/views/admin/DashboardView.vue
src/components/dashboard/OverviewCards.vue
src/components/dashboard/TrendChart.vue
src/components/dashboard/AlertList.vue
src/components/dashboard/ChangeList.vue
src/components/dashboard/QuickActions.vue
src/views/admin/__tests__/DashboardView.test.ts
src/components/dashboard/__tests__/OverviewCards.test.ts
src/components/dashboard/__tests__/TrendChart.test.ts
src/components/dashboard/__tests__/AlertList.test.ts
src/components/dashboard/__tests__/ChangeList.test.ts
src/components/dashboard/__tests__/QuickActions.test.ts
```
