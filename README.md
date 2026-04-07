# Cloudflare Worker API 核心模板

这是一个先进且具备生产级可用性的 Cloudflare Workers 后端模板，基于现代 Web 技术体系构建。它采用严格的模块化单体架构 (Modular Monolith)，在代码规范度、类型安全、性能及 API 最佳实践等诸多层面表现卓绝。

## 🚀 核心技术栈

* **运行时引擎:** [Cloudflare Workers](https://workers.cloudflare.com/) 
* **Web 框架:** [Hono](https://hono.dev/) & `@hono/zod-openapi`
* **数据库:** [Neon Postgres (Serverless)](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
* **安全鉴权:** [Better Auth](https://github.com/better-auth/better-auth)
* **API 文档化:** OpenAPI 3.1 & [Scalar](https://scalar.com/)
* **类型与数据验证:** [Zod](https://zod.dev/)
* **工程化工具:** Biome (代码规范格式化), Vitest (单元测试), Knip (死代码检查), Makefile (快捷指令)

## 📁 项目目录结构

本项目严格遵循 **Modular Monolith（模块化单体）** 架构。针对核心路由、API 处理和纯粹的基础业务逻辑进行了完美的物理拆分解耦：

```text
src/
├── app.ts                  # 全局 App 实例化与通用级中间件挂载
├── index.ts                # Cloudflare Worker 默认调度入口
├── routers/                # 路由定义中心 (OpenAPI 配置、版本化路由总线)
│   ├── openapi.routes.ts   # OpenAPI 文档、Scalar UI 及 LLM 适配路由
│   └── v1.routes.ts        # 全局 v1 版本 API 的汇聚式总路由
├── db/                     # 数据库初始配置、Drizzle 架构 Schema 及 数据播种器
├── lib/                    # 抽象基库（统一响应体封装、错误管理、Auth服务、日志记录器）
├── middlewares/            # 用户自定义 Hono 拦截器（如全局的 Error 和 404 处理）
└── modules/                # 垂直业务线模块 (例如：tasks 业务 / articles 业务)
    └── tasks/
        ├── tasks.routes.ts   # 使用 zod-openapi 强声明接口路由要求与请求体约束
        ├── tasks.handlers.ts # HTTP 表现层控制器 (获取参数并生成统一 JSON 响应)
        ├── tasks.service.ts  # 纯粹的纯业务逻辑与 DB 交互操作 (彻底告别 HTTP 上下文依赖)
        └── tasks.index.ts    # 模块路由统一导出点
```

## 🛡️ 稳如磐石的验证与数据流

本模板强力推崇一套在数据库层与应用层间绝对一致、端到端百分百类型安全的同步式数据流控制：

> **Database Schema** -> 衍生出 **Zod Schema** (`@/db/schema`) -> 挂载到 **`tasks.routes.ts`** -> 在 **`tasks.handlers.ts`** 中被 `c.req.valid()` 安全且附带 TypeScript 推导地提取出来！

1. **`src/db/schema`**: 使用 Drizzle 编写数据库的真实表结构，并通过核心工具库 `drizzle-zod` 精准衍生、动态生成用于写入/读取的 Zod Constraints。
2. **`tasks.routes.ts`**: 将刚生成的 Zod Scheme 通过 `createRoute` 的参数设置绑定在端点拦截规则上（包括 Query, Params 和 Body）。任何不符合该数据库规范的非法请求，在碰触到实际核心业务 Handler 前都将直接被 Hono 拦截熔断。
3. **`tasks.handlers.ts`**: 在控制器中能够无脑安全地使用 `c.req.valid('json')`！得益于框架级别的设计，TypeScript 将为您完美推导出全属性约束，并获得无可挑剔的 IDE 提示体验。

## 🛠️ 统一响应风格 & 分野规范

项目预置并要求前端及第三方使用者必须以确定且可预测的状态获取数据回报，所有的结果输出必须并且仅通过 `src/lib/response.ts` 的包进行编排封装 (如：`sendSuccess()`, `sendError()`, `sendPaginated()`)。

所有的分页计算皆遵循极度抽象的范式。业务的 Service 层（如 `tasks.service.ts`）内利用 `Promise.all` 模型优化数据库检索并实现游标请求：系统会在同一个请求上下文中并发向远程的 Neon Database 提取总记录数（Count）和 结果阵列（Rows），让检索吞吐能力最大化。

## 💻 本地指令集成 (Makefile)

该工程已经内置了强大的预设驱动，通过使用 `Makefile` 完成极简开发流水线（默认底层依赖为 `PM=pnpm`）。请尽情利用在终端中执行以 `make` 为前缀的指令来工作：

### 核心开发与效能卡口
* `make dev` - 启动底层附带 Wrangler 的 Cloudflare 本地开发与测试服务器
* `make deploy` - 将你的 Worker 安全部署发布至云端
* `make check` - 执行全体系严格规范审查 (涵盖: Biome Lint 规范, TypeScript 类型验证, Knip 死代码与无用模块分析)
* `make test` - 启动 Vitest 分时段自动单元测试
* `make lint` - 使用 Biome 自动进行代码全域修正与格式化

### 数据库协同 (Drizzle & Neon)
* `make db-generate` - [演进式] 从当前写的 Typescript DB Model 中导出全新的 SQL 同步迁移节点状态文件
* `make db-migrate` - [演进式] 将本地未同步至远程 Database 的所有的 `.sql` 文件顺序运行并覆盖架构
* `make db-push` - [覆写式] 直接提取最新数据模型强制干预洗刷远程关联 (通常用于重灾重建或开发阶段直接上云)
* `make db-pull` - 扫描当前远端数据库存结构，直接拉取转义导出出供本地消费与使用的 Schema 文件
* `make db-seed` - 凭借内置 Drizzle Seed 强大的播种引擎生成大量的测试 Mock 数据

### 身份鉴定体系 (Better Auth)
* `make better-auth-gen-schema` - 扫描 Auth 主配置后直接针对 Drizzle ORM 创建生成特定而完满的数据库约束集
* `make better-auth-gen-secret` - 为工程架构强刷加密指纹，分配一个具有超高强度的全局内部通信安全密钥
