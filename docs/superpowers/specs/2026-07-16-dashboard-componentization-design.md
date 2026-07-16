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

```ts
interface OverviewCardsProps {
  overview: DashboardOverview | null;
}
```

### `TrendChart.vue`

- 输入：趋势数据和当前激活的趋势键。
- 输出：`update:activeTrend` 事件。
- 负责：趋势切换、当前指标摘要、Y 轴刻度、柱状图和空趋势展示。
- 不负责：加载趋势数据和处理服务错误。

```ts
interface TrendChartProps {
  trends: DashboardTrends;
  activeTrend: keyof DashboardTrends;
}

interface TrendChartEmits {
  (event: 'update:activeTrend', key: keyof DashboardTrends): void;
}
```

固定的趋势标签、单位、颜色和数值样式由组件内部的 `TrendTabConfig` 类型和配置常量维护，不作为 `props` 暴露，避免父页面继续承担展示规则。

### `AlertList.vue`

- 输入：`AlertInterface[]`。
- 输出：`select-interface` 事件。
- 负责：告警图标、告警文本、时间和空状态。

```ts
interface AlertListProps {
  alerts: AlertInterface[];
}

interface AlertListEmits {
  (event: 'select-interface', id: number): void;
}
```

### `ChangeList.vue`

- 输入：`ChangedInterface[]`。
- 输出：`select-interface` 事件。
- 负责：变更类型文本、变更名称、时间和空状态。

```ts
interface ChangeListProps {
  changes: ChangedInterface[];
}

interface ChangeListEmits {
  (event: 'select-interface', id: number): void;
}
```

### `QuickActions.vue`

- 输出：`refresh` 事件。
- 负责：管理接口、接口广场、刷新数据和返回首页四个快捷入口。
- 路径、文案、图标和交互保持现状。

```ts
interface QuickActionsEmits {
  (event: 'refresh'): void;
}
```

### `DashboardView.vue`

- 负责：欢迎语、用户名称、四组 Dashboard 服务并行请求、加载结果归并、数据源状态、刷新、路由跳转、Mock/错误提示和子组件组合。
- 不负责：各看板区块的展示细节和展示算法。

### 组件依赖关系

```text
DashboardView
├── OverviewCards   无子依赖
├── TrendChart      无子依赖
├── AlertList       无子依赖
├── ChangeList      无子依赖
└── QuickActions    仅依赖 RouterLink
```

五个展示组件之间禁止相互依赖，也不直接调用 Store、Service 或 `useRouter`。接口跳转和数据刷新统一由父页面响应组件事件。

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

具体边界规则如下：

| 场景 | 展示规则 |
| ---- | -------- |
| `overview === null` | 六张概览卡片全部显示 `--` |
| 概览数据完整 | `todayInvocations` 保留千位缩写，其余字段原样显示 |
| 概览字段运行时缺失 | 缺失字段防御性显示 `--`，但正式 Props 类型不放宽为 `Partial` |
| 趋势数据为空 | 最新值显示 `-`，Y 轴最大值为 100，不渲染柱和时间标签 |
| 告警数组为空 | 显示“暂无告警” |
| 变更数组为空 | 显示“暂无变更” |
| 任一服务来源为 `error` | 保留其他有效数据，并显示页面级错误提示 |
| 没有错误且任一服务来源为 `mock` | 显示页面级 Mock 提示 |
| `Promise.all` 抛出异常 | 所有数据维持清空状态，并显示页面级错误提示 |

子组件不维护独立 `loading` 状态。父页面进入加载流程时沿用当前行为，先清空数据，由各组件显示占位符或空状态；本次重构不增加骨架屏、禁用刷新或请求防抖。

## 5. 样式迁移

保留现有 class 名称、颜色、间距、响应式规则和 DOM 结构。所有新增组件继续使用 `scoped` 样式，不新增 Dashboard 全局样式文件。

| 样式范围 | 归属文件 |
| -------- | -------- |
| `.fei-dashboard`、欢迎区域、双栏网格、Mock 和错误提示 | `DashboardView.vue` |
| `.fei-overview-*` 及概览响应式规则 | `OverviewCards.vue` |
| `.fei-trend-*`、`.fei-chart-*` 及趋势响应式规则 | `TrendChart.vue` |
| `.fei-alert-*` | `AlertList.vue` |
| `.fei-change-*` | `ChangeList.vue` |
| `.fei-quick-*` 及快捷操作响应式规则 | `QuickActions.vue` |

全局已有的 `.fei-card`、`.fei-card-header`、`.fei-card-body`、`.fei-section-title` 和 `.fei-empty` 继续复用，不复制到子组件。`.fei-dashboard__section` 在需要的组件根节点保留局部定义，接受少量样式重复，不额外引入只负责包装样式的抽象组件。

## 6. 测试与验收

| 测试对象 | 测试场景 |
| -------- | -------- |
| `OverviewCards` | 六张卡片显示完整数据；`overview` 为 `null` 时全部显示 `--`；运行时字段缺失时仅缺失项显示 `--`；调用量保持千位格式化 |
| `TrendChart` | 默认趋势；切换事件及参数；最新值；Y 轴取整；柱高；空趋势展示 |
| `AlertList` | 完整字段渲染；空状态；告警图标映射；点击事件携带接口 ID |
| `ChangeList` | 完整字段渲染；空状态；类型文案映射；点击事件携带接口 ID |
| `QuickActions` | 三个固定路由入口；刷新事件；四项原有文案 |
| `DashboardView` | 四个服务在挂载时调用；错误来源优先；Mock 来源次优先；异常捕获；刷新重新请求；接口选择触发路由跳转 |

保留现有 Dashboard 错误状态回归测试。实现完成后执行 `npm test`、`npm run typecheck` 和 `npm run build`，全部通过后才允许合并。

## 7. 文件规模目标

行数用于检查拆分结果是否偏离设计，不作为要求精确命中的机械指标。由于现有 496 行局部样式将随组件迁移，趋势组件的合理规模会高于仅统计模板和脚本时的估算。

| 文件 | 目标行数 |
| ---- | -------: |
| `DashboardView.vue` | 180～240 |
| `OverviewCards.vue` | 110～150 |
| `TrendChart.vue` | 280～360 |
| `AlertList.vue` | 110～150 |
| `ChangeList.vue` | 100～140 |
| `QuickActions.vue` | 90～130 |

验收底线为 `DashboardView.vue` 不超过 250 行，任一展示组件不超过 400 行，并且不存在跨领域职责。

## 8. 变更文件

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
