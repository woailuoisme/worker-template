# Common Cloudflare Workers commands

.PHONY: dev deploy cf-typegen better-auth-generate better-auth-secret db-generate db-migrate db-push db-pull db-seed help

dev:
	pnpm dev

deploy:
	pnpm deploy

cf-typegen:
	pnpm cf-typegen

# 根据 Better Auth 配置生成对应的数据库 Schema
better-auth-generate:
	pnpm dlx @better-auth/cli@latest generate --config ./better-auth.config.ts --output ./src/db/schema/auth.ts

# 为 Better Auth 随机生成一个高强度的安全密钥
better-auth-secret:
	pnpm dlx @better-auth/cli@latest secret

# [迁移管理流程] 对比最新代码，生成用于版本控制的变更 SQL 迁移文件
db-generate:
	pnpm drizzle-kit generate

# [迁移管理流程] 按顺序执行未提交的 SQL 迁移文件到远端数据库
db-migrate:
	pnpm drizzle-kit migrate

# [快速原型流程] 强行将本地 TS Scheme 推送到验证数据库 (破坏性操作：不建议生产环境)
db-push:
	pnpm drizzle-kit push

# [快速原型流程] 逆向内省真实的远端数据库，并生成本地对应的 TypeScript Schema
db-pull:
	pnpm drizzle-kit pull

# [测试数据] 为数据库自动生成并注入带有关联关系的用户/账户测试数据
db-seed:
	pnpm db:seed

help:
	@echo "可用命令列表:"
	@echo "  make dev                 - 启动本地开发与测试服务器"
	@echo "  make deploy              - 将 Worker 部署发布到 Cloudflare"
	@echo "  make cf-typegen          - 基于 wrangler 自动生成本地强类型绑定"
	@echo "  make better-auth-generate - 基于配置自动生成专属的 Auth Schema"
	@echo "  make better-auth-secret  - 生成专用的 Better Auth 密钥"
	@echo "  make db-generate         - [迁移式] 从现有的 TS Scheme 导出新的 SQL 迁移状态记录"
	@echo "  make db-migrate          - [迁移式] 将未处理的 SQL 迁移记录运行并应用到数据库"
	@echo "  make db-push             - [强制性] 暴力直接将当前架构同步到数据库 (快速但不安全!)"
	@echo "  make db-pull             - [强制性] 扫描云端已有数据库结构，导出为本地的 Schema 文件"
	@echo "  make db-seed             - [数据器] 使用 Faker 为数据库生成并填充模拟测试数据"
