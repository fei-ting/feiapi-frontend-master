# 剪贴板逻辑重复整改设计

## 1. 背景与目标

审查报告 6.5 指出，项目已经存在 `src/composables/useClipboard.ts`，访问密钥页面也已使用该组合式函数，但 `src/composables/useInterfaceDoc.ts` 仍独立维护 Clipboard API、安全上下文判断、隐藏 `textarea` 和 `document.execCommand('copy')` 降级逻辑。

两套实现的成功提示、失败提示和返回值契约并不一致，后续修改可能继续产生行为分歧。本次整改将 `useClipboard.ts` 设为剪贴板能力的唯一实现，由 `useInterfaceDoc.ts` 组合复用，并统一所有复制场景的提示文案和布尔返回值。

## 2. 设计原则

1. `useClipboard.ts` 是 Clipboard API 和降级复制逻辑的唯一实现。
2. `useInterfaceDoc.ts` 只保留接口文档场景的组合入口，不再直接访问浏览器剪贴板 API 或创建临时 DOM 元素。
3. 现有接口详情页、在线调用页和访问密钥页的事件链路保持不变。
4. 所有复制场景使用同一组成功、失败和空内容提示文案。
5. 复制操作统一返回 `Promise<boolean>`，调用方可以判断结果，也可以忽略返回值。
6. 降级复制创建的临时元素必须在成功、失败和异常路径中清理。
7. 不记录待复制文本，避免访问密钥、Secret Key 或接口响应进入日志。
8. 不引入第三方剪贴板依赖，不增加全局 Store 或跨页面状态。

## 3. 方案选择

本次采用“组合式函数内部复用”方案：

```text
InterfaceDetailView / InterfaceInvokeView
  -> useInterfaceDoc.copyText
  -> useClipboard.copyToClipboard
  -> Clipboard API 或 execCommand 降级
  -> 布局 Toast 事件

AccessKeysView
  -> useClipboard.copyToClipboard
  -> Clipboard API 或 execCommand 降级
  -> 布局 Toast 事件
```

该方案保留 `useInterfaceDoc.copyText` 的现有调用名称和页面接线，同时删除其底层复制实现。相比让两个接口页面分别接入 `useClipboard`，不会重复通知绑定；相比新增纯工具服务层，也更符合当前消费者数量和项目已有组合式 API 模式。

## 4. 公共契约

### `useClipboard()`

`useClipboard()` 继续接收可选的 Toast 通知函数，并返回：

- `copyToClipboard(text: string): Promise<boolean>`：复制文本并返回是否成功。
- `isClipboardSupported(): boolean`：判断现代 Clipboard API 在当前安全上下文中是否可用。

`copyToClipboard()` 不再接受成功或失败文案参数，避免调用方建立新的文案变体。

统一提示文案：

| 场景 | 类型 | 文案 |
| --- | --- | --- |
| 复制成功 | `success` | `已复制` |
| 复制失败 | `error` | `复制失败，请手动选择内容复制` |
| 空内容 | `info` | `暂无可复制内容` |

复制非空判断继续使用 `trim()`，但实际写入剪贴板的仍是原始文本，不主动删除用户需要的前后空白。

### `useInterfaceDoc.copyText()`

`useInterfaceDoc()` 内部使用同一个 Toast 适配函数创建 `useClipboard()`，并将 `copyText` 委托给 `copyToClipboard`。`copyText` 统一返回 `Promise<boolean>`；现有页面只等待操作完成，不依赖返回内容，因此无需改变模板事件和页面业务流程。

## 5. 复制流程

### 现代 Clipboard API

当 `navigator.clipboard` 存在且 `window.isSecureContext` 为真时：

1. 调用 `navigator.clipboard.writeText(text)`。
2. 成功时发送统一成功通知并返回 `true`。
3. 异常时只记录错误对象和固定上下文，不记录复制文本，然后继续尝试降级复制。

### `execCommand` 降级

现代 API 不可用或调用失败时：

1. 创建隐藏 `textarea` 并写入原始文本。
2. 将元素加入 `document.body`，聚焦并选中文本。
3. 调用 `document.execCommand('copy')`。
4. 返回 `true` 时发送统一成功通知并返回 `true`。
5. 返回 `false` 或抛出异常时发送统一失败通知并返回 `false`。
6. 在 `finally` 中移除临时 `textarea`，保证任何路径都不遗留 DOM 元素。

## 6. 页面迁移

### 接口详情和在线调用

`InterfaceDetailView.vue` 和 `InterfaceInvokeView.vue` 继续使用 `useInterfaceDoc()` 提供的 `copyText`，无需改变组件事件或 Toast 上送链路。`useInterfaceDoc.ts` 删除以下内容：

- `navigator.clipboard.writeText()` 调用。
- 安全上下文判断。
- 隐藏 `textarea` 创建与样式设置。
- `document.execCommand('copy')` 调用。
- 独立的复制成功、失败和降级异常处理。

### 访问密钥

`AccessKeysView.vue` 继续直接使用 `useClipboard()`。SDK 示例复制不再传入自定义成功提示，访问密钥、Secret Key 和 SDK 示例都使用公共统一文案。

密钥尚未加载时的“密钥暂未加载完成”属于页面前置校验，不是剪贴板结果提示，继续保留。

## 7. 异常处理与安全

1. 空字符串或纯空白文本不调用任何剪贴板 API，发送空内容通知并返回 `false`。
2. Clipboard API 异常不立即判定失败，继续执行降级方案。
3. `execCommand` 返回 `false` 视为复制失败。
4. 创建元素、挂载元素、聚焦、选择或执行复制任一步骤抛出异常时，返回 `false` 并发送失败通知。
5. 临时 `textarea` 只在当前操作中存在，操作结束后必须清理。
6. 日志只包含固定模块标识和异常对象，不拼接待复制文本。
7. 复制内容继续以纯文本写入，不解释 HTML，不新增脚本注入入口。

## 8. 测试设计

### `useClipboard.test.ts`

新增独立组合式函数测试，覆盖：

- 安全上下文中 Clipboard API 复制成功。
- 空内容被拦截且不调用剪贴板 API。
- 非安全上下文直接使用 `execCommand` 降级。
- Clipboard API 抛出异常后降级成功。
- `execCommand` 返回 `false` 时返回失败并发送统一失败通知。
- 降级过程抛出异常时返回失败、发送通知并清理临时元素。
- 成功、失败和空内容使用统一文案。
- `isClipboardSupported()` 在支持和不支持环境下返回正确结果。

测试需要在每个用例后恢复 `navigator.clipboard`、`window.isSecureContext`、`document.execCommand`、控制台 Mock 和临时 DOM，避免污染其他测试。

### 页面与现有回归测试

新增或扩充访问密钥页面测试，验证：

- Access Key、Secret Key 和 SDK 示例复制统一使用“已复制”。
- 密钥未加载时仍使用页面自己的前置校验文案。

现有 `InterfaceDetailView.test.ts` 和 `InterfaceInvokeView.test.ts` 已验证接口文档复制成功后发送“已复制”，继续作为页面集成回归测试。全量测试还需确认 Clipboard API 与安全上下文 Mock 不互相泄漏。

### 覆盖率门禁

在 `vite.config.ts` 中为 `src/composables/useClipboard.ts` 增加核心覆盖率阈值，沿用现有标准：

- 语句和行不低于 90%。
- 函数不低于 85%。
- 分支不低于 80%。

## 9. 验收标准

1. `useInterfaceDoc.ts` 不再直接引用 `navigator.clipboard`、`window.isSecureContext`、`document.execCommand` 或创建复制用 `textarea`。
2. 源码中只有 `useClipboard.ts` 维护 Clipboard API 和 `execCommand` 降级实现。
3. 接口详情、在线调用和访问密钥复制行为正常，页面事件链路不变。
4. 所有复制结果使用统一文案，调用方不能再通过参数覆盖成功或失败文案。
5. 所有复制操作统一返回 `Promise<boolean>`。
6. 降级复制的临时 DOM 在全部路径中得到清理。
7. 专项测试、全量测试、覆盖率门禁、TypeScript 类型检查和生产构建全部通过。
8. 审查报告 6.5 更新为“✅ 已解决”，并将旧文件名 `ProfileView.vue` 更正为 `AccessKeysView.vue`。

验证命令：

```text
yarn coverage
yarn typecheck
yarn build
```

## 10. 变更文件

```text
src/composables/useClipboard.ts
src/composables/useInterfaceDoc.ts
src/composables/__tests__/useClipboard.test.ts
src/views/profile/AccessKeysView.vue
src/views/profile/__tests__/AccessKeysView.test.ts
vite.config.ts
docs/superpowers/specs/2026-07-20-clipboard-duplication-remediation-design.md
../doc/前端代码架构审查报告.md
```

如现有接口详情或在线调用测试因公共契约收敛需要调整，只修改与复制结果直接相关的断言，不扩大到无关页面逻辑。

## 11. Git 流程

1. 从本地 `dev` 创建 `feature/fix-clipboard-duplication`。
2. 在 feature 分支先提交设计文档。
3. 设计确认后，在同一 feature 分支完成公共组合式函数、调用方、测试和覆盖率配置修改。
4. 提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 等英文前缀。
5. 全部验证和代码质量复核通过后，非快进合并到 `dev`，再删除临时 feature 分支。
6. 外层 `doc` 目录不属于前端 Git 仓库，审查报告在代码验证完成后单独更新。
