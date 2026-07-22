# 本地默认头像与来源安全边界整改设计

## 1. 背景与目标

审查报告 7.3 指出，`AppHeader.vue` 和 `ProfileLayout.vue` 分别硬编码了相同的 DiceBear 外部默认头像地址，并直接把后端返回的 `userAvatar` 绑定到 `<img src>`。当前实现存在重复配置、默认展示依赖第三方服务、任意外部图片请求和加载失败后缺少回退等问题。

业务规范要求：首次注册用户使用本地默认头像；用户未来可以自定义上传头像，上传文件存储于阿里云 OSS，但后端对象存储当前仍是占位实现。本次整改只建设前端头像展示、安全解析和回退能力，不提前实现缺少后端支撑的上传流程。

## 2. 设计原则

1. 首次注册用户的 `userAvatar` 保持为空，不把前端静态资源路径写入数据库。
2. 默认头像完全使用应用内已有的 `/logo.svg`，不再请求 DiceBear 或其他第三方默认图服务。
3. 两处头像展示统一复用一个组件，不重复维护地址选择和错误回退逻辑。
4. 同源 HTTP/HTTPS 图片允许展示，适配开发环境和未来同域代理资源。
5. 外部图片只允许 HTTPS，且 Origin 必须显式配置在可信来源列表中。
6. 拒绝未授权来源、包含用户凭据的 URL、非法 URL 以及 `data:`、`javascript:`、`blob:` 等非 HTTP 协议。
7. 可信图片加载失败时回退本地默认头像，默认头像失败时不重复切换，避免错误循环。
8. 不修改注册、登录、会话 Store、个人资料保存、退出或其他现有业务流程和规则。

## 3. 业务场景

### 首次注册用户

```text
后端 UserVO.userAvatar 为空
  -> UserAvatar 接收空地址
  -> 显示本地 /logo.svg
```

本地默认头像由前端展示层负责，后端无需保存与部署路径耦合的默认值。

### 同源头像

```text
后端返回 /uploads/avatar.png 或当前站点绝对 URL
  -> resolveAvatarUrl 校验为同源 HTTP/HTTPS
  -> 正常显示
```

### 未来阿里云 OSS 头像

```text
后端对象存储接入并返回 HTTPS OSS URL
  -> 部署环境配置 VITE_AVATAR_ALLOWED_ORIGINS
  -> resolveAvatarUrl 校验 OSS Origin
  -> 正常显示
```

环境变量只保存公开的可信 Origin，不包含访问密钥、Secret 或签名信息。多个 Origin 使用英文逗号分隔。

### 不可信或失效头像

```text
地址非法、协议不允许或来源未授权
  -> 解析阶段直接使用 /logo.svg

可信图片网络加载失败
  -> img error 事件切换到 /logo.svg
```

## 4. 地址解析规则

新增 `src/utils/avatar.ts`，导出本地默认头像常量和头像地址解析函数。

解析顺序：

1. 对输入执行 `trim()`；空值直接返回 `/logo.svg`。
2. 使用当前页面 Origin 作为基准解析相对地址。
3. URL 包含用户名或密码时拒绝。
4. 协议不是 `http:` 或 `https:` 时拒绝。
5. URL Origin 与当前页面 Origin 相同时允许；开发环境的同源 HTTP 因此可以正常使用。
6. 外部 URL 必须使用 `https:`，并且 Origin 存在于 `VITE_AVATAR_ALLOWED_ORIGINS` 解析出的集合中。
7. 其他情况返回 `/logo.svg`。

可信来源配置解析时忽略空项和非法 URL；配置项必须是只包含协议、主机和可选端口的 HTTP/HTTPS Origin。包含用户名、密码、非根路径、查询参数或片段的配置项视为非法并忽略。外部 HTTP Origin 即使被配置也不允许展示。

## 5. 共享头像组件

新增 `src/components/UserAvatar.vue`，组件职责为：

1. 接收可选 `src` 和必需 `alt`。
2. 通过 `resolveAvatarUrl()` 计算可展示地址。
3. 将调用方传入的 class 和其他标准图片属性透传到根 `<img>`。
4. 图片触发 `error` 时，将当前图片切换为 `/logo.svg`。
5. 如果当前地址已经是本地默认头像，不再次赋值，防止错误事件循环。
6. `src` 属性变化时重新执行地址解析，使用户会话刷新后可以显示新头像。

`AppHeader.vue` 使用该组件替换小头像 `<img>`，继续保留空 `alt`，维持装饰性图片语义。`ProfileLayout.vue` 使用该组件替换个人中心头像 `<img>`，继续使用用户昵称作为替代文本。原有 CSS 类名和尺寸样式保持不变。

## 6. 环境配置

在 `.env.example` 增加：

```text
VITE_AVATAR_ALLOWED_ORIGINS=
```

注释说明该值用于配置可信头像 CDN 或 OSS Origin，例如完整的 `https://bucket.example.com`，多个值使用英文逗号分隔。

在 `src/env.d.ts` 增加可选字符串类型声明。未配置时只允许同源头像，不影响首次注册用户的本地默认头像。

## 7. 测试设计

### 地址解析测试

新增 `src/utils/__tests__/avatar.test.ts`，覆盖：

1. 空值和纯空白返回本地默认头像。
2. 根路径、相对路径和同源绝对 HTTP/HTTPS 地址正常解析。
3. 白名单中的外部 HTTPS OSS Origin 允许展示。
4. 未授权外部 Origin 回退默认头像。
5. 外部 HTTP、`data:`、`javascript:`、`blob:` 和非法地址回退默认头像。
6. 包含用户名或密码的 URL 回退默认头像。
7. 多个白名单值、空项和非法配置不会破坏解析。
8. 带凭据、路径、查询或片段的白名单配置被忽略，不会意外放宽整个 Origin。

### 组件测试

新增 `src/components/__tests__/UserAvatar.test.ts`，覆盖：

1. 空地址渲染本地默认头像。
2. 合法地址正常渲染，并透传 class 和 `alt`。
3. 图片加载失败后回退本地默认头像。
4. 本地默认头像自身失败时不重复修改 `src`。
5. `src` 属性更新后重新解析并更新图片。

现有布局路由测试继续验证个人中心布局。验收时额外检索生产源码，确保不存在 DiceBear 地址，且 `AppHeader.vue`、`ProfileLayout.vue` 均使用 `UserAvatar`。

### 覆盖率门禁

在 `vite.config.ts` 为 `src/components/UserAvatar.vue` 和 `src/utils/avatar.ts` 增加核心模块覆盖率阈值，沿用项目标准：

- 语句和行不低于 90%。
- 函数不低于 85%。
- 分支不低于 80%。

## 8. 异常与安全边界

1. 地址解析异常在工具函数内部转为本地默认头像，不向页面抛出。
2. 图片网络错误只影响头像展示，不影响登录状态、导航或个人中心渲染。
3. 白名单环境变量是公开构建配置，禁止放入 OSS 密钥、签名或其他敏感信息。
4. URL Origin 匹配使用标准 `URL` API，不使用字符串前缀判断，避免相似域名绕过。
5. 本次不代理远程图片、不下载或缓存 OSS 内容，也不改变浏览器对图片请求的默认安全行为。

## 9. 验收标准

1. 生产源码中不存在 DiceBear 外部默认头像地址。
2. 首次注册用户在 `userAvatar` 为空时显示本地 `/logo.svg`。
3. 两处头像统一使用 `UserAvatar.vue`。
4. 同源地址和显式白名单中的 HTTPS OSS 地址允许显示，其余来源回退本地图。
5. 合法头像加载失败后自动回退本地图，且不会形成错误循环。
6. 注册、登录、会话、个人资料及后端代码均未修改。
7. 专项测试、全量测试、覆盖率、类型检查和生产构建全部通过。

## 10. 变更文件

```text
新增：
src/components/UserAvatar.vue
src/components/__tests__/UserAvatar.test.ts
src/utils/avatar.ts
src/utils/__tests__/avatar.test.ts

修改：
src/components/AppHeader.vue
src/layouts/ProfileLayout.vue
src/env.d.ts
.env.example
vite.config.ts

设计与报告：
docs/superpowers/specs/2026-07-21-local-avatar-security-boundary-design.md
../doc/前端代码架构审查报告.md
```

审核报告位于前端 Git 仓库之外，只在代码实现和验证完成后同步 7.3、7.4 关联说明、第七部分基线和最终汇总状态。

## 11. Git 流程

1. 从本地 `dev` 创建 `feature/local-avatar-security-boundary`。
2. 在 feature 分支先提交本设计文档。
3. 用户复核设计说明后，在同一分支完成工具、组件、调用方、配置和测试修改。
4. 提交说明使用中文并保留 `docs:`、`fix:` 或 `test:` 前缀。
5. 全部验证和代码复核通过后，合并到 `dev` 并删除临时 feature 分支。
