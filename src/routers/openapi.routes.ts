import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown';
import { isErrorResult, merge } from 'openapi-merge';
import { validateEnv } from '@/env';
import { createRouter } from '@/factory';
import { auth } from '@/lib/auth';
import { OPENAPI_DESCRIPTION } from '@/lib/constants';
import { logger } from '@/lib/logger';

const API_INFO = {
	title: 'Worker API',
	version: '1.0.0',
	description: OPENAPI_DESCRIPTION,
};

/**
 * 生成基础 OpenAPI 规范
 */
const getAppSpec = (c: any, app: any) => {
	const { BETTER_AUTH_URL } = validateEnv(c.env);
	return app.getOpenAPI31Document({
		openapi: '3.1.0',
		info: API_INFO,
		servers: [{ url: BETTER_AUTH_URL, description: 'Current server' }],
	});
};

/**
 * 安全获取 Better Auth 规范
 */
const fetchAuthSpec = async (c: any) => {
	const env = validateEnv(c.env);
	const authInstance = auth(env, c.executionCtx);
	const urls = [
		new URL('/api/auth/open-api/generate-schema', env.BETTER_AUTH_URL),
		new URL('/api/auth/open-api/generate-schema', c.req.url),
	];

	for (const url of urls) {
		try {
			const res = await authInstance.handler(new Request(url.toString()));
			if (res.ok) return await res.json();
		} catch (e) {
			logger.error(
				`Auth spec fetch failed from ${url}: ${e instanceof Error ? e.message : String(e)}`
			);
		}
	}
	return null;
};

/**
 * OpenAPI 路由中心
 */
export const getOpenApiRouter = (app: any) => {
	const router = createRouter();

	// 1. 基础 Specs 接口
	router.get('/openapi.json', (c) => c.json(getAppSpec(c, app)));

	router.get('/openapi-auth.json', async (c) => {
		const spec = await fetchAuthSpec(c);
		return spec
			? c.json(spec)
			: c.json({ error: 'Auth spec unavailable' }, 502);
	});

	router.get('/openapi-merged.json', async (c) => {
		const appSpec = getAppSpec(c, app);
		const authSpec = await fetchAuthSpec(c);
		if (!authSpec) return c.json(appSpec);

		const result = merge([
			{ oas: appSpec as any },
			{ oas: authSpec as any, pathModification: { prepend: '/api/auth' } },
		]);
		return c.json(isErrorResult(result) ? appSpec : result.output);
	});

	// 2. LLM 适配
	router.get('/llms.txt', async (c) => {
		const markdown = await createMarkdownFromOpenApi(
			JSON.stringify(getAppSpec(c, app))
		);
		return c.text(markdown);
	});

	// 3. Scalar 文档 (统一入口 + 多源切换)
	router.get(
		'/docs',
		Scalar({
			theme: 'kepler',
			honoRouting: true,
			sources: [
				{ title: 'Merged API', url: '/openapi-merged.json' },
				{ title: 'App Specs', url: '/openapi.json' },
				{ title: 'Auth Specs', url: '/openapi-auth.json' },
			],
		} as any)
	);

	return router;
};
