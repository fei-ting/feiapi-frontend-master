# Toast 生命周期重复逻辑整改设计

## 1. 背景与目标

审查报告 6.4 指出，项目页面层已经基本通过 `show-toast` 事件将通知交给所属布局，登录和注册页面也已经使用 `src/composables/useToast.ts`，但 `AppLayout.vue`、`AdminLayout.vue` 和 `ProfileLayout.vue` 仍分别维护相同的 Toast 状态与隐藏定时器。

三份布局实现不会在新通知显示前清理旧定时器。连续触发通知时，旧定时器可能提前关闭后显示的新通知；布局卸载时也不会主动清理 Toast 定时器。

本次整改保留布局级通知作用域和现有页面事件链路，统一由 `useToast()` 管理三个布局的 Toast 状态、自动关闭、连续覆盖和卸载清理。登录和注册页面的独立认证通知保持不变，不引入全局 Store、通知队列或跨布局持久化。

## 2. 设计原则

1. `useToast.ts` 是 Toast 状态与生命周期的唯一实现。
2. 页面继续通过 `show-toast` 事件把通知交给当前布局，不直接依赖全局通知状态。
3. 每个布局只拥有一个 Toast 实例，布局切换时不保留旧通知。
4. 连续通知采用“最新通知覆盖旧通知”策略，不建立消息队列。
5. 新通知显示前必须取消旧隐藏定时器，保证完整展示时长。
6. 布局卸载时必须取消定时器，避免卸载后继续修改状态。
7. `ToastMessage.vue` 继续只负责展示，不承担状态或生命周期。
8. 不改变现有通知文案、类型、默认时长和页面路由行为。

## 3. 通知作用域

本次采用布局级通知实例：

```text
AppLayout
└── useToast -> ToastMessage

AdminLayout
└── useToast -> ToastMessage

ProfileLayout
└── useToast -> ToastMessage

LoginView / RegisterView
└── 继续使用各自现有的 useToast
```

任意时刻只会挂载一个业务布局，因此三个布局不会同时展示通知。布局级实例可以避免通知在普通页面、后台和个人中心之间跨路由残留，也不会把局部交互反馈扩大为全局可变状态。

## 4. `useToast` 生命周期

### 状态

`ToastState` 继续包含：

- `visible`：是否显示。
- `type`：`success`、`error` 或 `info`。
- `message`：通知文本。

类型及每个字段继续使用中文注释。

### `showToast()`

显示通知时依次执行：

1. 如果已有隐藏定时器，先取消旧定时器。
2. 更新通知文本和类型。
3. 将通知设为可见。
4. 创建新的自动关闭定时器。
5. 定时器触发后隐藏通知并清空定时器引用。

未传入通知类型时继续使用 `info`。默认展示时长继续为 2400ms；登录和注册页面继续显式使用 2200ms。

### `hideToast()`

手动隐藏时取消当前定时器、清空定时器引用并将通知设为不可见。重复调用必须安全，不产生异常或额外定时器。

### 组件卸载

在有效组件实例中通过 `onBeforeUnmount()` 调用 `hideToast()`。组合式函数增加组件实例判断，避免在独立纯逻辑测试或非组件上下文中注册生命周期钩子产生 Vue 警告。

## 5. 布局迁移

### 共同修改

三个布局统一执行：

```ts
const { toast, showToast } = useToast();
```

并删除：

- `reactive` 的 Toast 状态对象。
- 页面内 Toast 专用 `showToast()` 实现。
- Toast 专用 `window.setTimeout()`。
- 只负责再次调用 `showToast()` 的 `handleShowToast()` 包装函数。

子路由组件事件直接绑定为：

```vue
<component :is="Component" @show-toast="showToast" />
```

三个布局保留 `defineExpose({ showToast })`，维持现有公开契约。

### 不属于本次整改的定时器

退出登录成功后延迟 1000ms 跳转首页，是导航编排而非 Toast 生命周期。该定时器继续保留，不应被静态重复检查误判为 Toast 定时器。

## 6. 数据流

```text
页面业务操作
  -> emit('show-toast', message, type)
  -> 当前布局的 useToast.showToast
  -> 清理旧隐藏定时器
  -> 更新 reactive toast
  -> ToastMessage 展示最新通知
  -> 到期自动隐藏或布局卸载清理
```

页头的退出登录结果和移动菜单提示继续由布局直接调用同一个 `showToast()`，与子页面通知共享相同生命周期策略。

## 7. 错误处理与并发策略

1. 同一布局连续触发多条通知时，后触发的通知立即覆盖前一条。
2. 旧通知的隐藏定时器不会影响新通知。
3. 本轮不实现排队、优先级、重复消息合并或最大队列长度。
4. 通知内容仍由 Vue 文本插值渲染，不使用原始 HTML，不扩大脚本注入风险。
5. 路由跳转、Service 异常和用户会话处理逻辑保持原样。

## 8. 测试设计

### `useToast.test.ts`

使用最小测试组件在真实 `setup()` 生命周期中调用 `useToast()`，覆盖：

- 显示指定文本和类型。
- 未指定类型时使用 `info`。
- 到达持续时间后自动隐藏。
- 连续触发时取消旧定时器，并让新通知获得完整展示时间。
- `hideToast()` 立即隐藏并取消定时器。
- 组件卸载时取消定时器。
- 卸载后不再修改 Toast 状态。

原 `useBusinessLogic.test.ts` 中单一的 Toast 自动关闭用例迁移到新测试文件，避免同一行为重复测试。

### `LayoutRouteRendering.test.ts`

扩展布局集成测试，覆盖：

- 普通布局接收子页面通知。
- 后台布局接收子页面通知。
- 个人中心布局接收子页面通知。
- 连续通知在旧定时器到期时仍保持最新消息可见。
- 最新通知在自己的完整持续时间结束后隐藏。

测试使用假定时器，不依赖真实等待时间。

### 覆盖率门禁

在 `vite.config.ts` 中为 `src/composables/useToast.ts` 增加核心覆盖率阈值。阈值沿用现有核心模块标准：语句和行不低于 90%，函数不低于 85%，分支不低于 80%。

布局文件包含导航、会话和响应式菜单等其他职责，本次通过集成测试验证通知接入，不为整个布局文件新增独立覆盖率阈值，避免把无关业务纳入本项范围。

## 9. 验收标准

1. 三个布局不再声明 Toast 状态对象或 Toast 专用隐藏定时器。
2. 三个布局都复用 `useToast()`，并继续正确展示子页面、退出登录和菜单通知。
3. 连续通知不会被旧定时器提前隐藏。
4. 布局卸载后不存在遗留 Toast 定时器。
5. 登录和注册页面现有通知行为不变。
6. 专项测试、全量测试、覆盖率门禁、类型检查和生产构建全部通过。
7. 审查报告 6.4 更新为“✅ 已解决”，并记录整改内容和验证结果。

验证命令：

```text
yarn coverage
yarn typecheck
yarn build
```

## 10. 变更文件

```text
src/composables/useToast.ts
src/composables/__tests__/useToast.test.ts
src/composables/__tests__/useBusinessLogic.test.ts
src/layouts/AppLayout.vue
src/layouts/AdminLayout.vue
src/layouts/ProfileLayout.vue
src/layouts/__tests__/LayoutRouteRendering.test.ts
vite.config.ts
docs/superpowers/specs/2026-07-20-toast-lifecycle-duplication-remediation-design.md
../doc/前端代码架构审查报告.md
```

## 11. Git 流程

1. 从本地 `dev` 创建 `feature/fix-toast-lifecycle-duplication`。
2. 在 feature 分支先提交设计文档。
3. 设计确认后，在同一 feature 分支完成组合式函数、布局、测试和覆盖率配置修改。
4. 提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 等英文前缀。
5. 全部验证通过后合并到 `dev`，再删除临时 feature 分支。
6. 外层 `doc` 目录不由前端 Git 仓库跟踪，审查报告在代码验证完成后单独更新。
