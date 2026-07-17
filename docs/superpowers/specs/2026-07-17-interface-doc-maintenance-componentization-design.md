# 接口文档维护页面组件化设计

## 1. 背景与目标

`src/views/admin/InterfaceDocMaintenanceView.vue` 当前共 442 行，包含文档概要、主信息、请求参数说明、响应字段、JSON 示例、错误码、加载保存、脏数据和离开确认。第四项整改按稳定编辑区块拆分组件，不改变现有视觉、字段顺序、编辑规则、保存载荷、JSON 格式化、脏数据判断和离开确认行为。

## 2. 设计原则

1. 父页面保留路由、Service、数据映射、保存请求、快照和离开确认。
2. 子组件通过明确的 Props/Events 编辑单一区块，不直接修改 Props。
3. 子组件不依赖 Service、Store 或路由。
4. 保留现有 DOM 层级、class 名称、字段属性和响应式布局。
5. 不在本次重构中引入自动保存、撤销或额外组合式函数。

## 3. 组件架构

```text
InterfaceDocMaintenanceView
├── InterfaceDocSummary
├── DocumentMainInfoForm
├── RequestParamDescriptionList
├── ResponseParamEditor
├── JsonExampleEditor
└── ErrorCodeEditor
```

### `InterfaceDocMaintenanceView.vue`

- 保留顶部操作栏、加载与错误状态、底部保存区。
- 保留路由 ID、文档加载、数据映射、保存请求构建、表单总校验、快照、脏数据和离开确认。
- 保留响应字段、错误码的增删实现，并响应子组件事件。
- 不再直接渲染六个稳定业务区块的内部字段。

### `InterfaceDocSummary.vue`

- 输入 `InterfaceDocDetailVO` 和 `editable`。
- 展示请求方法、路径、接口名称、状态、配额、SDK 方法和不可编辑提示。
- 可以使用 `useQuota` 的纯格式化函数，不调用 Service 或路由。

### `DocumentMainInfoForm.vue`

- 输入文档主表单和内容类型选项。
- 输出版本、请求格式、响应格式和备注更新事件。

### `RequestParamDescriptionList.vue`

- 输入运行时请求参数。
- 输出说明、示例、默认值、校验规则和排序更新事件。
- 不允许新增或删除运行时请求参数。

### `ResponseParamEditor.vue`

- 输入响应字段和参数类型选项。
- 输出新增、删除及字段更新事件。
- 组件内部计算可选父字段，但不修改父页面数组。

### `JsonExampleEditor.vue`

- 输入成功和失败示例。
- 输出文本更新及格式化请求事件。
- JSON 解析和错误状态仍由父页面处理。

### `ErrorCodeEditor.vue`

- 输入错误码列表。
- 输出新增、删除和字段更新事件。

## 4. 公共类型与组件契约

`src/types/interfaceDocEditor.ts` 提供带字段中文注释的 `DocMainForm`、`EditableErrorCode` 和编辑字段联合类型。

```ts
export type RequestParamEditableField =
  | 'description'
  | 'exampleValue'
  | 'defaultValue'
  | 'validationRule'
  | 'sortOrder';

export type ResponseParamEditableField =
  | 'name'
  | 'type'
  | 'parentParamKey'
  | 'sortOrder'
  | 'required'
  | 'nullable'
  | 'description'
  | 'exampleValue'
  | 'defaultValue'
  | 'validationRule';

export type ErrorCodeEditableField =
  | 'errorCode'
  | 'errorMessage'
  | 'sortOrder'
  | 'description'
  | 'solution';

export type EditorFieldValue = string | number | boolean | undefined;
```

```ts
interface DocumentMainInfoFormProps {
  modelValue: DocMainForm;
  contentTypes: string[];
}

interface DocumentMainInfoFormEmits {
  (
    event: 'update-field',
    field: 'docVersion' | 'requestContentType' | 'responseContentType' | 'remark',
    value: string,
  ): void;
}
```

```ts
interface RequestParamDescriptionListProps {
  params: InterfaceDocParamSaveRequest[];
}

interface RequestParamDescriptionListEmits {
  (
    event: 'update-param',
    paramKey: string,
    field: RequestParamEditableField,
    value: string | number,
  ): void;
}
```

```ts
interface ResponseParamEditorProps {
  params: InterfaceDocParamSaveRequest[];
  paramTypes: string[];
}

interface ResponseParamEditorEmits {
  (event: 'add'): void;
  (event: 'remove', paramKey: string): void;
  (
    event: 'update-param',
    paramKey: string,
    field: ResponseParamEditableField,
    value: EditorFieldValue,
  ): void;
}
```

```ts
interface JsonExampleEditorProps {
  successExample: string;
  failExample: string;
}

interface JsonExampleEditorEmits {
  (event: 'update-example', field: 'successExample' | 'failExample', value: string): void;
  (event: 'format', field: 'successExample' | 'failExample'): void;
}
```

```ts
interface ErrorCodeEditorProps {
  errorCodes: EditableErrorCode[];
}

interface ErrorCodeEditorEmits {
  (event: 'add'): void;
  (event: 'remove', clientKey: string): void;
  (
    event: 'update-error-code',
    clientKey: string,
    field: ErrorCodeEditableField,
    value: string | number,
  ): void;
}
```

父页面通过 `paramKey` 或 `clientKey` 查找目标记录并更新字段。子组件不得直接修改 Props 数组或对象。

## 5. 数据流与错误边界

```text
路由接口 ID
  -> InterfaceDocMaintenanceView.loadDocument
  -> interfaceService.getDocDetail
  -> 映射为 form/requestParams/responseParams/errorCodes
  -> 建立 baseline
  -> 子组件 Props

子组件更新事件
  -> 父页面更新目标字段
  -> currentSnapshot
  -> dirty/canSave

保存
  -> validateForm
  -> buildSaveRequest
  -> interfaceService.saveDoc
  -> 重新加载并重建 baseline
```

错误和状态规则：

1. 非法接口 ID 保持“接口 ID 无效”。
2. 文档加载失败时保持错误区和“重新加载”按钮。
3. 加载成功后建立保存请求快照作为脏数据基线。
4. 接口状态不是下线状态时显示不可编辑提示，并由父级 `fieldset` 禁用所有子组件控件。
5. 保存中禁用全部编辑和两个保存按钮。
6. 文档版本或内容格式为空时保持“文档版本和内容格式不能为空”。
7. 响应字段缺少名称或类型时保持“响应字段名称和类型不能为空”。
8. 错误码缺少错误码或错误信息时保持“错误码和错误信息不能为空”。
9. 删除响应父字段时清除所有子字段对该父字段的引用。
10. 可选父字段排除当前字段自身。
11. JSON 为空时不处理；合法 JSON 原地格式化；非法 JSON 保持原值并显示对应错误。
12. 保存成功后重新加载文档、重建快照并发送成功 Toast。
13. 保存失败时保留编辑状态和错误消息。
14. 页面无修改时直接离开；存在修改时使用原确认文案。
15. 浏览器刷新或关闭时，存在修改继续触发 `beforeunload`。
16. 本次不新增自动保存、字段拖拽、批量编辑或撤销功能。

## 6. 样式处理

所有子组件保留现有 DOM 层级和 `fei-doc-*` class，继续使用：

```text
src/styles/pages/admin-tools.css
src/styles/responsive.css
```

不新增 scoped 样式，不移动全局规则，不修改颜色、间距、栅格、断点或粘性顶部栏。父级 `fieldset` 保留在页面中，确保禁用状态覆盖所有子组件控件。

实施后精确比较拆分前后的 `fei-*` class 集合，并进行桌面、移动端全页截图。

## 7. 测试与验收

| 测试对象 | 测试场景 |
| -------- | -------- |
| `InterfaceDocSummary` | 方法、路径、名称、状态、配额和 SDK 方法；可编辑与不可编辑提示 |
| `DocumentMainInfoForm` | 初始值、内容类型选项、四个字段更新事件、必填和 maxlength 属性 |
| `RequestParamDescriptionList` | 空状态、运行时字段身份信息、五类说明字段更新事件 |
| `ResponseParamEditor` | 空状态、新增与删除事件、十类字段更新事件、父字段排除自身 |
| `JsonExampleEditor` | 两个示例值、文本更新事件、成功与失败格式化事件 |
| `ErrorCodeEditor` | 空状态、新增与删除事件、五类字段更新事件、排序占位值 |
| `InterfaceDocMaintenanceView` | 非法 ID、加载失败和重试；加载映射；只读状态；脏数据；响应字段增删及父引用清理；错误码增删；JSON 成功和失败；三类保存校验；保存成功重载与 Toast；保存失败；路由离开和 `beforeunload` |
| 静态边界 | 子组件不依赖 Service、Store 或路由；class 集合一致；文件规模满足约束 |

实现完成后执行：

```text
npm test
npm run typecheck
npm run build
```

并在桌面和移动端确认编辑区块不存在重叠、溢出或表单截断。

## 8. 文件规模目标

| 文件 | 目标行数 |
| ---- | -------: |
| `InterfaceDocMaintenanceView.vue` | 290～350 |
| `InterfaceDocSummary.vue` | 45～75 |
| `DocumentMainInfoForm.vue` | 70～110 |
| `RequestParamDescriptionList.vue` | 90～140 |
| `ResponseParamEditor.vue` | 130～190 |
| `JsonExampleEditor.vue` | 55～90 |
| `ErrorCodeEditor.vue` | 100～160 |

验收底线为父页面不超过 350 行，任一新增组件不超过 200 行，并且不存在越界依赖。

## 9. 变更文件

```text
src/views/admin/InterfaceDocMaintenanceView.vue
src/views/admin/__tests__/InterfaceDocMaintenanceView.test.ts
src/components/admin/doc/InterfaceDocSummary.vue
src/components/admin/doc/DocumentMainInfoForm.vue
src/components/admin/doc/RequestParamDescriptionList.vue
src/components/admin/doc/ResponseParamEditor.vue
src/components/admin/doc/JsonExampleEditor.vue
src/components/admin/doc/ErrorCodeEditor.vue
src/components/admin/doc/__tests__/InterfaceDocSummary.test.ts
src/components/admin/doc/__tests__/DocumentMainInfoForm.test.ts
src/components/admin/doc/__tests__/RequestParamDescriptionList.test.ts
src/components/admin/doc/__tests__/ResponseParamEditor.test.ts
src/components/admin/doc/__tests__/JsonExampleEditor.test.ts
src/components/admin/doc/__tests__/ErrorCodeEditor.test.ts
src/types/interfaceDocEditor.ts
```
