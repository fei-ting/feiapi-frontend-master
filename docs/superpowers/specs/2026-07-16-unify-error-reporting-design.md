# 统一错误上报链路设计

## 目标

建立统一、可替换的前端错误上报入口，修复错误边界阻断全局处理器的问题，并覆盖 Vue、浏览器同步错误和未处理 Promise 异常。

## 链路

```text
Vue 组件异常 -> ErrorBoundary 展示降级界面 -> 继续传播
             -> app.config.errorHandler -> errorReporter
window.error ---------------------------> errorReporter
unhandledrejection ---------------------> errorReporter
```

`ErrorBoundary` 只负责捕获子组件错误、更新降级界面，不调用上报服务，也不返回 `false` 阻断传播。`main.ts` 负责注册全局入口并调用 `errorReporter`。

## Reporter 设计

新增 `src/services/errorReporter.ts`，提供结构化 `reportError(error, context)` 方法。

上报内容仅包括错误类型、消息、堆栈、来源、组件信息、Vue 错误阶段、当前路由、运行环境和时间戳，不上传密码、密钥、请求体等敏感数据。当前默认使用结构化 `console.error`，后续接入 Sentry 或自建监控时只替换 Reporter 内部实现。

Reporter 自身异常必须被吞掉，不影响页面渲染和错误降级流程。

## 浏览器错误监听

在应用入口注册 `window.error` 与 `window.unhandledrejection`：

- `window.error` 使用事件中的 `error` 或 `message` 作为错误对象。
- `unhandledrejection` 使用 `reason`；非 `Error` 值转换为 Error。
- 监听器只负责转换上下文并调用 Reporter。

## 测试

- Reporter 格式化来源、消息、堆栈和上下文，并验证敏感字段不被上传。
- Reporter 内部异常不会向外抛出。
- ErrorBoundary 仍显示降级界面，且不再通过 `return false` 阻断传播。
- 全局入口注册浏览器错误监听器并调用统一 Reporter。

## 拟改文件

- `src/components/ErrorBoundary.vue`
- `src/main.ts`
- 新增 `src/services/errorReporter.ts`
- `src/components/__tests__/ErrorBoundary.test.ts`
- 新增 `src/services/__tests__/errorReporter.test.ts`
- 新增 `src/main.test.ts`（如入口监听需要独立测试）
