# 页面与响应式样式边界整改设计

## 1. 背景

审查报告 8.1 和 8.2 指出，`src/styles/base.css` 在应用启动时导入全部页面样式，`src/styles/responsive.css` 又集中保存多个页面的响应式规则。该结构使路由懒加载无法拆分页面 CSS，也使基础样式与响应式样式分属不同文件，页面样式所有权不清晰。

两项问题共享同一条样式依赖链，因此合并整改，避免先迁移页面样式、再重复迁移响应式规则。

## 2. 目标与边界

本次整改目标如下：

1. 应用启动入口只加载设计令牌、浏览器重置、应用布局和通用组件样式。
2. 页面与功能样式由对应的懒加载视图或布局负责引入。
3. 页面响应式规则与对应基础规则放在同一个样式模块中。
4. 真正跨应用的响应式规则继续保留在全局响应式文件中。
5. 不修改现有模板类名、视觉设计和交互行为。
6. 不引入 CSS Modules、CSS 预处理器或新的构建依赖。

## 3. 样式分层

### 3.1 全局核心层

`global.css` 和 `base.css` 只保留以下依赖：

- `tokens.css`：设计令牌。
- `reset.css`：浏览器重置。
- `layout.css`：应用壳层、容器和跨页面布局基础。
- `components/navigation.css`：全局导航组件。
- `components/cards.css`：跨页面复用卡片。
- `components/common.css`：按钮、表单、表格、状态和其他通用组件。
- `responsive.css`：页头、导航、容器和通用网格等真正跨应用的响应式规则。

当前错误放在页面文件中的跨页面规则将迁移到相应的通用组件文件。例如，多个页面使用的按钮规则不能继续只由 `home.css` 提供。

### 3.2 页面与布局层

页面样式通过路由视图或布局组件脚本中的静态 CSS 导入进入对应异步模块，例如 `import '@/styles/pages/home.css'`：

| 样式模块 | 所有者 | 加载边界 |
| --- | --- | --- |
| `pages/home.css` | `HomeView.vue` | 首页路由 |
| `pages/market.css` | `InterfaceMarketView.vue` | 接口广场路由 |
| `pages/detail.css` | `InterfaceDetailView.vue` | 接口详情路由 |
| `pages/invoke.css` | `InterfaceInvokeView.vue` | 在线调用路由 |
| `pages/admin.css` | `AdminLayout.vue`、`ProfileLayout.vue` | 后台与个人中心共享布局 |
| `pages/admin-tools.css` | `AdminLayout.vue` | 后台功能路由组 |
| `pages/profile.css` | `ProfileLayout.vue` | 个人中心路由组 |

`detail.css` 与 `invoke.css` 中由详情页、调用页和 `InterfaceDocumentation.vue` 共同使用的接口文档规则，将抽取到 `src/styles/features/interface-documentation.css`，并由两个路由入口共同加载，避免让调用页依赖详情页私有样式。

### 3.3 响应式规则

`responsive.css` 中的规则按所有权迁移：

- 首页 Hero、统计和信息网格规则移入 `home.css`。
- 市场卡片网格和搜索头部规则移入 `market.css`。
- 接口详情和文档规则移入详情或接口文档共享样式。
- 在线调用布局和结果面板规则移入 `invoke.css`。
- 后台、个人中心布局规则移入 `admin.css`。
- 后台文档编辑器规则移入 `admin-tools.css`。
- 页头、导航、容器和通用网格规则继续保留在 `responsive.css`。

## 4. 死样式处理

`pages/dashboard.css` 中的 `.fei-analysis-grid`、`.fei-stat-card`、`.fei-stat-card-value` 和 `.fei-stat-card-label` 在当前生产源码中均无引用。Dashboard 页面和子组件已经使用各自的 `scoped` 样式，因此删除该死样式文件，不为其建立新的加载入口。

## 5. 验证设计

新增 `src/styles/__tests__/styleArchitecture.test.ts` 样式架构测试，至少验证：

1. `base.css` 不再导入 `pages/` 目录中的文件。
2. 每个页面或布局入口显式导入其负责的样式模块。
3. `responsive.css` 不再包含已迁移的页面专属选择器。
4. 已删除的 Dashboard 死样式选择器不再出现在生产样式中。

执行以下验证：

- 样式架构定向测试。
- 全量单元测试。
- TypeScript 类型检查。
- 覆盖率门禁。
- 生产构建。
- 检查构建产物，确认页面 CSS 生成独立异步资源，而不是全部进入启动 CSS。
- 对首页、接口广场、接口详情、在线调用、后台和个人中心执行桌面端与移动端视觉回归检查。

## 6. 文件范围

预计涉及以下文件：

- `src/styles/base.css`
- `src/styles/responsive.css`
- `src/styles/components/*.css`
- `src/styles/pages/*.css`
- 新增的接口文档功能共享样式文件
- 对应的 `src/views/**/*.vue` 与 `src/layouts/*.vue`
- 新增的样式架构测试
- `doc/前端代码架构审查报告.md`

## 7. 验收标准

- 应用启动样式入口不直接或间接导入页面专属样式。
- 页面基础样式和页面响应式规则具有同一所有者。
- 访问一个路由不会在首屏加载全部其他页面 CSS。
- 页面视觉和响应式行为与整改前一致。
- 定向测试、全量测试、覆盖率、类型检查和生产构建全部通过。
