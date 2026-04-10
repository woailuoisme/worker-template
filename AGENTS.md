# Agent 规范与项目架构指南

这是一份为 AI 代理（Claude Code / Roo / Cursor / Antigravity）量身定制的项目级约定。`AGENTS.md` 是源文件；`CLAUDE.md` 与 `GEMINI.md` 通过 `make sync-agents` 保持同步。

## 1. 优先级 (Priority)

1. **顶级指令**: 必须首先遵守本文件（`AGENTS.md`）。
2. **执行增强**: 遵守 `RTK.md` 说明书，所有操作优先使用 `rtk` 代理。
3. **领域知识**: 优先参考 `.agents/skills/` 中已锁定的技能。

## 2. 核心硬规则 (Hard Rules)

- **工具代理**: 所有 shell 命令（git, pnpm, make 等）**必须** 优先尝试使用 `rtk` 包装执行以节省 Token。
- **质量前置**: 任何代码修改后，**必须** 运行 `rtk make check`。涉及导出边界变更时，必须加跑 `rtk make dead`。
- **日志规范**: **禁止** 直接使用 `console.log`。必须统一使用 `src/lib/logger.ts`（基于 Logtape）。
- **环境变量**: 严禁裸用 `process.env`。所有变量必须在 `src/env.ts` 定义并通过架构校验。
- **错误统一**: 业务异常必须继承自 `src/lib/errors.ts` 中的 `AppError`。
- **响应一致**: 必须使用 `src/lib/response.ts` 中的 `sendSuccess`, `sendError`, `sendPaginated` 工具函数。

## 3. 目录架构约定 (Directory Layout)

```text
src/
├── app.ts                  # Hono 应用实例挂载与全局中间件配置
├── env.ts                  # 严格环境变量解析 (@t3-oss/env-core)
├── factory.ts              # Hono 工厂 (AppEnv / createRouter) — 类型注入核心
├── index.ts                # Cloudflare Worker 默认入口
├── db/                     # 数据库层
│   ├── index.ts            # getDb() 实例与 Schema 汇聚
│   ├── schema/             # 共享/核心 Schema (如 Auth, Users)
│   └── seeder/             # 播种 (drizzle-seed) 入口与数据定义
├── lib/                    # 通用工具库 (Shared Kernel)
│   ├── auth.ts             # Better Auth 配置与 Hook
│   ├── response.ts         # 统一 JSON Envelope 响应封装
│   ├── errors.ts           # 核心异常基类与常用错误 (404, 403, 422)
│   └── logger.ts           # 类型安全的 Logtape 日志包装器
├── routers/                # 路由聚合层 (路由不写逻辑)
│   ├── v1.routes.ts        # v1 业务逻辑路由汇聚
│   └── openapi.routes.ts   # 自动生成 /openapi.json, /docs (Scalar) 与 /llms.txt
├── middlewares/            # 全局中间件
│   ├── logtape-logger.ts   # 请求级追踪日志
│   ├── not-found.ts        # 404 响应处理
│   └── on-error.ts         # 500/AppError 全局异常适配
├── resources/              # 静态资源与邮件模板 (React-email)
└── modules/                # 业务垂直领域 (Feature Verticals) — 核心开发区
    └── {feature}/
        ├── {feature}.schema.ts   # 业务专属 Drizzle Schema 与 Zod 验证
        ├── {feature}.routes.ts   # OpenAPI 路由规约 (describeRoute)
        ├── {feature}.handlers.ts # 路由处理逻辑 (请求提取 + 响应包装)
        ├── {feature}.service.ts  # 纯净业务逻辑 (DB 操作 + 领域规则)
        └── {feature}.index.ts    # 模块导出与注册入口
```

## 4. 技术栈 (Tech Stack)

- **Runtime**: Cloudflare Workers
- **Framework**: Hono + `@hono/zod-openapi`
- **Database**: Neon Serverless / Drizzle ORM / `drizzle-seed`
- **Validation**: Zod + `@t3-oss/env-core`
- **Docs**: Scalar (`/docs`) + OpenAPI 3.1 + `@scalar/openapi-to-markdown` (`/llms.txt`)
- **Auth**: Better Auth (Email/Password, Org, 2FA)
- **E-mail**: Resend + React-email
- **Lint/Format**: Biome
- **Test**: Vitest + `lefthook` (Pre-commit)
- **Tooling**: `rtk` (Token Killer), `knip` (Dead code), `stoker` (HTTP utils)

## 5. 设计黄金法则 (Golden Rules)

| 法则 | 描述 |
|------|-------------|
| **Factory 唯一性** | 必须使用 `src/factory.ts` 的 `createRouter()`，**严禁** `new Hono()` |
| **Service 纯净性** | Service 只接收原始数据，**严禁** 传入 Hono `Context` |
| **Schema 单向性** | 优先从 Drizzle 表派生 Zod Schema，禁止重复声明数据库属性 |
| **ISO 时间标准** | API 响应统一返回 ISO 字符串 (`z.string().datetime()`) |
| **状态码语义化** | 强制使用 `stoker/http-status-codes` 名词，禁止使用魔法数字 |
| **单向依赖原则** | 模块通信：Handler -> Service，禁止跨模块调用 Handler |
| **错误全覆盖** | 路由必须使用 `validator` 校验请求，并由 `on-error` 统一捕获异常 |

## 6. 核心工作流 (Workflow)

### 模块生成 (Module Generation)
项目内置了强大的 CLI 工具，生成新功能时 **必须** 使用：
- 生成模块: `rtk pnpm cli make:module <name>`
- 自动生成: `schema`, `service`, `handlers`, `routes`, `index`, `tests`。

### TDD 测试流程
1. 修改/编写 `src/modules/{feature}/__tests__/*.test.ts`。
2. 运行 `rtk make test` 观察失败。
3. 实现 Service 逻辑使其通过。

### 部署前检查
1. `rtk make lint` (修复格式)
2. `rtk make check` (类型与校验)
3. `rtk make dead` (死代码清理)

## 7. 锁定技能 (Locked Skills)

项目通过 `npx skills` 锁定并优先参考以下参考文档：

- **核心**: `hono`, `hono-best-practices`, `cloudflare`, `workers-best-practices`, `wrangler`
- **鉴权**: `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `organization-best-practices`
- **数据**: `neon-drizzle`, `neon-postgres`, `drizzle-orm`, `postgresql-table-design`
- **保障**: `zod-4`, `vitest`, `vitest-best-practices`, `resend`, `email-best-practices`

---
*上次更新: 2026-04-10 — 架构与规约已进入稳定版。*
