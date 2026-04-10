import * as HttpStatusCodes from 'stoker/http-status-codes';
import { apiErrorSchema } from './response';

// ---------------------------------------------------------------------------
// Base application error
// ---------------------------------------------------------------------------

export class AppError extends Error {
	public statusCode: number;
	public details?: unknown;

	constructor(message: string, statusCode: number, details?: unknown) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

// ---------------------------------------------------------------------------
// Concrete domain errors — use stoker named constants, no magic numbers
// ---------------------------------------------------------------------------

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found', details?: unknown) {
		super(message, HttpStatusCodes.NOT_FOUND, details);
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Validation Error', details?: unknown) {
		super(message, HttpStatusCodes.UNPROCESSABLE_ENTITY, details);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden', details?: unknown) {
		super(message, HttpStatusCodes.FORBIDDEN, details);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Unauthorized', details?: unknown) {
		super(message, HttpStatusCodes.UNAUTHORIZED, details);
	}
}

// ---------------------------------------------------------------------------
// OpenAPI schema alias for convenience
// ---------------------------------------------------------------------------

export const errorResponseSchema = apiErrorSchema;
