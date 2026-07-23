# 无效代码与服务边界整改设计

## 1. 背景与目标

前端代码架构审查报告第九项指出，部分服务方法、服务对象和领域类型没有明确调用方，并且分析服务与 Dashboard 服务曾请求同一个接口，造成职责边界重叠。

当前源码复核结果如下：

- `src/services/dashboard.ts` 中的 `getTopInterfaces` 无调用方。
- `src/services/userInterfaceInfo.ts` 中的 `adminListPage` 无调用方。
- `src/services/analysis.ts` 导出的 `analysisService` 无调用方。
- `src/types/dashboard.ts` 中的 `DashboardData` 无调用方。
- 报告提到的 `AdminView.vue` 和 `submitQuotaConfig` 已不在当前源码中，无需重复处理。

本次整改目标是删除已确认无调用方的代码，消除分析服务与 Dashboard 服务的重复边界，并通过静态架构测试防止这些无效导出回流。页面功能、请求协议和现有有效服务行为保持不变。

## 2. 方案比较

### 2.1 直接删除无调用代码（采用）

删除无调用方法、重复服务文件和无效类型，不提供兼容转导出。该方案与当前仓库实际调用关系一致，能够直接降低维护成本，并避免继续保留没有消费者的契约。

### 2.2 合并分析服务与 Dashboard 服务

把 `analysisService.topInvoke` 迁移到 Dashboard 服务并保留一个方法。该接口当前没有任何页面消费，保留后仍属于推测性能力，不能解决无效代码问题，因此不采用。

### 2.3 保留并标记废弃

通过 `@deprecated` 注释保留现有导出。前端工程没有独立发布这些服务模块，也没有仓库外兼容要求；标记废弃只会延长边界模糊状态，因此不采用。

## 3. 代码边界

### 3.1 Dashboard 服务

`dashboardService` 只保留当前 Dashboard 页面实际使用的概览、趋势、告警和最近变更接口。删除 `getTopInterfaces` 以及仅为该方法引入的 `InterfaceInfoVO` 类型依赖。

### 3.2 分析服务

`analysisService` 仅包含无调用的 `topInvoke`，且与已删除的 Dashboard 方法访问同一接口，因此删除整个 `src/services/analysis.ts` 文件。后续若出现明确的分析页面需求，应按实际用例重新建立分析领域服务，而不是提前保留接口封装。

### 3.3 用户接口信息服务

`userInterfaceInfoService` 保留个人调用记录页面使用的 `myListPage`，删除没有后台页面消费者的 `adminListPage`。后续后台查询需求应在页面和接口契约明确后重新增加，并补充对应测试。

### 3.4 Dashboard 类型

删除未被使用的聚合类型 `DashboardData`。保留 Dashboard 四类接口分别使用的 `DashboardOverview`、`DashboardTrends`、`AlertInterface` 和 `ChangedInterface`，避免引入与实际分请求加载方式不一致的聚合契约。

## 4. 测试设计

新增静态边界测试，读取相关源码并验证：

1. `analysis.ts` 不再存在。
2. Dashboard 服务不再导出或包含 `getTopInterfaces`。
3. 用户接口信息服务不再导出或包含 `adminListPage`。
4. Dashboard 类型文件不再声明 `DashboardData`。
5. 保留的 Dashboard 和个人调用记录服务仍通过现有行为测试验证。

验收时执行：

```text
npm run typecheck
npm test
npm run coverage
npm run build
```

## 5. 文件范围

```text
删除：
src/services/analysis.ts

修改：
src/services/dashboard.ts
src/services/userInterfaceInfo.ts
src/types/dashboard.ts
tsconfig.json
doc/前端代码架构审查报告.md

新增：
src/services/__tests__/serviceBoundaries.test.ts
docs/superpowers/specs/2026-07-23-dead-code-boundary-cleanup-design.md
```

审查报告位于前端仓库外层，由上层项目统一管理；实现完成后同步更新第九项整改状态和验证结果。

## 6. 验收标准

1. 四项已确认无调用代码全部删除，源码中不存在残留引用。
2. `dashboardService`、`userInterfaceInfoService` 的职责与现有调用方一致。
3. 不改变任何页面行为和后端请求协议。
4. 静态边界测试、全量测试、覆盖率、类型检查和生产构建全部通过。

## 7. Git 流程

1. 从 `dev` 创建 `feature/cleanup-unclear-dead-code`。
2. 在 feature 分支提交本设计文档。
3. 在同一 feature 分支完成代码清理、测试和审查报告更新。
4. 验证完成后保留未提交修改，等待人工审核。
5. 人工审核通过后，提交说明使用中文并保留 `docs:`、`refactor:` 或 `test:` 前缀。
6. 提交和代码审查通过后合并回 `dev`，再删除临时 feature 分支。
