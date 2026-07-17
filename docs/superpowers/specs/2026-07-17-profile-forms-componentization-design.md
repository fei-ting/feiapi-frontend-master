# 个人资料表单组件化设计

## 1. 背景与目标

`src/views/profile/ProfileInfoView.vue` 当前同时渲染基础资料和密码修改表单，并处理两套校验与提交流程。第三项整改只调整组件边界和测试，不改变现有视觉、文案、校验规则、Toast、Service 调用和用户 Store 刷新行为。

## 2. 设计原则

1. 父页面继续持有表单状态、校验规则、Service、Store 和 Toast。
2. 子组件只通过 Props/Events 渲染和传递用户输入，不直接依赖 Service、Store 或路由。
3. 保留现有 DOM 层级、class 名称、自动填充属性、校验顺序和用户操作时序。
4. 不为仅使用一次的表单额外引入组合式函数。

## 3. 组件架构

```text
ProfileInfoView
├── ProfileForm
└── PasswordForm
```

### `src/types/profile.ts`

```ts
/** 个人资料表单模型。 */
export interface ProfileFormModel {
  /** 用户昵称。 */
  userName: string;
  /** 用户性别，0 为男，1 为女。 */
  gender: 0 | 1;
}

/** 密码修改表单模型。 */
export interface PasswordFormModel {
  /** 当前密码。 */
  oldPassword: string;
  /** 新密码。 */
  newPassword: string;
  /** 新密码确认值。 */
  checkPassword: string;
}
```

### `ProfileForm.vue`

- 保留昵称、性别字段、错误文本和提交按钮。
- 昵称输入继续执行等价于 `v-model.trim` 的首尾空白处理。
- 不包含正则、Service、Store 或 Toast。

```ts
interface ProfileFormProps {
  /** 当前个人资料表单值。 */
  modelValue: ProfileFormModel;
  /** 昵称校验错误文本。 */
  nicknameError: string;
  /** 是否正在提交资料。 */
  submitting: boolean;
}

interface ProfileFormEmits {
  /** 更新昵称。 */
  (event: 'update:userName', value: string): void;
  /** 更新性别。 */
  (event: 'update:gender', value: 0 | 1): void;
  /** 提交个人资料。 */
  (event: 'submit'): void;
}
```

### `PasswordForm.vue`

- 保留三个密码字段、自动填充属性和提交按钮。
- 不执行完整性、复杂度、一致性或新旧密码校验。

```ts
interface PasswordFormProps {
  /** 当前密码表单值。 */
  modelValue: PasswordFormModel;
  /** 是否正在提交密码。 */
  submitting: boolean;
}

interface PasswordFormEmits {
  /** 更新当前密码。 */
  (event: 'update:oldPassword', value: string): void;
  /** 更新新密码。 */
  (event: 'update:newPassword', value: string): void;
  /** 更新确认密码。 */
  (event: 'update:checkPassword', value: string): void;
  /** 提交密码修改。 */
  (event: 'submit'): void;
}
```

### `ProfileInfoView.vue`

- 保留页面卡片、标题和双表单布局。
- 保留两组响应式状态、昵称计算属性、全部校验规则、Service 调用、Toast 和 `refreshLoginUser`。
- 通过字段事件更新现有 reactive 表单对象。

## 4. 数据流与错误边界

```text
userStore.loginUser
  -> ProfileInfoView.syncProfileForm
  -> profileForm
  -> ProfileForm props

ProfileForm 字段事件
  -> ProfileInfoView 更新 profileForm
  -> nicknameError 重新计算

ProfileForm submit
  -> 页面校验昵称和性别
  -> userService.updateCurrentUserProfile
  -> userStore.refreshLoginUser
  -> Toast

PasswordForm submit
  -> 页面执行四项密码校验
  -> userService.updateCurrentUserPassword
  -> 清空密码字段
  -> Toast
```

保持以下行为不变：

1. 登录用户变化时立即同步昵称和性别。
2. 用户性别不是 `1` 时回落为 `0`。
3. 昵称为空时不显示行内错误，提交逻辑保持当前行为。
4. 昵称长度、字符规则和错误文案不变。
5. 昵称或性别校验失败时不调用 Service。
6. 资料更新成功后显示“个人信息已更新”，再刷新用户 Store。
7. 资料更新失败时优先展示异常消息，否则显示“个人信息更新失败”。
8. 密码依次校验完整性、8～16 位字母数字组合、两次输入一致、新旧密码不同。
9. 密码更新成功后清空三个密码字段并显示“密码已修改”。
10. 密码更新失败时保留输入值，优先展示异常消息，否则显示“密码修改失败”。
11. 两个表单分别维护提交状态，互不禁用。
12. 子组件不维护请求状态，不捕获异常，也不直接发送 Toast。
13. 本次不新增实时密码校验、密码可见切换、确认弹窗或防重复请求逻辑。

## 5. 样式处理

保留现有 `.fei-card`、`.fei-card-header`、`.fei-card-body`、`.fei-profile-form-grid`、`.fei-profile-form-section`、`.fei-profile-form-title`、`.fei-form` 和 `.fei-field` 等 class。

页面保留卡片、标题、主体和双表单网格 DOM；两个子组件分别保留原有 `<section>` 和 `<form>` 层级。继续使用现有全局表单样式，不新增 scoped 样式，也不调整颜色、间距、断点和移动端布局。

实施后精确比较拆分前后的 `fei-*` class 集合，并进行桌面、移动端截图检查。

## 6. 测试与验收

| 测试对象 | 测试场景 |
| -------- | -------- |
| `ProfileForm` | 初始昵称和性别；昵称输入去除首尾空格；性别更新事件；昵称错误展示；错误时禁用按钮；提交状态文案；提交事件 |
| `PasswordForm` | 三个密码字段值；字段更新事件；密码输入类型与 autocomplete；提交状态和按钮禁用；提交事件 |
| `ProfileInfoView` | Store 用户立即同步；昵称长度与字符校验；性别校验；资料成功、失败和 Store 刷新；密码空字段、复杂度、不一致、新旧相同校验；密码成功清空；密码失败保留；两个提交状态相互独立 |
| 静态边界 | 子组件不得引入 Service、Store 或路由；class 集合一致；父页面和组件规模满足约束 |

实现完成后执行：

```text
npm test
npm run typecheck
npm run build
```

并在桌面及移动端确认两个表单不存在重叠、溢出或文本截断。

## 7. 文件规模目标

| 文件 | 目标行数 |
| ---- | -------: |
| `ProfileInfoView.vue` | 170～210 |
| `ProfileForm.vue` | 65～90 |
| `PasswordForm.vue` | 70～95 |

验收底线为父页面不超过 210 行，任一表单组件不超过 100 行，并且不存在越界依赖。

## 8. 变更文件

```text
src/views/profile/ProfileInfoView.vue
src/views/profile/__tests__/ProfileInfoView.test.ts
src/components/profile/ProfileForm.vue
src/components/profile/PasswordForm.vue
src/components/profile/__tests__/ProfileForm.test.ts
src/components/profile/__tests__/PasswordForm.test.ts
src/types/profile.ts
```
