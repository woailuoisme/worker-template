# Agent 规范与项目架构指南

这是一份为 AI 生态(Claude Code / Roo / Cursor) 提供的精简开发约定文档。

## 核心架构与目录结构

```text
src/
├── app.ts                  # Hono 应用挂载与全局中间件，OpenAPI 配置合并 (含 /openapi.json & /llms.txt)
├── env.ts                  # Zod 环境变量类型与严格解析 (@t3-oss/env-core)
├── factory.ts              # Hono 实例工厂 (生成 OpenAPIHono 和 Context 类型)
├── index.ts                # Worker 默认入口点 (export default app)
├── db/                     # 数据库控制层 (Drizzle ORM)
│   ├── index.ts            # 导出配置好的 DB 实例对象 (Neon HTTP)
│   ├── schema/             # 数据表定义 (*.ts 配置)，由 index.ts 统一对外汇聚导出
│   └── seeder/             # 数据库自动播种与初始化入口 (main.ts)
├── lib/                    # 核心抽象库与第三方服务实例配置 (与纯业务解耦)
│   ├── auth.ts             # [通用] Better Auth 实例中心
│   ├── errors.ts           # [通用] 统一定义 AppError, NotFoundError 等基础异常类
│   └── logger.ts           # [通用] Logtape 日志记录器模板
├── middlewares/            # 自定义请求拦截与路由级中间件
│   ├── not-found.ts        # 全局 404 捕获处理器
│   └── on-error.ts         # 全局异常捕获，对 AppError 与未知底层错误格式化输出
├── services/               # [通用] 全局共享服务
└── modules/                # 现代模块化单体组织目录 (业务逻辑深度垂直切分)
    └── {feature}/          # 代表任意按业务域聚合的模块 (如 tasks/, articles/)
        ├── {feature}.routes.ts   # 使用 createRoute() 强类型声明请求与 OpenAPI
        ├── {feature}.handlers.ts # Context 处理层 (入参提取流转与标准化 HTTP JSON 响应)
        ├── {feature}.service.ts  # 服务层 (执行纯业务逻辑与 Drizzle 数据库交互)
        └── {feature}.index.ts    # 模块暴露汇聚点，向主应用安全隔离并挂载当前模块路由
```

## 核心技术栈
- **Runtime/部署**: Cloudflare Workers
- **Web 框架**: Hono (`@hono/zod-openapi`)
- **数据库**: Neon Serverless / Drizzle ORM
- **验证**: Zod
- **API 文档**: Scalar (`/docs`), OpenAPI 3.1 (`/openapi.json`)
- **LLM 适配**: `@scalar/openapi-to-markdown` (输出 `/llms.txt` 供 Agent 快速理解 API)
- **鉴权体系**: `better-auth` (核心配置于 `src/lib/auth.ts`, Schema 位于 `src/db/schema/auth.ts`)
- **日志**: `@logtape/logtape` (禁止使用 `console.log`，强制导入 `src/lib/logger.ts`)
- **开发工具**: `tsx`, `commander` (自定义 CLI), `biome` (Lint), `vitest` (Test), `knip` (Dead Code)

## 核心设计规范与约束

### 1. 路由与接口 (OpenAPI)
项目使用 `@hono/zod-openapi` 进行全链路类型安全的 OpenAPI 生成。
- **OpenAPI 合并**: `/openapi.json` 通过 `openapi-merge` 将 Hono App Specs 与 Better Auth Specs 动态合并。
- **LLM 友好**: 必须提供 `/llms.txt`，将 OpenAPI 文档转换为 Markdown 格式，帮助 Agent 更精准地调用接口。

### 2. 目录解耦 (模块化单体)
业务逻辑封装在 `src/modules/{feature}` 内（如 `tasks`）：
- Handler 层只负责参数校验 and 响应包装。
- Service 层负责纯粹的逻辑计算 or DB 操作。
- 组件间耦合需降到最低。

### 3. 环境与错误处理
- 环境变量必须通过 `src/env.ts` 进行 Zod 校验，避免裸用 `process.env`。
- 业务错误请遵循 `src/lib/errors.ts` 结构，抛出 `NotFoundError`, `ValidationError`, `AppError`。

### 4. 数据库管理 (Drizzle)
- 所有 Schema 存放在 `src/db/schema/*.ts` 并在 `index.ts` 统一暴露。
- 数据库播种通过 `pnpm db:seed` 执行 `src/db/seeder/main.ts`。

### 5. 自定义 CLI 工具
项目提供 Artisan 风格的命令行工具，加速开发流程：
- **创建模块**: `pnpm cli make:module <name>` (自动生成 routes, handlers, service, index)
- **删除模块**: `pnpm cli make:module <name> --delete`

### 6. 命令规范 / Agent 自检流程
所有终端操作优先走 `rtk` (Rust Token Killer) 来压缩无用日志输出（如 `rtk make check`）。
- **强制检查**: AI 在完成编写或修改代码后，必须主动运行 `make check` 检查并修复代码规范（Lint）和类型（Type）异常。
- 开发: `rtk make dev`
- 独立修复: `rtk make lint` (Biome)

## 项目 Skill 挂载情况 (Lock)

项目通过 `npx skills` 托管并锁定了以下开发规约，Agent 在开发时应优先参考 `.agents/skills` 下的对应指令：

- **Hono 核心**: `hono`, `hono-best-practices`
- **鉴权中心**: `better-auth-best-practices`
- **数据库 (Neon/Drizzle)**: `neon-drizzle`, `neon-postgres`, `drizzle-orm`, `postgresql-table-design`
- **Cloudflare 生态**: `cloudflare`, `workers-best-practices`, `wrangler`
- **验证与测试**: `zod-4`, `vitest-best-practices`
