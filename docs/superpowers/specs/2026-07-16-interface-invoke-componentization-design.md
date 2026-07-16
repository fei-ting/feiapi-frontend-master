# 在线调用页面组件化设计

## 1. 背景与目标

`src/views/InterfaceInvokeView.vue` 当前共 511 行，同时承担请求参数输入、接口调用、结果展示、接口文档和确认弹窗。第二项整改只调整组件边界和测试，不改变现有视觉、文案、路由、登录判断、真实调用流程和弹窗行为。

## 2. 设计原则

1. 父页面继续持有 Service、Store、路由和调用业务状态。
2. 子组件通过明确的 Props/Events 通信，不直接依赖 Service、Store 或 `useRouter`。
3. 保留现有 DOM 层级、class 名称、响应式规则和用户操作时序。
4. 继续复用 `useInterfaceDoc`、`useInterfaceInvoke` 和 `useDialogFocusTrap`，不重复实现现有逻辑。

## 3. 组件架构

```text
InterfaceInvokeView
├── RequestParameterForm
├── InvokeResultPanel
│   └── InterfaceDocumentation
└── ConfirmDialog
```

### `InterfaceInvokeView.vue`

- 保留路由参数、用户 Store、文档加载、真实接口调用、Toast、调用结果、活动标签和弹窗动作。
- 保留接口名称、状态、请求地址、请求方式和 Header 摘要。
- 不再直接渲染参数输入、结果内容、文档表格和弹窗 DOM。

### `RequestParameterForm.vue`

- 输入结构化参数、参数值、调用状态、示例可用状态和空参数文案。
- 输出参数修改、发送请求和填充示例事件。
- 不直接修改父组件状态，不调用 Service。

```ts
interface RequestParameterFormProps {
  /** 结构化请求参数字段。 */
  structuredParams: RequestParamField[];
  /** 当前参数输入值。 */
  paramValues: Record<string, string>;
  /** 是否正在调用接口。 */
  invokeLoading: boolean;
  /** 是否允许填充示例。 */
  canFillExample: boolean;
  /** 没有结构化参数时的提示文本。 */
  emptyParamText: string;
}

interface RequestParameterFormEmits {
  /** 更新指定参数值。 */
  (event: 'update-param', name: string, value: string): void;
  /** 请求父页面发起调用。 */
  (event: 'invoke'): void;
  /** 请求父页面填充示例。 */
  (event: 'fill-example'): void;
}
```

### `InvokeResultPanel.vue`

- 输入当前标签、调用结果和接口文档。
- 输出标签切换和复制结果事件。
- 内部组合 `InterfaceDocumentation`，不执行复制或接口调用。

```ts
interface InvokeResultPanelProps {
  /** 当前活动标签。 */
  activeTab: InvokeTab;
  /** 格式化后的调用结果。 */
  invokeResult: string;
  /** 接口文档聚合详情。 */
  docDetail: InterfaceDocDetailVO;
}

interface InvokeResultPanelEmits {
  /** 切换活动标签。 */
  (event: 'update:activeTab', tab: InvokeTab): void;
  /** 请求父页面复制调用结果。 */
  (event: 'copy-result'): void;
}
```

### `InterfaceDocumentation.vue`

- 输入完整的 `InterfaceDocDetailVO`。
- 负责请求 Header、请求参数、响应参数、JSON 示例和 curl 示例。
- 继续复用 `useInterfaceDoc` 的纯格式化方法，不调用 Service、Store 或路由。

### `ConfirmDialog.vue`

- 输入打开状态、标题、正文、按钮文案和标题 ID。
- 输出确认与取消事件。
- 内部接管焦点陷阱、首次聚焦、Escape 关闭和 ARIA 属性。

```ts
interface ConfirmDialogProps {
  /** 是否显示弹窗。 */
  open: boolean;
  /** 弹窗标题。 */
  title: string;
  /** 弹窗正文。 */
  message: string;
  /** 主操作按钮文本。 */
  primaryText: string;
  /** 取消按钮文本。 */
  cancelText?: string;
  /** 标题元素 ID。 */
  titleId?: string;
}

interface ConfirmDialogEmits {
  /** 用户确认主操作。 */
  (event: 'confirm'): void;
  /** 用户取消弹窗。 */
  (event: 'cancel'): void;
}
```

### `src/types/invoke.ts`

新增带中文注释的 `InvokeTab` 类型，避免父子组件重复声明，也不继续扩大 `api.ts`。

```ts
/** 在线调用结果区域的活动标签。 */
export type InvokeTab = 'result' | 'doc';
```

## 4. 数据流与错误边界

```text
路由参数
  -> InterfaceInvokeView.loadDetail
  -> interfaceService.getDocDetail
  -> docDetail
      -> RequestParameterForm
      -> InvokeResultPanel
          -> InterfaceDocumentation

RequestParameterForm
  -> update-param
  -> 父页面更新 useInterfaceInvoke.paramValues

发送请求
  -> 父页面检查登录状态
  -> ConfirmDialog
  -> validateRequestParams
  -> interfaceService.invoke
  -> invokeResult
  -> InvokeResultPanel
```

具体规则如下：

1. 页面加载中继续显示“正在加载在线调用...”。
2. 路由 ID 非法、文档请求失败或接口不存在时继续显示“接口不存在”。
3. 参数输入由子组件发送字段名和值，父页面更新 `paramValues`，现有类型转换和 JSON 校验不变。
4. 未登录发送请求时打开登录弹窗，确认后跳转到带 `redirect` 参数的登录页。
5. 已登录发送请求时打开真实调用确认弹窗。
6. 参数校验失败时不请求接口，切换到结果标签，显示错误文案并触发错误 Toast。
7. 调用成功时格式化响应、切换结果标签并显示成功 Toast。
8. 调用失败时显示异常消息；无法识别异常时使用“调用失败，请稍后重试”。
9. 调用返回 `null` 或 `undefined` 时显示“接口返回为空”。
10. 结果为空时复制按钮保持禁用；有结果时由父页面执行现有复制逻辑。
11. 子组件不维护文档加载状态、登录状态或调用业务状态。
12. `ConfirmDialog` 只负责可访问性交互，不判断当前动作是登录还是调用。
13. 弹窗打开后聚焦第一个按钮，Tab 和 Shift+Tab 保持焦点循环，Escape 触发取消事件。
14. 本次不增加请求取消、防重复提交、骨架屏或新的错误提示。

## 5. 样式迁移

`RequestParameterForm.vue`、`InvokeResultPanel.vue` 和 `InterfaceDocumentation.vue` 保留现有 DOM 层级与 class 名称，继续使用：

```text
src/styles/pages/invoke.css
src/styles/pages/detail.css
src/styles/responsive.css
```

上述样式同时被接口详情页或页面布局复用，本次不迁移为 scoped 样式，避免扩大视觉回归范围。

`ConfirmDialog.vue` 使用 scoped 样式接管 `.fei-modal-mask`、`.fei-confirm-dialog` 及其内部标题、正文和底部操作区。从 `invoke.css` 删除对应弹窗样式，避免通用组件继续依赖在线调用页面样式。

`common.css` 中原有 `.fei-modal-mask` 保留，供其他旧弹窗使用；`ConfirmDialog.vue` 的 scoped 规则保持当前 `0.38` 遮罩透明度和 `3px` 模糊效果。不修改颜色、间距、圆角、阴影、断点和响应式布局。

实施后比较拆分前后的 `fei-*` class 集合，并进行桌面与移动端浏览器截图检查。

## 6. 测试与验收

| 测试对象 | 测试场景 |
| -------- | -------- |
| `RequestParameterForm` | 字段名称、类型、必填标记和输入类型；参数更新事件；空参数文案；调用按钮禁用；示例按钮条件；发送和填充事件 |
| `InterfaceDocumentation` | 五个文档分区完整渲染；字段格式化；五个分区空状态 |
| `InvokeResultPanel` | 默认结果标签；切换事件；空结果和复制禁用；复制事件；文档组件组合 |
| `ConfirmDialog` | 关闭时不渲染；标题、正文和按钮；确认、取消、Escape；首次聚焦；Tab 和 Shift+Tab 焦点循环 |
| `InterfaceInvokeView` | 结构化参数 JSON；登录重定向；已登录确认；参数校验失败；调用成功、失败和空响应；文档加载失败；复制结果；子组件事件集成 |
| 静态边界 | 子组件不得引入 Service、Store 或 `useRouter`；拆分前后 class 集合一致；父页面和组件规模满足约束 |

实现完成后执行：

```text
npm test
npm run typecheck
npm run build
```

并在桌面及移动端确认请求参数、结果标签、文档表格、弹窗和页面布局不存在错位、溢出或空白。

## 7. 文件规模目标

| 文件 | 目标行数 |
| ---- | -------: |
| `InterfaceInvokeView.vue` | 260～330 |
| `RequestParameterForm.vue` | 90～130 |
| `InvokeResultPanel.vue` | 80～120 |
| `InterfaceDocumentation.vue` | 120～170 |
| `ConfirmDialog.vue` | 90～130 |

验收底线为父页面不超过 330 行，任一新增组件不超过 200 行，并且不存在越界依赖。

## 8. 变更文件

```text
src/views/InterfaceInvokeView.vue
src/views/__tests__/InterfaceInvokeView.test.ts
src/components/invoke/RequestParameterForm.vue
src/components/invoke/InvokeResultPanel.vue
src/components/invoke/__tests__/RequestParameterForm.test.ts
src/components/invoke/__tests__/InvokeResultPanel.test.ts
src/components/interface/InterfaceDocumentation.vue
src/components/interface/__tests__/InterfaceDocumentation.test.ts
src/components/common/ConfirmDialog.vue
src/components/common/__tests__/ConfirmDialog.test.ts
src/types/invoke.ts
src/styles/pages/invoke.css
```
