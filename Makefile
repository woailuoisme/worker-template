# Common Cloudflare Workers commands

.PHONY: dev deploy cf-typegen better-auth-generate better-auth-secret db-generate db-migrate help

dev:
	pnpm dev

deploy:
	pnpm deploy

cf-typegen:
	pnpm cf-typegen

better-auth-generate:
	pnpm dlx @better-auth/cli@latest generate --config ./better-auth.config.ts --output ./src/db/schema.ts

better-auth-secret:
	pnpm dlx @better-auth/cli@latest secret

db-generate:
	pnpm drizzle-kit generate

db-migrate:
	pnpm drizzle-kit migrate

help:
	@echo "Available targets:"
	@echo "  make dev                 - Start local dev server"
	@echo "  make deploy              - Deploy to Cloudflare"
	@echo "  make cf-typegen          - Generate Cloudflare bindings types"
	@echo "  make better-auth-generate - Generate Better Auth schema"
	@echo "  make better-auth-secret  - Generate Better Auth secret"
	@echo "  make db-generate         - Run drizzle-kit generate"
	@echo "  make db-migrate          - Run drizzle-kit migrate"
