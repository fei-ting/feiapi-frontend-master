# nanoid 依赖安全升级设计

## 背景

前端项目使用 Yarn Classic 1.22.22 和 `yarn.lock` 管理依赖。当前 `postcss` 通过
`^3.3.16` 间接依赖 `nanoid`，锁文件将其解析为 `nanoid@3.3.17`。

依赖安全审计命中 `GHSA-2v37-7h3g-55p8`（`CVE-2026-67213`）：受影响版本的
`customAlphabet` 和 `customRandom` 在长度为零时可能进入无限循环，造成拒绝服务。
审计建议升级到 `3.3.18` 或更高版本，因此现有 CI 依赖安全门禁失败。

## 目标

1. 将当前依赖树中的 `nanoid` 固定为已修复的 `3.3.18`。
2. 保持 `nanoid` 为间接依赖，不把它添加为业务直接依赖。
3. 保持现有中危及以上漏洞阻断策略，不添加漏洞白名单。
4. 确保冻结锁文件安装、静态检查、测试、覆盖率和生产构建均通过。

## 非目标

- 不升级 Vite、Vitest、PostCSS 或其他无关依赖。
- 不修改业务代码、页面交互、样式、接口契约或路由。
- 不降低 `audit-ci` 的安全阈值，也不临时放行该漏洞。
- 不改动 GitHub Actions 工作流。

## 方案比较与决策

### 方案一：通过 Yarn resolutions 固定修复版本

在 `package.json` 的 `resolutions` 中增加 `"nanoid": "3.3.18"`，再由 Yarn 更新
`yarn.lock`。该方案明确表达安全下限，能够约束所有符合当前依赖树的间接引用，且不会把
`nanoid` 伪装成业务直接依赖。

### 方案二：只更新 yarn.lock

重新解析 `nanoid@^3.3.16` 也可以得到修复版本，文件改动更少，但安全约束只体现在锁文件
结果中，后续依赖维护时不容易识别这是有意的安全固定。

### 方案三：升级上游构建依赖

升级 Vite 或 PostCSS 可能间接带来新版 `nanoid`，但会扩大依赖变更和回归范围，不符合本次
漏洞修复的最小改动原则。

本次采用方案一，精确固定 `nanoid@3.3.18`。

## 实现设计

1. 在 `package.json` 的 `resolutions` 节点增加 `nanoid` 精确版本约束。
2. 使用 Yarn Classic 重新解析依赖并更新 `yarn.lock`，不手工拼接锁文件内容。
3. 使用 `yarn why nanoid` 确认依赖来源仍为 Vite/PostCSS，实际版本为 `3.3.18`。
4. 使用冻结锁文件安装验证依赖声明与锁文件一致。
5. 重新执行现有依赖审计，确认目标漏洞不再命中且没有中危及以上漏洞。

## 异常处理

- 如果 `3.3.18` 与上游声明不兼容，则停止实施并重新评估上游依赖升级，不能通过白名单绕过。
- 如果审计源或包注册源不可用，验证保持失败，不把“未完成审计”视为安全通过。
- 如果测试或构建失败，保留 feature 分支诊断，不合并到 `dev`。

## 测试与验收

依次执行以下检查：

1. `yarn install --frozen-lockfile`
2. `yarn why nanoid`
3. `yarn audit:dependencies`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn test`
7. `yarn coverage`
8. `yarn build`
9. `yarn check:size`

验收标准为：`nanoid` 实际解析版本等于 `3.3.18`，依赖安全审计通过，其余质量门禁无回退。

## 预计修改文件

- `package.json`
- `yarn.lock`
- `docs/superpowers/specs/2026-08-19-nanoid-security-upgrade-design.md`

## Git 流程

1. 从 `dev` 创建 `feature/fix-nanoid-security`。
2. 单独提交本设计文档并由用户复核。
3. 完成依赖声明、锁文件修改和全部验证后提交实现。
4. 将 feature 分支以非快进方式合并回 `dev`。
5. 删除本地 feature 分支。
