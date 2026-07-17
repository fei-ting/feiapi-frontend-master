# 个人资料表单组件化设计

## 1. 背景与目标

`src/views/profile/ProfileInfoView.vue` 当前同时渲染基础资料和密码修改表单，并处理两套校验与提交流程。第三项整改拆分两个表单组件，并为密码修改表单补充与登录、注册页一致的新密码实时格式校验。现有视觉、Service 调用、Toast 和用户 Store 刷新行为保持不变。

## 2. 设计原则

1. 父页面继续持有表单状态、校验规则、Service、Store 和 Toast。
2. 子组件只通过 Props/Events 渲染和传递用户输入，不直接依赖 Service、Store 或路由。
3. 保留现有 DOM 层级、class 名称、自动填充属性、提交校验顺序和用户操作时序。
4. 登录、注册和修改密码共用同一密码格式校验函数，禁止复制正则和错误文案。
5. 不为仅使用一次的表单额外引入组合式函数。

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

/** 密码修改表单错误模型。 */
export interface PasswordFormErrors {
  /** 当前密码错误文本。 */
  oldPassword: string;
  /** 新密码错误文本。 */
  newPassword: string;
  /** 确认密码错误文本。 */
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
- 展示父页面传入的实时错误文本和输入框错误状态。
- 不自行执行完整性、复杂度、一致性或新旧密码校验。

```ts
interface PasswordFormProps {
  /** 当前密码表单值。 */
  modelValue: PasswordFormModel;
  /** 当前密码表单错误。 */
  errors: PasswordFormErrors;
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
  /** 请求父页面校验指定字段。 */
  (event: 'validate-field', field: keyof PasswordFormModel): void;
  /** 提交密码修改。 */
  (event: 'submit'): void;
}
```

### `ProfileInfoView.vue`

- 保留页面卡片、标题和双表单布局。
- 保留两组响应式状态、昵称计算属性、密码错误状态、全部提交校验、Service 调用、Toast 和 `refreshLoginUser`。
- 通过字段事件更新现有 reactive 表单对象。

### `src/utils/passwordValidation.ts`

提供登录、注册和修改密码共同使用的纯密码格式校验函数。该函数只校验 8～16 位长度、字符范围和必须同时包含字母及数字，不处理必填、确认密码或新旧密码关系。

```ts
/**
 * 获取密码格式错误文本。
 * @param password 待校验密码
 * @returns 格式正确时返回空字符串，否则返回错误文本
 */
export function getPasswordFormatError(password: string): string;
```

`useAuthForm.ts` 保留原有必填判断，并改为调用该函数，确保登录和注册行为不变。

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
  -> 页面执行必填、格式、确认密码和新旧密码校验
  -> userService.updateCurrentUserPassword
  -> 清空密码字段
  -> Toast
```

行为规则如下：

1. 登录用户变化时立即同步昵称和性别。
2. 用户性别不是 `1` 时回落为 `0`。
3. 昵称为空时不显示行内错误，提交逻辑保持当前行为。
4. 昵称长度、字符规则和错误文案不变。
5. 昵称或性别校验失败时不调用 Service。
6. 资料更新成功后显示“个人信息已更新”，再刷新用户 Store。
7. 资料更新失败时优先展示异常消息，否则显示“个人信息更新失败”。
8. 旧密码输入和失焦时只实时校验必填，不校验长度和字符格式。
9. 新密码输入和失焦时实时校验必填、8～16 位长度、只能包含字母和数字且必须同时包含两者。
10. 确认密码输入和失焦时实时校验必填及是否与新密码一致。
11. 新密码变化且确认密码已有内容时，立即重新校验确认密码。
12. 旧密码或新密码变化时不实时比较两者是否相同，不显示对应行内错误。
13. 提交时依次校验三项必填、新密码格式、确认密码一致、新旧密码不同；新旧密码相同时仍提示“新密码不能与旧密码相同”并阻止请求。
14. 密码更新成功后清空三个密码字段和全部密码错误，并显示“密码已修改”。
15. 密码更新失败时保留输入值，优先展示异常消息，否则显示“密码修改失败”。
16. 两个表单分别维护提交状态，互不禁用。
17. 子组件不维护请求状态，不捕获异常，也不直接发送 Toast。
18. 本次不新增密码可见切换、确认弹窗或防重复请求逻辑。

## 5. 样式处理

保留现有 `.fei-card`、`.fei-card-header`、`.fei-card-body`、`.fei-profile-form-grid`、`.fei-profile-form-section`、`.fei-profile-form-title`、`.fei-form` 和 `.fei-field` 等 class。

页面保留卡片、标题、主体和双表单网格 DOM；两个子组件分别保留原有 `<section>` 和 `<form>` 层级。继续使用现有全局表单样式。

`PasswordForm.vue` 增加与登录、注册页一致的 scoped 错误样式，包括 `.fei-input--error` 和 `.fei-field-error`，只用于实时错误边框和错误文本，不增加抖动动画。不调整其他颜色、间距、断点和移动端布局。

实施后精确比较拆分前后的 `fei-*` class 集合，并进行桌面、移动端截图检查。

## 6. 测试与验收

| 测试对象 | 测试场景 |
| -------- | -------- |
| `ProfileForm` | 初始昵称和性别；昵称输入去除首尾空格；性别更新事件；昵称错误展示；错误时禁用按钮；提交状态文案；提交事件 |
| `PasswordForm` | 三个密码字段值；字段更新和失焦校验事件；错误文本与错误样式；密码输入类型与 autocomplete；提交状态和按钮禁用；提交事件 |
| `ProfileInfoView` | Store 用户立即同步；昵称长度与字符校验；性别校验；资料成功、失败和 Store 刷新；旧密码仅必填；新密码实时长度与格式；确认密码实时一致性及联动；新旧密码只在提交时比较；密码成功清空；密码失败保留；两个提交状态相互独立 |
| `passwordValidation` | 8～16 位边界；缺少字母；缺少数字；包含特殊字符；合法字母数字组合 |
| `useAuthForm` | 登录、注册继续复用共享格式函数，原有必填、格式和确认密码错误文案不变 |
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
| `ProfileInfoView.vue` | 190～240 |
| `ProfileForm.vue` | 65～90 |
| `PasswordForm.vue` | 100～140 |

验收底线为父页面不超过 240 行，任一表单组件不超过 150 行，并且不存在越界依赖。

## 8. 变更文件

```text
src/views/profile/ProfileInfoView.vue
src/views/profile/__tests__/ProfileInfoView.test.ts
src/components/profile/ProfileForm.vue
src/components/profile/PasswordForm.vue
src/components/profile/__tests__/ProfileForm.test.ts
src/components/profile/__tests__/PasswordForm.test.ts
src/types/profile.ts
src/utils/passwordValidation.ts
src/composables/useAuthForm.ts
src/composables/__tests__/useBusinessLogic.test.ts
```
