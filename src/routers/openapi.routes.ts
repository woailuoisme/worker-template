import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import { isErrorResult, merge } from 'openapi-merge';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Generate app (Hono routes) OpenAPI spec.
 * @param c Hono context
 * @param app The OpenAPIHono instance to generate spec from
 */
export function generateAppOpenApiSpec(c: any, app: any) {
	const env = validateEnv(c.env);
	return app.getOpenAPI31Document({
		openapi: '3.1.0',
		info: {
			title: 'Worker API',
			version: '1.0.0',
			description: `
# Cloudflare Worker API

欢迎使用本项目的 API 文档。

### 核心特性
- **性能**: 基于 Cloudflare Workers 极速响应。
- **安全**: 集成 Better Auth 鉴权体系。
- **开发**: 全链路类型安全 (Hono + Zod)。

> 提示：可以通过 \`/docs/sources\` 查看原始的 Auth 接口定义。
      `.trim(),
		},
		servers: [{ url: env.BETTER_AUTH_URL, description: 'Current server' }],
	});
}

/**
 * Fetch Better Auth generated OpenAPI spec.
 */
export async function getBetterAuthOpenApiSpec(c: any) {
	const env = validateEnv(c.env);
	const authInstance = auth(env, c.executionCtx);

	const candidates = [
		new URL(
			'/api/auth/open-api/generate-schema',
			env.BETTER_AUTH_URL
		).toString(),
		new URL('/api/auth/open-api/generate-schema', c.req.url).toString(),
	];

	let lastError = 'unknown';
	for (const url of candidates) {
		try {
			const authResponse = await authInstance.handler(new Request(url));
			if (authResponse.ok) {
				return authResponse.json();
			}
			const body = (await authResponse.text()).slice(0, 500);
			lastError = `${authResponse.status} ${authResponse.statusText} ${body}`;
			logger.error(
				`Failed to fetch Better Auth specs from ${url}: ${lastError}`
			);
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error);
			logger.error(
				`Failed to fetch Better Auth specs from ${url}: ${lastError}`
			);
		}
	}

	throw new Error(`Better Auth spec fetch failed: ${lastError}`);
}

/**
 * Create the OpenAPI router and mount routes.
 * @param app The main app instance (required for full spec generation)
 */
export const getOpenApiRouter = (app: any) => {
	const router = createRouter();

	// OpenAPI (App only, stable)
	router.get('/openapi.json', (c) => c.json(generateAppOpenApiSpec(c, app)));

	// OpenAPI (Better Auth raw)
	router.get('/openapi-auth.json', async (c) => {
		try {
			const authSpecs = await getBetterAuthOpenApiSpec(c);
			return c.json(authSpecs as Record<string, unknown>);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to provide Better Auth OpenAPI spec: ${message}`);
			return c.json(
				{ error: 'Failed to fetch Better Auth OpenAPI spec', detail: message },
				502
			);
		}
	});

	// OpenAPI (Merged: App + Better Auth)
	router.get('/openapi-merged.json', async (c) => {
		const appSpecs = generateAppOpenApiSpec(c, app);
		try {
			const authSpecs = await getBetterAuthOpenApiSpec(c);
			const mergeResult = merge([
				{ oas: appSpecs as any },
				{ oas: authSpecs as any, pathModification: { prepend: '/api/auth' } },
			]);
			if (!isErrorResult(mergeResult)) {
				return c.json(mergeResult.output);
			}
			logger.error(
				`Failed to merge Better Auth specs: ${JSON.stringify(mergeResult)}`
			);
		} catch (error) {
			logger.error('Failed to merge Better Auth specs', { error });
		}
		return c.json(appSpecs);
	});

	// Register a route to serve the Markdown for LLMs
	router.get('/llms.txt', async (c) => {
		const specs = generateAppOpenApiSpec(c, app);
		const markdown = await createMarkdownFromOpenApi(JSON.stringify(specs));
		return c.text(markdown);
	});

	// Scalar (default: merged spec for single unified docs)
	router.get(
		'/docs/dev',
		Scalar({
			theme: 'default',
			honoRouting: true,
			spec: { url: '/openapi-merged.json' },
		} as any)
	);

	// Scalar (debug: switch between raw app/auth specs)
	router.get(
		'/docs',
		Scalar({
			theme: 'kepler',
			honoRouting: true,
			sources: [
				{ title: 'API', url: '/openapi.json' },
				{ title: 'Auth', url: '/openapi-auth.json' },
			],
		} as any)
	);

	return router;
};
