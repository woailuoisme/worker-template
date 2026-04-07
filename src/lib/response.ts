/**
 * Unified Response Format
 *
 * Response envelope shapes:
 *   Success:   { success: true,  code, message, data: T }
 *   Error:     { success: false, code, message, error_code?, errors? }
 *   Paginated: { success: true,  code: 200, message, data: { items: T[], meta: PaginationMeta } }
 *
 * Prefer the `send*` helpers in handlers – they call c.json() for you.
 * Use the bare builder functions (`buildSuccess`, `buildError`, etc.) only
 * when you need to compose the envelope without sending it immediately
 * (e.g. for testing or OpenAPI schema generation).
 */

import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';

// ---------------------------------------------------------------------------
// Envelope types
// ---------------------------------------------------------------------------

export interface ApiSuccess<T = unknown, C extends number = number> {
	success: true;
	code: C;
	message: string;
	data: T;
}

export interface ApiError {
	success: false;
	code: number;
	error_code?: string;
	message: string;
	errors?: any;
}

export interface PaginationMeta {
	current_page: number;
	per_page: number;
	last_page: number;
	has_more: boolean;
	total: number;
	from: number;
	to: number;
}

export interface ApiPaginated<T>
	extends ApiSuccess<{ items: T[]; meta: PaginationMeta }, 200> {}

// ---------------------------------------------------------------------------
// Zod Schemas (for OpenAPI)
// ---------------------------------------------------------------------------

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		code: z.number(),
		message: z.string(),
		data: dataSchema,
	});

export const apiErrorSchema = z.object({
	success: z.literal(false),
	code: z.number(),
	error_code: z.string().optional(),
	message: z.string(),
	errors: z.any().optional(),
});

export const paginationMetaSchema = z.object({
	current_page: z.number(),
	per_page: z.number(),
	last_page: z.number(),
	has_more: z.boolean(),
	total: z.number(),
	from: z.number(),
	to: z.number(),
});

export const paginationQuerySchema = z.object({
	page: z.coerce
		.number({ error: 'Page must be a valid number' })
		.int()
		.positive()
		.default(1),
	limit: z.coerce
		.number({ error: 'Limit must be a valid number' })
		.int()
		.positive()
		.max(100)
		.default(10),
});

export const apiPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
	apiSuccessSchema(
		z.object({
			items: z.array(itemSchema),
			meta: paginationMetaSchema,
		})
	);

// ---------------------------------------------------------------------------
// Envelope builders  (pure, no side-effects)
// ---------------------------------------------------------------------------

export function buildSuccess<T, const C extends number = 200>(
	data: T,
	options: { code?: C; message?: string } = {}
): ApiSuccess<T, C> {
	return {
		success: true,
		code: (options.code ?? 200) as C,
		message: options.message ?? 'OK',
		data,
	};
}

export function buildError(
	code: number,
	message: string,
	options: { errorCode?: string; errors?: Record<string, string[]> } = {}
): ApiError {
	return {
		success: false,
		code,
		message,
		...(options.errorCode && { error_code: options.errorCode }),
		...(options.errors && { errors: options.errors }),
	};
}

export function buildPaginated<T>(
	items: T[],
	page: number,
	limit: number,
	total: number,
	message = 'OK'
): ApiPaginated<T> {
	const lastPage = Math.ceil(total / limit) || 1;
	const from = items.length > 0 ? (page - 1) * limit + 1 : 0;
	const to = items.length > 0 ? from + items.length - 1 : 0;

	return {
		success: true,
		code: 200,
		message,
		data: {
			items,
			meta: {
				current_page: page,
				per_page: limit,
				last_page: lastPage,
				has_more: page < lastPage,
				total,
				from,
				to,
			},
		},
	};
}

// ---------------------------------------------------------------------------
// Send helpers  (use these in handlers)
// ---------------------------------------------------------------------------

/**
 * Send a successful JSON response.
 *
 * @example
 * return sendSuccess(c, task);
 * return sendSuccess(c, task, { code: 201, message: 'Created' });
 */
export function sendSuccess<T, const C extends number = 200>(
	c: Context,
	data: T,
	options: { code?: C; message?: string } = {}
) {
	const body = buildSuccess(data, options);
	return c.json(body, (options.code ?? 200) as any);
}

/**
 * Send an error JSON response.
 *
 * @example
 * return sendError(c, 404, 'Task not found');
 * return sendError(c, 422, 'Validation failed', { errors: fieldErrors });
 */
export function sendError(
	c: Context,
	code: number,
	message: string,
	options: { errorCode?: string; errors?: Record<string, string[]> } = {}
) {
	const body = buildError(code, message, options);
	return c.json(body, code as any);
}

/**
 * Send a paginated JSON response.
 *
 * @example
 * return sendPaginated(c, items, { page: 1, limit: 20, total: 100 });
 */
export function sendPaginated<T>(
	c: Context,
	items: T[],
	meta: { page: number; limit: number; total: number; message?: string }
) {
	const body = buildPaginated(
		items,
		meta.page,
		meta.limit,
		meta.total,
		meta.message
	);
	return c.json(body, 200 as any);
}

// ---------------------------------------------------------------------------
// Shorthand builders  (backward-compat aliases for common cases)
// ---------------------------------------------------------------------------

/** 201 Created */
export const buildCreated = <T>(
	data: T,
	message = 'Resource created successfully'
) => buildSuccess(data, { code: 201, message });

/** 204 No Content (body is omitted by the client; the envelope is for consistency) */
export const buildNoContent = (message = 'No Content') =>
	buildSuccess(null, { code: 204, message });

/** 422 Validation Error */
export const buildValidationError = (
	errors: Record<string, string[]>,
	message = 'Validation failed'
) => buildError(422, message, { errorCode: 'VALIDATION_ERROR', errors });
