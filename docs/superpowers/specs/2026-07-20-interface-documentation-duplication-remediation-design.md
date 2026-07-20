# 接口文档展示重复逻辑整改设计

## 1. 背景与目标

审查报告 6.3 指出，`InterfaceDetailView.vue` 与在线调用链路仍分别维护请求 Header、请求参数、响应参数、JSON 示例和 curl 示例等模板。项目已经建立 `src/components/interface/InterfaceDocumentation.vue`，并由 `InvokeResultPanel.vue` 在在线调用页使用，但详情页尚未接入；公共组件也只支持在线调用场景的精简内容。

本次整改将 `InterfaceDocumentation.vue` 扩展为接口文档主体的唯一模板实现，通过语义模式保留详情页与在线调用页的现有展示差异。详情页继续展示完整文档，在线调用页继续展示精简文档，不改变接口请求、路由、权限、Toast、页面布局或业务文案。

## 2. 设计原则

1. 请求 Header、请求参数、响应参数、JSON 示例、错误码和 curl 示例只在 `InterfaceDocumentation.vue` 中维护模板。
2. 使用语义明确的 `compact` 和 `detail` 模式控制场景差异，避免多个布尔属性形成无效组合。
3. 详情页保留现有完整信息和复制交互，在线调用页保持现有精简内容。
4. 公共组件只负责文档展示、示例标签状态和事件转发，不依赖 Service、Store、路由或 Toast。
5. 复制操作由公共组件发送文本事件，页面继续使用现有 `useInterfaceDoc()` 和应用通知链路执行复制及反馈。
6. 基础信息区只存在于详情页，不纳入公共文档主体组件。
7. 公共格式化规则继续复用 `useInterfaceDoc.ts`，不建立第二套实现。

## 3. 组件接口

### 3.1 展示模式

```ts
/** 接口文档展示模式。 */
type InterfaceDocumentationMode = 'compact' | 'detail';
```

### 3.2 组件属性

```ts
/** 接口文档展示组件属性。 */
interface InterfaceDocumentationProps {
  /** 接口文档聚合详情。 */
  docDetail: InterfaceDocDetailVO;
  /** 展示模式。 */
  mode?: InterfaceDocumentationMode;
}
```

`mode` 默认值为 `compact`，保证现有在线调用链路在显式迁移前后行为一致。`InvokeResultPanel.vue` 仍会显式传入 `compact`，使场景意图可以直接从模板读取。

### 3.3 组件事件

```ts
/** 接口文档展示组件事件。 */
interface InterfaceDocumentationEmits {
  /** 请求复制指定文档文本。 */
  (event: 'copy-text', text: string): void;
}
```

公共组件不直接访问 Clipboard API，也不发送 Toast。详情页监听 `copy-text` 后调用现有 `copyText()`；精简模式不渲染复制按钮，因此在线调用页不需要新增事件转发。

复制按钮图标由详情页通过 `copy-icon` 命名插槽提供。这样公共组件不直接引入图标库，精简模式不会因为未渲染的复制按钮增加图标包体。

## 4. 模式差异

| 文档区域 | `compact` 在线调用模式 | `detail` 详情模式 |
| --- | --- | --- |
| 请求 Header | 名称、必填、值、说明 | 名称、必填、类型、值、说明 |
| 请求参数 | 名称、必填、类型、说明 | 名称、位置、必填、类型、说明 |
| 响应参数 | 字段名、类型、可能为空、说明 | 字段名、类型、可能为空、父级字段、说明 |
| JSON 示例 | 仅成功示例 | 成功与失败示例切换 |
| JSON 复制 | 不显示 | 显示当前示例复制按钮 |
| 错误码 | 不显示 | 显示错误码、错误信息、说明和解决建议 |
| curl 示例 | 显示 | 显示 |
| curl 复制 | 不显示 | 显示复制按钮 |

两种模式分别保持各自现有的空状态文本，并继续使用相同的 JSON 格式化逻辑、参数说明拼接规则和表格样式。所有表头补充 `scope="col"`，保持一致的表格语义。

## 5. 组件内部状态与格式化

`InterfaceDocumentation.vue` 在 `detail` 模式下内部维护成功或失败示例标签状态。以下派生值由组件内部计算：

- 当前示例文本。
- 当前示例为空时的提示文本。
- 当前示例复制按钮标题。
- 响应参数 ID 与字段名映射。

参数位置文本和响应父级字段文本也迁移到公共组件，因为它们只服务于完整文档模板。集合转换继续使用数组的 `filter()`、`map()` 等流式操作。

公共组件继续从 `useInterfaceDoc()` 获取以下格式化函数：

- `hasRows()`。
- `hasText()`。
- `requiredText()`。
- `nullableText()`。
- `rowKey()`。
- `paramValue()`。
- `headerRequiredText()`。
- `headerDescription()`。
- `requestParamDescription()`。
- `prettyJson()`。

## 6. 页面职责调整

### `InterfaceDetailView.vue`

详情页保留：

- 接口加载状态和不存在状态。
- 面包屑与接口摘要区域。
- 基础信息区。
- 管理员真实后端地址可见性。
- 跳转在线调用页面。
- Clipboard API 调用和 Toast 通知链路。

详情页删除：

- 六个重复文档分区模板。
- 成功与失败示例标签状态及派生文本。
- 响应参数父级名称映射。
- 参数位置和父级字段格式化函数。
- 只为重复模板服务的导入和 `useInterfaceDoc()` 解构项。

基础信息区之后渲染：

```vue
<InterfaceDocumentation
  :doc-detail="docDetail"
  mode="detail"
  @copy-text="copyText"
>
  <template #copy-icon>
    <CopyOutlined />
  </template>
</InterfaceDocumentation>
```

### `InvokeResultPanel.vue`

在线调用结果面板显式使用：

```vue
<InterfaceDocumentation
  v-else
  :doc-detail="docDetail"
  mode="compact"
/>
```

结果标签、结果复制和活动标签切换行为保持不变。

## 7. 样式与布局兼容

公共组件保留当前在线调用模式使用的 `.fei-invoke-doc` 约束，只在 `compact` 模式下应用该类，避免把在线调用面板的最大高度和滚动规则带到详情页。

组件增加语义根类 `.fei-interface-documentation`，但不新增装饰性容器。详情模式继续处于详情页现有 `.fei-doc-panel` 内，复用 `detail.css` 中的文档分区、表格、空状态、示例切换和代码块样式；组件根节点显式保持原有 22px 分区间距，因此不改变页面整体结构和视觉层级。

## 8. 错误处理与兼容性

1. 公共组件只接收已经加载完成的 `docDetail`，不处理网络异常。
2. 详情加载失败和不存在状态继续由 `InterfaceDetailView.vue` 处理。
3. JSON 非法时继续展示原始文本，不抛出解析异常。
4. 空数组和缺失文档字段继续显示现有空状态。
5. 复制空文本时由现有 `copyText()` 返回“暂无可复制内容”通知。
6. 不改变接口详情响应类型或后端字段契约。

## 9. 测试与覆盖率

### `InterfaceDocumentation.test.ts`

覆盖：

- 默认精简模式的五个分区和现有列结构。
- 精简模式不显示错误码、复制按钮和失败示例标签。
- 详情模式的完整列结构、六个分区和错误码。
- 成功与失败示例切换及各自空状态。
- JSON 示例和 curl 复制事件的文本载荷。
- Header、请求参数、响应参数和 curl 的空状态。
- 响应父级字段名称和未知父级回退。
- 非法 JSON 保留原文。

### `InterfaceDetailView.test.ts`

覆盖：

- 详情页以 `detail` 模式组合公共组件。
- 基础信息和管理员地址继续由页面渲染。
- 完整文档内容和空状态没有回归。
- 公共组件复制事件继续调用 Clipboard API 并触发现有通知链路。
- 页面源码不再维护重复文档分区和详情模式局部状态。

### `InvokeResultPanel.test.ts`

覆盖：

- 文档标签使用 `compact` 模式。
- 在线调用页保持精简分区，不出现错误码和详情模式控件。

### 覆盖率门禁

在 `vite.config.ts` 中为以下路径增加核心覆盖率阈值：

- `src/components/interface/**`。
- `src/views/InterfaceDetailView.vue`。

阈值沿用现有核心模块标准：语句和行不低于 90%，函数不低于 85%，分支不低于 80%。

## 10. 验收标准

1. `InterfaceDetailView.vue` 不再直接渲染六个文档主体分区。
2. 两个页面场景均复用 `InterfaceDocumentation.vue`，且现有展示差异保持不变。
3. 公共组件不依赖 Service、Store、路由或 Toast。
4. 复制事件、空状态、非法 JSON、参数列和错误码展示没有行为回归。
5. 相关测试、全量测试、覆盖率门禁、类型检查和生产构建全部通过。
6. 审查报告 6.3 更新为“✅ 已解决”，并记录整改文件和验证结果。

验证命令：

```text
yarn coverage
yarn typecheck
yarn build
```

## 11. 变更文件

```text
src/components/interface/InterfaceDocumentation.vue
src/components/interface/__tests__/InterfaceDocumentation.test.ts
src/components/invoke/InvokeResultPanel.vue
src/components/invoke/__tests__/InvokeResultPanel.test.ts
src/views/InterfaceDetailView.vue
src/views/__tests__/InterfaceDetailView.test.ts
vite.config.ts
docs/superpowers/specs/2026-07-20-interface-documentation-duplication-remediation-design.md
../doc/前端代码架构审查报告.md
```

## 12. Git 流程

1. 从本地 `dev` 创建 `feature/fix-interface-documentation-duplication`。
2. 在 feature 分支先提交设计文档。
3. 设计确认后，在同一 feature 分支完成组件、页面、测试和覆盖率配置修改。
4. 提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 等英文前缀。
5. 全部验证通过后合并到 `dev`，再删除临时 feature 分支。
6. 外层 `doc` 目录不由前端 Git 仓库跟踪，审查报告在代码验证完成后单独更新。
