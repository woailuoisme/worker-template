# Agent 规范与项目架构指南

这是一份给 AI 生态（Claude Code / Roo / Cursor）的项目级约定。`AGENTS.md` 是源文件；`CLAUDE.md` 与 `GEMINI.md` 通过 `make sync-agents` 保持同步。

## 优先级

1. 先遵守本文件。
1. 再遵守 `RTK.md`。
1. 再参考 `.agents/skills/` 中已锁定的技能。

## 硬规则

- 所有 shell 命令默认优先使用 `rtk` 包装执行。
- 修改代码后，必须运行 `make check`；如改动涉及死代码或导出边界，再补跑 `make dead`。
- 禁止使用 `console.log`，统一通过 `src/lib/logger.ts`。
- 环境变量必须通过 `src/env.ts` 校验，禁止直接裸用 `process.env`。
- 业务错误优先使用 `src/lib/errors.ts` 中的异常类型。

## 目录约定

```text
src/
├── app.ts                  # Hono 应用挂载与全局中间件
├── env.ts                  # Zod 环境变量定义与严格解析 (@t3-oss/env-core)
├── factory.ts              # Hono 实例工厂 (AppEnv / createRouter)
├── index.ts                # Worker 默认入口
├── db/
│   ├── index.ts            # getDb() 与 schema 汇聚
│   ├── schema/             # 通用/核心 Schema（如 Auth）
│   └── seeder/             # 基于 drizzle-seed 的数据库播种入口
├── lib/
│   ├── auth.ts             # Better Auth 实例与配置
│   ├── response.ts         # 统一 JSON 响应封装 (Success/Error/Paginated)
│   ├── errors.ts           # AppError / NotFoundError 异常定义
│   └── logger.ts           # Logtape 日志记录器
├── routers/
│   ├── v1.routes.ts        # 业务模块路由聚合
│   └── openapi.routes.ts   # OpenAPI Specs (/openapi.json), Scalar (/docs) 与 LLM (/llms.txt)
├── middlewares/
│   ├── logtape-logger.ts   # 请求日志中间件
│   ├── not-found.ts        # 404 处理
│   └── on-error.ts         # 全局异常处理 (对接 AppError)
├── resources/              # 静态资源与邮件模板 (React-email)
└── modules/
    └── {feature}/
        ├── {feature}.schema.ts   # 业务 Drizzle Schema与 Zod 类型
        ├── {feature}.routes.ts   # OpenAPI 路由描述
        ├── {feature}.handlers.ts # 请求处理逻辑
        ├── {feature}.service.ts  # 核心业务逻辑与 DB 访问
        └── {feature}.index.ts    # 模块导出入口
```

## 技术栈

- Runtime/部署: Cloudflare Workers
- Web 框架: Hono + `@hono/zod-openapi`
- 数据库: Neon Serverless / Drizzle ORM
- 验证: Zod / `@t3-oss/env-core`
- API 文档: Scalar (`/docs`) + OpenAPI 3.1 (`/openapi.json`)
- LLM 适配: `@scalar/openapi-to-markdown` 生成 `/llms.txt`
- 鉴权: Better Auth
- 日志: `@logtape/logtape`
- 工具: `tsx`, `commander`, `biome`, `vitest`, `knip`, `drizzle-seed`, `openapi-merge`, `stoker`, `resend`

## 设计约定

### 黄金法则 (Golden Rules)

| 规则 | 说明 |
|------|-------------|
| **工厂原则 (Factory)** | 必须使用 `@/factory` 中的 `createRouter()`，禁止 `new Hono()` |
| **服务纯净 (Service)** | Service 只接收原始数据/对象，**严禁** 传入 Hono `Context` |
| **Schema 派生** | 优先从 Drizzle 表派生 Zod Schema，禁止手写重复的数据库类型 |
| **ISO 时间** | API 响应必须统一使用 ISO 字符串格式的时间，禁止直接返回 `Date` 对象 |
| **语义化状态码** | 统一使用 `stoker/http-status-codes`，禁止使用魔法数字 (如 200, 404) |
| **单向依赖** | 模块间调用必须通过 `Service` 或 `.index.ts` 导出，严禁交叉引用 Handler |

### 架构细节

- 路由只负责声明接口与挂载，不写业务逻辑。
- Handler 只做参数整理与响应包装。
- Service 负责核心业务与 DB 交互。
- 业务模块放在 `src/modules/{feature}`，共享能力放在 `src/lib`、`src/services`、`src/db`。
- 所有 Schema 必须在 `src/db/schema/index.ts` 汇聚导出，以支持 Drizzle Kit。
- 数据库播种入口是 `pnpm db:seed`。

## 命令约定

- 开发: `rtk make dev`
- 检查: `rtk make check`
- 修复格式: `rtk make lint`
- 死代码检查: `rtk make dead`
- CLI: `rtk make cli`
- 测试: `rtk make test`
- 模块生成: `rtk pnpm cli make:module <name>`
- 模块删除: `rtk pnpm cli make:module <name> --delete`

## 锁定技能

项目通过 `npx skills` 锁定并优先参考以下技能：

- Hono: `hono`, `hono-best-practices`
- Better Auth: `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `two-factor-authentication-best-practices`, `organization-best-practices`
- 数据库: `neon-drizzle`, `neon-postgres`, `drizzle-orm`, `postgresql-table-design`
- Cloudflare: `cloudflare`, `workers-best-practices`, `wrangler`
- 验证与测试: `zod-4`, `vitest`, `vitest-best-practices`
- 邮件: `resend`, `email-best-practices`
