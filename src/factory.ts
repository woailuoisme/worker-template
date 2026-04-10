import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Logger as LogtapeLogger } from '@logtape/logtape';
import type { Context, Schema } from 'hono';
import { createFactory } from 'hono/factory';
import { defaultHook } from 'stoker/openapi';
import type { DB } from '@/db';
import type { Env } from '@/env';

// ---------------------------------------------------------------------------
// AppEnv — Single Source of Truth for all Hono context types
// ---------------------------------------------------------------------------

export type AppBindings = Env;

export type AppVariables = {
	requestId?: string;
	db: DB;
	logger: LogtapeLogger;
};

export type AppEnv = {
	Bindings: AppBindings;
	Variables: AppVariables;
};

// ---------------------------------------------------------------------------
// Hono type aliases (previously in src/lib/types.ts)
// ---------------------------------------------------------------------------

export type AppOpenAPI<S extends Schema = Record<string, never>> = OpenAPIHono<
	AppEnv,
	S
>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;

export type AppContext = Context<AppEnv>;

// ---------------------------------------------------------------------------
// Factory — createRouter includes defaultHook for Zod validation errors
// ---------------------------------------------------------------------------

export const factory = createFactory<AppEnv>();

export const createRouter = () =>
	new OpenAPIHono<AppEnv>({ strict: false, defaultHook });
