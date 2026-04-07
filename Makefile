# Common Cloudflare Workers commands

# 动态包管理器适配：支持 pnpm、npm、yarn 和 bun。默认使用 pnpm。
# 使用示例：make dev PM=npm
PM ?= pnpm

ifeq ($(PM), pnpm)
	RUN = pnpm
	EXEC = pnpm dlx
	BIN = pnpm
else ifeq ($(PM), yarn)
	RUN = yarn
	EXEC = yarn dlx
	BIN = yarn
else ifeq ($(PM), bun)
	RUN = bun run
	EXEC = bunx
	BIN = bunx
else
	RUN = npm run
	EXEC = npx
	BIN = npx
endif

.PHONY: dev deploy check lint type dead cli test cf-gen-types sync-agents skills-install better-auth-gen-schema better-auth-gen-secret db-generate db-migrate db-push db-pull db-seed help

dev:
	$(RUN) dev

deploy:
	$(RUN) deploy

cf-gen-types:
	$(RUN) cf-gen-types

# 运行代码检查与类型检查等
check:
	$(RUN) check

lint:
	$(RUN) lint

type:
	$(RUN) type

# 运行死代码检查
dead:
	$(RUN) dead

# 运行自定义 CLI 工具
cli:
	$(RUN) cli

# 运行测试
test:
	$(RUN) test

# 同步 Agent 配置到各平台特定的文件
sync-agents:
	./sync-agents.sh

# 实验性：为 Agent 环境自动重新安装和挂载最新锁定的全套 Skills 能力
skills-install:
	$(EXEC) skills experimental_install

# 根据 Better Auth 配置生成对应的数据库 Schema
better-auth-gen-schema:
	$(EXEC) @better-auth/cli@latest generate --config ./better-auth.config.ts --output ./src/db/schema/auth.ts

# 为 Better Auth 随机生成一个高强度的安全密钥
better-auth-gen-secret:
	$(EXEC) @better-auth/cli@latest secret

# [迁移管理流程] 对比最新代码，生成用于版本控制的变更 SQL 迁移文件
db-generate:
	$(BIN) drizzle-kit generate

# [迁移管理流程] 按顺序执行未提交的 SQL 迁移文件到远端数据库
db-migrate:
	$(BIN) drizzle-kit migrate

# [快速原型流程] 强行将本地 TS Scheme 推送到验证数据库 (破坏性操作：不建议生产环境)
db-push:
	$(BIN) drizzle-kit push

# [快速原型流程] 逆向内省真实的远端数据库，并生成本地对应的 TypeScript Schema
db-pull:
	$(BIN) drizzle-kit pull

# [测试数据] 为数据库自动生成并注入带有关联关系的用户/账户测试数据
db-seed:
	$(RUN) db:seed

help:
	@echo "可用命令列表:"
	@echo "  环境变量注入: make [Command] PM=npm/yarn/bun (默认 PM=pnpm)"
	@echo "----------------------------------------------------------------------"
	@echo "  make dev                 - 启动本地开发与测试服务器"
	@echo "  make deploy              - 将 Worker 部署发布到 Cloudflare"
	@echo "  make check               - 运行综合检查 (Lint, Type, Dead Code)"
	@echo "  make lint                - 运行代码规范检查 (Biome)"
	@echo "  make type                - 运行 TypeScript 类型检查 (tsc)"
	@echo "  make dead                - 运行死代码分析 (Knip)"
	@echo "  make cli                 - 运行本地命令行工具"
	@echo "  make test                - 运行单元测试 (Vitest)"
	@echo "  make sync-agents         - 将 AGENTS.md 规范同步给 CLAUDE.md 与 GEMINI.md"
	@echo "  make skills-install      - 为当前开发体系加载并挂载全局锁定的 AI Context Skills"
	@echo "  make cf-gen-types        - 基于 wrangler 自动生成本地强类型绑定"
	@echo "  make better-auth-gen-schema - 基于配置自动生成专属的 Auth Schema"
	@echo "  make better-auth-gen-secret - 生成专用的 Better Auth 密钥"
	@echo "  make db-generate         - [迁移式] 从现有的 TS Scheme 导出新的 SQL 迁移状态"
	@echo "  make db-migrate          - [迁移式] 将未处理的 SQL 迁移记录运行并应用到数据库"
	@echo "  make db-push             - [强制性] 暴力直接将当前架构同步到数据库 (快速但不安全!)"
	@echo "  make db-pull             - [强制性] 扫描云端已有数据库结构，导出为本地 Schema 文件"
	@echo "  make db-seed             - [数据器] 使用自定义 Seeder 引擎执行数据库播种任务"
