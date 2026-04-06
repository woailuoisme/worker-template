import { apiErrorSchema } from './response';

export class AppError extends Error {
	public statusCode: number;
	public details?: any;

	constructor(message: string, statusCode: number, details?: any) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found', details?: any) {
		super(message, 404, details);
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Validation Error', details?: any) {
		super(message, 422, details);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden', details?: any) {
		super(message, 403, details);
	}
}

export const errorResponseSchema = apiErrorSchema;
