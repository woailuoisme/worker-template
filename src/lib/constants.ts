export const OPENAPI_DESCRIPTION = `
# Cloudflare Worker API
欢迎使用本项目的 API 文档。

### 核心特性
- **性能**: 基于 Cloudflare Workers 极速响应。
- **安全**: 集成 Better Auth 鉴权体系。
- **开发**: 全链路类型安全 (Hono + Zod)。

> 提示：可以通过 \`/docs\` 切换查看原始 Auth 接口。
`.trim();

import * as HttpStatusPhrases from 'stoker/http-status-phrases';
import { createMessageObjectSchema } from 'stoker/openapi/schemas';

export const ZOD_ERROR_MESSAGES = {
	REQUIRED: 'Required',
	EXPECTED_NUMBER: 'Invalid input: expected number, received NaN',
	NO_UPDATES: 'No updates provided',
	EXPECTED_STRING: 'Invalid input: expected string, received undefined',
};

export const ZOD_ERROR_CODES = {
	INVALID_UPDATES: 'invalid_updates',
};

export const notFoundSchema = createMessageObjectSchema(
	HttpStatusPhrases.NOT_FOUND
);
