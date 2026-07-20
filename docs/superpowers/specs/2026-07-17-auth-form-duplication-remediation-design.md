# 认证表单重复逻辑整改设计

## 1. 背景与目标

审查报告 6.1 指出 `LoginView.vue` 与 `RegisterView.vue` 仍重复维护认证字段模板、输入校验包装函数、抖动状态包装、错误样式和抖动动画。账号、密码和确认密码的核心规则虽然已经进入 `useAuthForm.ts`，但认证表单交互与展示尚未形成唯一实现。

本次整改按报告原建议完整抽取认证规则常量和 `AuthField.vue`，继续由 `useAuthForm.ts` 统一表单状态、校验和抖动交互。登录与注册页面只保留请求、Toast、用户状态和路由职责。现有字段文案、校验时机、错误反馈、请求载荷和跳转行为保持不变。

## 2. 设计原则

1. `AuthField.vue` 只负责字段展示与事件转发，不依赖 Service、Store、路由或 Toast。
2. `useAuthForm.ts` 是认证表单状态、校验和抖动交互的唯一入口。
3. 页面只编排登录或注册业务，不重新包装通用字段交互。
4. 账号规则集中到常量文件，密码规则继续复用现有 `passwordValidation.ts`。
5. 一次提交校验所有启用字段，不使用会跳过后续字段的短路校验。
6. 多个无效字段可以同时抖动，重复提交时同一字段可以重新触发动画。
7. 不改变认证接口、错误文案、Toast 时长、用户 Store 刷新或路由目标。

## 3. 组件架构

```text
LoginView
├── AuthField：账号
└── AuthField：密码

RegisterView
├── AuthField：账号
├── AuthField：密码
└── AuthField：确认密码

LoginView / RegisterView
  -> useAuthForm
      -> authRules
      -> passwordValidation
```

### `src/constants/authRules.ts`

集中导出账号格式正则和认证字段抖动持续时间。密码长度、字符范围及字母数字组合规则继续由 `src/utils/passwordValidation.ts` 提供，避免形成第二套密码规则。

### `src/components/auth/AuthField.vue`

组件统一渲染标签、输入框、错误文本、错误边框和抖动动画。

```ts
/** 认证字段组件属性。 */
interface AuthFieldProps {
  /** 字段标识，同时用于标签关联。 */
  id: string;
  /** 字段标签。 */
  label: string;
  /** 当前字段值。 */
  modelValue: string;
  /** 输入框类型。 */
  type?: 'text' | 'password';
  /** 输入占位文本。 */
  placeholder: string;
  /** 当前错误文本。 */
  error?: string;
  /** 是否显示抖动反馈。 */
  shaking?: boolean;
}

/** 认证字段组件事件。 */
interface AuthFieldEmits {
  /** 更新字段值。 */
  (event: 'update:modelValue', value: string): void;
  /** 字段输入后请求父级处理实时校验。 */
  (event: 'input'): void;
  /** 字段失焦后请求父级重新校验。 */
  (event: 'blur'): void;
}
```

组件内部保留 `.fei-input`、`.fei-input--error`、`.fei-field-error` 和 `.fei-field-error--shake` 契约，错误样式和 `shake` 关键帧只定义一次。组件不接收校验函数，也不理解账号或密码规则。

### `src/composables/useAuthForm.ts`

保留 `form`、`errors`、`validateAccount()`、`validatePassword()`、`validateCheckPassword()` 和 `clearErrors()`，并调整以下交互接口：

1. 使用按字段布尔值保存抖动状态，替代单一 `shakingField`。
2. `triggerShake(field)` 负责重新触发指定字段动画并在持续时间后清理状态。
3. `validate()` 独立执行所有启用字段的校验，对每个无效字段触发抖动，最终返回完整表单是否合法。
4. 提供 `onAccountInput()`、`onPasswordInput()` 和 `onCheckPasswordInput()`，供页面直接绑定。
5. 注册页密码变化且确认密码已有内容时，`onPasswordInput()` 同步重新校验确认密码。
6. 组合式函数卸载时清理各字段抖动定时器，避免遗留回调。

### `LoginView.vue` 与 `RegisterView.vue`

页面使用 `AuthField.vue` 替换原有字段模板，直接绑定组合式函数提供的输入和校验方法。提交时统一调用 `validate()`；返回 `false` 时立即结束，不调用 Service。

页面删除以下重复内容：

- `shake` getter 包装对象。
- 页面内 `triggerShake()`。
- `onAccountInput()`、`onPasswordInput()` 和 `onCheckPasswordInput()` 包装函数。
- scoped 错误输入样式、错误文本样式和抖动关键帧。

## 4. 数据流与行为规则

```text
用户输入
  -> AuthField 更新 modelValue
  -> AuthField 发出 input
  -> useAuthForm 输入处理函数
  -> 更新 errors
  -> AuthField 展示错误

用户提交
  -> useAuthForm.validate
  -> 校验所有启用字段
  -> 为每个无效字段触发独立抖动
  -> 失败：页面停止提交
  -> 成功：页面调用 userService
```

行为规则如下：

1. 账号输入和失焦时校验必填及账号格式。
2. 密码输入和失焦时校验必填、长度、字符范围及字母数字组合。
3. 注册页确认密码输入和失焦时校验必填及一致性。
4. 注册页密码变化且确认密码已有内容时立即重新校验确认密码。
5. 登录提交校验账号和密码；注册提交额外校验确认密码。
6. 一次提交中所有无效字段都获得错误文本和抖动反馈。
7. 抖动持续 400 毫秒，结束后状态自动清理。
8. 重复提交可以重新触发相同字段的抖动动画。
9. 校验失败不调用登录或注册 Service。
10. 校验成功后的请求载荷、成功 Toast、失败 Toast 和路由跳转保持原样。

## 5. 错误与生命周期处理

1. 字段校验函数只更新对应错误文本并返回布尔值，不捕获业务异常。
2. Service 异常继续由登录和注册页面按现有错误码映射处理。
3. 每个字段维护独立抖动定时器；重新触发前清理旧定时器。
4. 组件卸载时清理全部抖动定时器。
5. `AuthField.vue` 不发送 Toast，不改变焦点，不操作全局状态。

## 6. 测试与验收

| 测试对象 | 测试场景 |
| --- | --- |
| `useAuthForm` | 账号必填与格式；密码必填与格式；确认密码必填与一致性；注册密码联动校验；完整校验不短路；多个字段同时抖动；抖动自动清理；重复触发；清理错误 |
| `AuthField` | 标签与输入框关联；初始值；`v-model` 更新；输入和失焦事件；密码类型；错误文本；错误边框；抖动类 |
| `LoginView` | 渲染两个公共字段；非法表单不调用登录 Service；合法表单载荷保持不变 |
| `RegisterView` | 渲染三个公共字段；非法表单不调用注册 Service；合法表单载荷保持不变；密码变化联动确认密码校验 |
| 静态边界 | `AuthField.vue` 不引入 Service、Store、路由或 Toast；登录和注册页面不再定义认证错误样式与抖动关键帧 |

实现完成后执行：

```text
npm test
npm run coverage
npm run typecheck
npm run build
```

验收标准：

1. 相关测试和完整测试全部通过。
2. 全局覆盖率及核心模块覆盖率门禁通过。
3. 类型检查和生产构建通过。
4. 登录、注册页面的字段结构、错误反馈和提交行为无回归。
5. 审查报告 6.1 更新为“✅ 已解决”，并记录整改文件和验证结果。

## 7. 变更文件

```text
src/constants/authRules.ts
src/components/auth/AuthField.vue
src/components/auth/__tests__/AuthField.test.ts
src/composables/useAuthForm.ts
src/composables/__tests__/useBusinessLogic.test.ts
src/views/LoginView.vue
src/views/RegisterView.vue
src/views/__tests__/AuthViews.test.ts
docs/superpowers/specs/2026-07-17-auth-form-duplication-remediation-design.md
../doc/前端代码架构审查报告.md
```

## 8. Git 流程

1. 从 `dev` 创建 `feature/fix-auth-form-duplication`。
2. 在 feature 分支完成代码、测试和前端仓库内设计文档。
3. 使用中文提交说明并保留英文类型前缀。
4. 验证通过后合并到 `dev`，再删除临时 feature 分支。
5. 外层 `doc` 目录不受前端 Git 仓库管理，审查报告在代码验证完成后直接更新。
