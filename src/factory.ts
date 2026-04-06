import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

import type { Env } from '@/env';

export type AppBindings = Env;

export type AppVariables = {
	requestId?: string;
};

export type AppEnv = {
	Bindings: AppBindings;
	Variables: AppVariables;
};

export const factory = createFactory<AppEnv>();
export const createRouter = () => new OpenAPIHono<AppEnv>({ strict: false });
export type AppContext = Context<AppEnv>;
