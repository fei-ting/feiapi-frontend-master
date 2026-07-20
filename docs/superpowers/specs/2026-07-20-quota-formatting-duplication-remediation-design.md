# 配额格式化重复逻辑整改设计

## 1. 背景与目标

审查报告 6.2 指出，项目已经通过 `src/composables/useQuota.ts` 集中处理主要配额展示规则，但 `QuotaConfigView.vue` 仍自行维护配额类型文本和标签样式。进一步核对发现，`InterfaceManagementView.vue` 与 `InterfaceConfigModal.vue` 还分别维护相同的配额类型选项数组。

本次整改继续以 `useQuota.ts` 作为配额展示规则的唯一来源，统一配额类型中文名称、标签样式、选项内容、选项顺序、初始额度和剩余额度文本。页面只负责绑定共享规则和编排自身业务，不再声明配额类型映射。

本次不改变接口契约、配额类型取值、页面文案、标签样式、选项顺序、额度编辑行为或页面布局。

## 2. 设计原则

1. `useQuota.ts` 是配额展示规则和配额选项的唯一来源。
2. 相同配额类型在所有页面展示相同名称和标签样式。
3. 后端提供 `quotaTypeText` 时，现有支持该字段的页面继续优先展示后端文本。
4. 后台筛选框和接口配置弹窗使用同一份只读配额选项。
5. 页面不得重新声明配额类型判断、中文名称映射或标签样式映射。
6. 保持现有 `useQuota()` 调用方式，避免扩大到无关消费者迁移。
7. 测试覆盖规则边界和页面接入结果，并通过独立覆盖率门禁防止回退。

## 3. 统一规则设计

### 3.1 配额选项类型

在 `src/composables/useQuota.ts` 中新增配额选项类型。类型及每个字段均使用中文注释。

```ts
/** 配额类型选项。 */
export interface QuotaTypeOption {
  /** 配额类型。 */
  value: InterfaceQuotaType;
  /** 配额类型中文名称。 */
  label: string;
}
```

### 3.2 配额选项常量

新增只读常量 `QUOTA_TYPE_OPTIONS`，保持当前页面已有顺序：

1. `BASIC_QUOTA`：基础额度。
2. `FREE_UNLIMITED`：免费无限。
3. `ADVANCED_TRIAL`：高级体验。

选项通过只读类型约束，消费者只能读取和遍历，不能在页面运行期间修改共享配置。

### 3.3 格式化函数

保留以下现有纯函数及行为：

- `isFreeUnlimited()`：判断免费无限配额。
- `getQuotaTypeText()`：获取配额类型中文名称，并保留 `quotaTypeText` 回退能力。
- `getQuotaTagClass()`：获取配额标签样式。
- `getInitialQuotaText()`：格式化初始额度。
- `getQuotaLeftText()`：格式化剩余额度。
- `getInterfaceStatusText()`：格式化接口状态。
- `getUserInterfaceStatusText()`：格式化用户接口状态。

`useQuota()` 继续返回原有方法，避免影响已经接入的详情页、接口广场、后台接口管理和个人调用记录页面。共享选项作为模块级只读常量直接导入，不通过组合式函数创建重复引用。

## 4. 页面接入设计

### `QuotaConfigView.vue`

删除页面内的 `quotaTagClass()` 和 `quotaConfigText()`。模板分别改用共享的 `getQuotaTagClass()` 和 `getQuotaTypeText()`。

配额名称保持现有固定领域文案，不引入新的服务调用或响应转换。页面继续负责配置列表加载、编辑值初始化、通知发送和保存入口。

### `InterfaceManagementView.vue`

删除页面内的 `quotaTypeOptions`，筛选框改为遍历共享 `QUOTA_TYPE_OPTIONS`。现有筛选值、选项顺序和请求参数保持不变。

### `InterfaceConfigModal.vue`

删除组件内的 `quotaOptions`，接口新增和编辑表单改为遍历共享 `QUOTA_TYPE_OPTIONS`。默认配额类型仍为 `BASIC_QUOTA`，提交载荷不变。

## 5. 数据流与边界

```text
useQuota.ts
├── 配额类型只读选项
├── 配额类型文本规则
├── 配额标签样式规则
├── 初始额度与剩余额度规则
└── 接口状态展示规则

共享规则
├── QuotaConfigView
├── InterfaceManagementView
├── InterfaceConfigModal
├── InterfaceDetailView
├── InterfaceMarketView
├── InvocationRecordsView
└── InterfaceDocSummary
```

页面接收后端数据后直接调用共享格式化函数。共享模块不依赖 Service、Store、路由或组件实例，也不修改传入数据。

未知或缺失配额类型继续按基础额度样式处理；缺失额度继续显示 `0 次`；免费无限配额继续显示 `无限次`；高级体验剩余额度继续显示“次数 + 体验”。

## 6. 错误处理与兼容性

1. 本次不调整 Service 异常处理，`QuotaConfigView.vue` 加载失败时仍清空列表并向父组件发送错误通知。
2. 不改变 `InterfaceQuotaType` 联合类型和后端字段定义。
3. 不改变 `quotaTypeText` 的兼容逻辑，已有页面仍可展示后端返回的自定义名称。
4. 不改变标签类名，现有全局样式继续生效。
5. 不改变配额编辑输入限制、保存按钮状态和占位保存行为。

## 7. 测试与覆盖率

### `useQuota.test.ts`

覆盖以下规则：

- 三种配额类型的名称和标签样式。
- 后端自定义 `quotaTypeText` 和默认名称回退。
- 免费无限、基础额度和高级体验的初始额度及剩余额度文本。
- 缺失额度按零处理。
- 接口状态和用户接口状态文本。
- 共享选项内容、顺序和类型取值。

### `QuotaConfigView.test.ts`

覆盖以下页面行为：

- 成功加载三种配额配置。
- 使用共享规则展示名称和标签样式。
- 有限额度显示编辑框和保存按钮，免费无限显示“无限次”。
- 加载失败时展示空状态并发送错误通知。
- 刷新按钮重新请求配置列表。

### 覆盖率门禁

在 `vite.config.ts` 中为以下路径增加核心覆盖率阈值：

- `src/composables/useQuota.ts`。
- `src/views/admin/QuotaConfigView.vue`。

阈值沿用现有核心模块标准：语句和行不低于 90%，函数不低于 85%，分支不低于 80%。

## 8. 验收标准

1. 三个目标文件不再声明配额类型中文名称、标签样式映射或配额选项数组。
2. 所有现有配额展示页面继续使用同一套共享规则。
3. 新增测试、全量测试和覆盖率门禁全部通过。
4. TypeScript 类型检查和生产构建通过。
5. 配额名称、标签、选项顺序、额度文本和请求载荷没有行为回归。
6. 审查报告 6.2 更新为“✅ 已解决”，并记录整改内容和验证结果。

验证命令：

```text
yarn coverage
yarn typecheck
yarn build
```

## 9. 变更文件

```text
src/composables/useQuota.ts
src/composables/__tests__/useQuota.test.ts
src/views/admin/QuotaConfigView.vue
src/views/admin/__tests__/QuotaConfigView.test.ts
src/views/admin/InterfaceManagementView.vue
src/components/admin/InterfaceConfigModal.vue
vite.config.ts
docs/superpowers/specs/2026-07-20-quota-formatting-duplication-remediation-design.md
../doc/前端代码架构审查报告.md
```

## 10. Git 流程

1. 从 `dev` 创建 `feature/fix-quota-formatting-duplication`。
2. 在 feature 分支提交设计文档。
3. 设计确认后，在同一 feature 分支完成代码、测试和前端仓库内文档修改。
4. 提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 等英文前缀。
5. 全部验证通过后合并到 `dev`，再删除临时 feature 分支。
6. 外层 `doc` 目录不由前端 Git 仓库跟踪，审查报告在代码验证完成后单独更新。
