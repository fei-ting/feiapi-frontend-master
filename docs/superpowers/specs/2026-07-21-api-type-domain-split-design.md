# api.ts 类型领域拆分整改设计

## 1. 背景与目标

审查报告 7.1 指出，`src/types/api.ts` 已增长到 450 行，集中导出 27 个跨领域类型，并被 37 个源码及测试文件直接引用。文件同时承担通用响应、用户、接口、接口文档、配额、分页和请求参数定义，导致类型边界不清晰，新增或修改一个领域类型时需要在聚合文件中定位无关内容。

本次整改仅处理 7.1：按业务领域拆分类型文件，迁移所有调用方到所属领域模块，并删除 `api.ts` 聚合入口。类型字段、可选性、字面量联合和运行时行为保持不变；7.2 中 `UserVO` 的密钥字段本轮不处理。

## 2. 设计原则

1. 每个类型只归属于一个明确领域，跨领域依赖通过类型导入表达。
2. 调用方直接引用领域类型文件，不新增统一聚合入口。
3. 现有类型名称、字段结构、字段可选性和字面量联合保持不变。
4. 现有 `dashboard.ts`、`home.ts`、`profile.ts`、`invoke.ts` 和 `interfaceDocEditor.ts` 等领域文件继续复用，不重复建立同名类型。
5. 所有新增或迁移的实体类型及字段保留或补齐中文注释。
6. 本次不改变服务接口、页面行为、请求响应结构或 `UserVO` 的密钥字段。

## 3. 类型归属

```text
src/types/common.ts
  ResponseData
  PageResult
  SortOrder
  IdRequest

src/types/user.ts
  UserVO
  UserKeyVO
  LoginRequest
  RegisterRequest
  CurrentUserProfileUpdateRequest
  CurrentUserPasswordUpdateRequest

src/types/interface.ts
  InterfaceInfoVO
  InterfaceQuery
  InterfaceInfoAddRequest
  InterfaceInfoUpdateRequest

src/types/interfaceDoc.ts
  InterfaceDocInterfaceInfoVO
  InterfaceDocVO
  InterfaceDocParamVO
  InterfaceDocErrorCodeVO
  InterfaceDocDetailVO
  InterfaceDocParamSaveRequest
  InterfaceDocErrorCodeSaveRequest
  InterfaceDocSaveRequest

src/types/quota.ts
  InterfaceQuotaType
  UserInterfaceInfoVO
  InterfaceQuotaConfigVO
  InterfaceQuotaConfigUpdateRequest

src/types/invoke.ts
  InvokeTab（已有）
  InvokeRequest（从 api.ts 迁移）
```

领域间依赖保持单向：`interface.ts` 和 `interfaceDoc.ts` 依赖 `quota.ts` 中的 `InterfaceQuotaType`，`interface.ts` 依赖 `common.ts` 中的 `SortOrder`，文档编辑器依赖 `interfaceDoc.ts` 中的保存请求类型。

## 4. 调用方迁移

当前 36 个直接引用 `@/types/api` 的组件、组合式函数、服务、Store、页面和测试文件，按实际使用的类型改为直接引用 `@/types/common`、`@/types/user`、`@/types/interface`、`@/types/interfaceDoc`、`@/types/quota` 或 `@/types/invoke`。

`src/types/interfaceDocEditor.ts` 改为从 `@/types/interfaceDoc` 引入 `InterfaceDocErrorCodeSaveRequest`。原 `src/types/api.test.ts` 迁移为 `src/types/interfaceDoc.test.ts`，继续验证接口文档公开类型契约，但读取新的 `interfaceDoc.ts` 源文件。

迁移完成后删除 `src/types/api.ts`，源码中不得残留 `@/types/api` 引用，也不得新增 `src/types/index.ts` 或其他聚合转导出文件。

## 5. 测试与验证

类型拆分不增加运行时逻辑，因此不新增业务行为测试。现有接口文档结构契约测试随文件迁移，断言内容保持等价。

验收时执行：

```text
yarn typecheck
yarn test
yarn coverage
yarn build
```

同时使用文本检索确认：

1. `src/types/api.ts` 已删除。
2. `src` 目录中不存在 `@/types/api`。
3. 27 个原类型均在目标领域文件中导出。
4. `UserVO` 字段与本次整改前完全一致，尤其不修改 `accessKey` 和 `secretKey`。

## 6. 失败处理与回滚边界

1. 如果类型检查出现循环依赖，优先调整类型归属或拆出仅含字面量的领域类型，不恢复聚合入口。
2. 如果测试失败，只修正由导入路径或测试源文件路径迁移造成的问题，不修改页面业务逻辑。
3. 如果构建失败且原因与类型拆分无关，保留失败输出并单独记录，不扩大本次整改范围。
4. 代码修改集中在类型定义、类型导入和契约测试；出现异常时可通过 feature 分支提交回退，不影响 `dev`。

## 7. 验收标准

1. 类型按上述领域文件拆分完成，`api.ts` 不再存在。
2. 所有调用方直接引用所属领域类型，没有新的类型聚合入口。
3. 类型结构和 `UserVO` 字段保持兼容，7.2 未被提前处理。
4. `yarn typecheck`、`yarn test`、`yarn coverage` 和 `yarn build` 全部通过。

## 8. 变更文件

```text
新增：
src/types/common.ts
src/types/user.ts
src/types/interface.ts
src/types/interfaceDoc.ts
src/types/quota.ts

修改：
src/types/invoke.ts
src/types/interfaceDocEditor.ts
当前 36 个直接引用 @/types/api 的源码及测试文件

迁移/删除：
src/types/api.test.ts -> src/types/interfaceDoc.test.ts
删除 src/types/api.ts
```

## 9. Git 流程

1. 从 `dev` 创建 `feature/split-api-types`。
2. 在 feature 分支先提交本设计文档。
3. 用户复核设计文档后，在同一 feature 分支实施代码迁移。
4. 提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 前缀。
5. 验证通过后合并回 `dev`，再删除临时 feature 分支。
