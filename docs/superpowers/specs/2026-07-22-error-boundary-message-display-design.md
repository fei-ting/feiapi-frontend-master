# 错误边界信息展示整改设计

## 1. 背景与目标

审查报告 7.6 指出，`src/components/ErrorBoundary.vue` 会将捕获到的原始 `err.message` 直接渲染到页面。渲染异常可能包含组件实现细节、请求上下文或内部状态，不适合作为生产环境的用户提示。

本次整改只处理用户可见信息展示，不改变现有错误上报架构。目标如下：

1. 错误边界始终展示固定、友好的错误提示。
2. 原始错误继续沿现有传播链路进入 Vue 全局错误处理器和统一 Reporter。
3. 保留刷新页面、返回首页两个恢复操作。
4. 通过回归测试证明敏感错误消息不会显示给用户。

## 2. 方案选择

采用静态固定文案方案：删除错误消息响应式状态，错误捕获回调只更新 `hasError`，模板直接渲染固定提示“页面遇到了意外错误，请刷新页面后重试，或返回首页。”

该方案改动最小，避免建立错误类型白名单或错误文案映射，也避免任何原始错误内容进入用户界面。错误捕获回调不返回 `false`，因此不改变当前全局错误处理契约。

## 3. 组件与数据流

```text
子组件渲染异常
       |
       v
ErrorBoundary.onErrorCaptured
       |
       +--> hasError = true --> 固定友好文案 + 恢复操作
       |
       +--> 错误继续传播 --> app.config.errorHandler --> errorReporter
```

错误边界不负责记录或展示原始错误详情。`src/services/errorReporter.ts` 和 `src/main.ts` 保持不变。

## 4. 测试设计

在 `ErrorBoundary.test.ts` 中补充一个会抛出包含敏感内容错误的子组件，验证：

- 错误边界进入降级界面；
- 页面显示固定友好文案；
- 页面不包含原始错误消息；
- 错误未被错误边界通过 `return false` 截断。

保留现有正常插槽渲染和返回首页导航测试。测试使用当前 Vitest 与 Vue Test Utils 配置，不引入新依赖。

## 5. 文件范围

- `src/components/ErrorBoundary.vue`：移除原始错误消息的用户界面展示。
- `src/components/__tests__/ErrorBoundary.test.ts`：补充错误信息脱敏回归测试。
- `doc/前端代码架构审查报告.md`：验证通过后补充 7.6 整改结果。

## 6. 验收标准

- `npm run typecheck` 通过。
- `npm test -- --run src/components/__tests__/ErrorBoundary.test.ts` 通过。
- `npm test -- --run` 全量通过。
- `npm run build` 通过。
- 生产源码中不再存在 `ErrorBoundary.vue` 将 `err.message` 渲染到模板的路径。

