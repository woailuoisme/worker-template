# Agent 规范与项目架构指南

这是一份为 AI 生态(Claude Code / Roo / Cursor) 提供的精简开发约定文档。

## 核心架构与目录结构

```text
src/
├── app.ts                  # Hono 应用挂载与全局中间件，OpenAPI 配置合并
├── env.ts                  # Zod 环境变量类型与严格解析
├── factory.ts              # Hono 实例工厂 (生成 OpenAPIHono 和 Context 类型)
├── index.ts                # Worker 默认入口点 (export default app)
├── db/                     # 数据库控制层 (Drizzle ORM)
│   ├── index.ts            # 导出配置好的 DB 实例对象
│   ├── factory/            # 测试数据填充工厂等 (可选)
│   ├── schema/             # 数据表定义 (*.ts 配置)，由 index.ts 统一对外汇聚导出
│   └── seeder/             # 数据库自动播种与初始化入口
├── lib/                    # 核心抽象库与第三方服务实例配置 (与纯业务解耦)
│   ├── auth.ts             # [通用] 第三方鉴权/认证服务实例中心
│   ├── errors.ts           # [通用] 统一定义 AppError, NotFoundError 等基础异常类
│   └── logger.ts           # [通用] 日志记录器模板，统一进行日志落库或输出
├── middlewares/            # 自定义请求拦截与路由级中间件
│   ├── not-found.ts        # 全局 404 捕获处理器
│   └── on-error.ts         # 全局异常捕获，对 AppError 与未知底层错误格式化输出
└── modules/                # 现代模块化单体组织目录 (业务逻辑深度垂直切分)
    └── {feature}/          # 代表任意按业务域聚合的模块 (如 users/, orders/, tasks/)
        ├── {feature}.routes.ts   # 使用 createRoute() 强类型声明请求头/出入参及关联 OpenAPI
        ├── {feature}.handlers.ts # Context 处理层 (入参提取流转与标准化 HTTP JSON 响应)
        ├── {feature}.service.ts  # 服务层 (执行纯粹的业务逻辑运算、状态计算与底层 DB 增删改查)
        └── {feature}.index.ts    # 模块暴露汇聚点，向主应用安全隔离并挂载当前模块路由
```

## 核心技术栈
- **Runtime/部署**: Cloudflare Workers
- **Web 框架**: Hono (`@hono/zod-openapi`)
- **数据库**: Neon Serverless / Drizzle ORM (`drizzle-orm/neon-http`)
- **验证**: Zod
- **API 文档**: Scalar (`@scalar/hono-api-reference`), 输出合并使用 `openapi-merge` 
- **鉴权体系**: `better-auth` (核心配置于 `src/lib/auth.ts`, Schema于 `src/db/schema/auth.ts`)
- **日志**: `@logtape/logtape` (禁止使用 `console.log`，强制导入 `src/lib/logger.ts`)
- **代码规范**: Biome (`pnpm lint`) + TypeScript (`pnpm type`) + Knip (`pnpm dead`)

## 核心设计规范与约束

### 1. 路由与接口 (OpenAPI)
项目强制使用官方 `@hono/zod-openapi` 进行全链路类型安全的 OpenAPI 生成。
- **放弃使用** `hono-openapi` 与 `stoker`。
- 新建路由结构要求：
  1. 使用 `createRoute({ method, path, request, responses })` 建立 Schema 定义。
  2. 使用 `router.openapi(routeDef, handler)` 绑定具体服务。
  3. HTTP 响应状态码使用直观数字（如 `200`, `201`, `404`），不引入外部 HTTP 状态枚举库。

### 2. 目录解耦 (模块化单体)
业务逻辑封装在 `src/modules/{feature}` 内（如 `tasks`）：
- `feature.routes.ts`: OpenAPI 路由定义 (`createRoute` & `openapi` 挂载)
- `feature.handlers.ts`: 接收 Context 请求参数校验，调用 service 返回数据
- `feature.service.ts`: 纯业务逻辑或 Drizzle 数据库交互
- 组件间耦合需要降到最低。全局实例工厂统一在 `src/factory.ts` 的 `createRouter()` 中创建。

### 3. 环境与错误处理
- 环境变量必须通过 `src/env.ts` (基于 `@t3-oss/env-core`) 进行 Zod 校验，避免裸用 `process.env`，Worker 特定的 env 请使用 `c.env` 传入 `validateEnv`。
- 业务逻辑产生的错误请遵循 `src/lib/errors.ts` 结构，抛出 `NotFoundError`, `ValidationError`, `AppError`。统一在 `src/middlewares/on-error.ts` 下游拦截。

### 4. 数据库管理 (Drizzle)
- 所有 Schema 存放在 `src/db/schema/*.ts` 并在 `index.ts` 统一暴露。
- `drizzle.config.ts` 读取全局配置(`./src/db/schema/index.ts`)，使用 `rtk pnpm drizzle-kit` 进行数据库状态迁移生成。

### 5. CLI 命令规范 / RTK 拦截
所有终端操作优先走 `rtk` (Rust Token Killer) 来压缩无用日志输出。
- 开发: `rtk pnpm dev`
- 类型安全检查与 Lint: `rtk pnpm check`
- 修复并检查: `rtk pnpm lint` (Biome)
