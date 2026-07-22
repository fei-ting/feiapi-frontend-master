# UserVO 敏感字段边界整改设计

## 1. 背景与目标

审查报告 7.2 指出，前端通用用户类型 `UserVO` 声明了 `accessKey` 和 `secretKey`，但后端面向前端的 `UserVO.java` 以及公共模块的同名 `UserVO.java` 均不包含这两个字段。后端仅通过专用 `UserKeyVO.java` 和 `/user/get/keys` 接口返回当前用户密钥。

错误的前端类型声明扩大了通用登录用户对象允许承载的数据边界，可能诱导后续代码从登录态或公共用户信息中读取敏感字段。本次整改从前端 `UserVO` 移除这两个字段，并增加编译期类型断言，确保密钥只能通过专用模型和接口访问。

## 2. 设计原则

1. 通用用户模型不得声明访问密钥或 Secret Key。
2. 密钥只允许存在于 `UserKeyVO`，并继续由 `/user/get/keys` 专用接口返回。
3. 登录、当前用户加载、会话缓存、退出、资料修改和密码修改流程保持不变。
4. 访问密钥页面的加载、显示、隐藏、复制、错误提示和 SDK 示例行为保持不变。
5. 不修改后端代码、接口地址、请求响应处理或运行时业务逻辑。
6. 不顺带调整 `UserVO` 的其他字段、可选性或命名。
7. 使用编译期类型断言建立安全边界门禁，不依赖源码排版或正则表达式。

## 3. 已确认契约

### 通用用户链路

```text
/user/login
  -> 后端 UserVO
  -> userService.login(): Promise<UserVO>
  -> 用户会话 Store

/user/get/login
  -> 后端 UserVO
  -> userService.getLoginUser(): Promise<UserVO>
  -> 用户会话 Store
```

后端 `UserVO` 包含用户标识、昵称、账号、头像、性别、角色及时间字段，不包含 `accessKey` 或 `secretKey`。前端组件和 Store 当前也没有从 `UserVO` 读取这两个字段。

### 专用密钥链路

```text
/user/get/keys
  -> 后端 UserKeyVO
  -> userService.getCurrentUserKeys(): Promise<UserKeyVO>
  -> AccessKeysView.userKeys
  -> 密钥显示、隐藏和复制
```

该链路已经正确使用专用模型。本次不修改 `UserKeyVO`、服务方法或页面逻辑。

## 4. 类型变更

从 `src/types/user.ts` 的 `UserVO` 删除：

```text
accessKey?: string
secretKey?: string
```

`UserKeyVO` 继续保留：

```text
accessKey?: string
secretKey?: string
```

除上述删除外，`UserVO` 和 `UserKeyVO` 的其他声明均保持不变。

## 5. 测试设计

新增 `src/types/user.test.ts`，使用 Vitest `expectTypeOf` 执行编译期断言：

1. `UserVO` 不具有 `accessKey` 属性。
2. `UserVO` 不具有 `secretKey` 属性。
3. `UserKeyVO.accessKey` 的类型仍为 `string | undefined`。
4. `UserKeyVO.secretKey` 的类型仍为 `string | undefined`。

该测试由 `vue-tsc` 验证类型约束，同时由 Vitest 纳入测试文件基线。它不读取类型源码，不依赖注释、换行或接口声明顺序。

现有用户 Store 测试继续验证登录用户加载、缓存、刷新、退出和竞态保护；现有访问密钥页面测试继续验证密钥专用接口、显示和复制链路。由于运行时逻辑不变，不新增页面行为分支。

## 6. 安全与异常边界

1. 删除通用模型字段只收紧 TypeScript 允许的数据形状，不改变后端响应或运行时对象处理。
2. 密钥请求失败时，`AccessKeysView` 继续清空专用密钥状态并显示现有错误提示。
3. 未登录用户不会通过通用用户对象获得密钥；已登录用户仍需单独调用密钥接口。
4. 不记录、复制或转存新的敏感信息，不改变现有剪贴板安全处理。
5. 不将 `UserKeyVO` 合并回 `UserVO`，也不建立包含两者的聚合用户类型。

## 7. 验收标准

1. `UserVO` 不再声明 `accessKey` 和 `secretKey`。
2. `UserKeyVO` 仍声明两个可选字符串密钥字段。
3. 登录、会话、个人资料、密码修改和退出流程的源码没有改动。
4. `userService.getCurrentUserKeys()` 和 `AccessKeysView.vue` 的源码没有改动。
5. 后端仓库没有任何改动。
6. 新增的类型边界测试通过，并能在密钥字段重新进入 `UserVO` 时导致类型检查失败。
7. `yarn typecheck`、`yarn test`、`yarn coverage` 和 `yarn build` 全部通过。

## 8. 变更文件

```text
src/types/user.ts
src/types/user.test.ts
docs/superpowers/specs/2026-07-21-user-vo-sensitive-field-boundary-design.md
../doc/前端代码架构审查报告.md
```

审核报告位于前端 Git 仓库之外，仅在代码实现和验证完成后同步 7.2、阶段四、优先级汇总及最终结论，不与前端代码提交混合。

## 9. Git 流程

1. 从本地 `dev` 创建 `feature/remove-user-vo-keys`。
2. 在 feature 分支先提交本设计文档。
3. 用户复核设计说明后，在同一分支完成类型和测试修改。
4. 提交说明使用中文并保留 `docs:`、`fix:` 或 `test:` 前缀。
5. 全部验证和代码复核通过后，合并到 `dev` 并删除临时 feature 分支。
