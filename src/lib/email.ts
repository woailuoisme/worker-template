/**
 * Email Service using Resend
 *
 * Sends transactional emails (OTP verification, password reset).
 * Uses Resend API: https://resend.com
 *
 * Configuration (via env.ts):
 *   RESEND_API_KEY      – required to send; omit to disable silently
 *   RESEND_FROM_EMAIL   – sender address (default: noreply@localhost)
 */

import { Resend } from 'resend';
import type { Env } from '@/env';
import { logger } from '@/lib/logger';
import { TemplateOTP } from '../resources/email/email-templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	/** Override the default sender address for this message only */
	from?: string;
	/** Optional reply-to address */
	replyTo?: string;
	/** Unique key to prevent duplicate emails. Typically `event-type-${id}`. */
	idempotencyKey?: string;
}

export type EmailResult =
	| { success: true; messageId: string }
	| { success: false; error: string };

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Send a single email via Resend with retries and idempotency.
 *
 * Returns a typed result object – never throws.
 * If `RESEND_API_KEY` is not set the call is a no-op (`success: false`).
 */
export async function sendEmail(
	env: Env,
	options: EmailOptions
): Promise<EmailResult> {
	if (!env.RESEND_API_KEY) {
		logger.warn('sendEmail: RESEND_API_KEY is not set, skipping send');
		return { success: false, error: 'RESEND_API_KEY not configured' };
	}

	const from = options.from ?? env.RESEND_FROM_EMAIL;
	const maxRetries = 3;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

		try {
			const resend = new Resend(env.RESEND_API_KEY);
			const { data, error } = await resend.emails.send(
				{
					from,
					to: options.to,
					subject: options.subject,
					html: options.html,
					text: options.text,
					replyTo: options.replyTo,
				},
				{
					headers: options.idempotencyKey
						? { 'Idempotency-Key': options.idempotencyKey }
						: undefined,
				}
			);

			if (error || !data?.id) {
				const message = error?.message ?? 'Unknown Resend error';
				const statusCode = (error as any)?.statusCode;

				// Retry on server errors or rate limits
				if (
					attempt < maxRetries - 1 &&
					(statusCode >= 500 || statusCode === 429)
				) {
					const delay = Math.min(1000 * 2 ** attempt, 5000);
					logger.warn(`sendEmail: transient error, retrying in ${delay}ms`, {
						error: message,
						attempt: attempt + 1,
					});
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}

				logger.error('sendEmail: Resend API error', { error: message });
				return { success: false, error: message };
			}

			logger.info('sendEmail: sent successfully', {
				messageId: data.id,
				to: options.to,
				attempt: attempt + 1,
			});
			return { success: true, messageId: data.id };
		} catch (err: unknown) {
			const isAbort = err instanceof Error && err.name === 'AbortError';
			const message = isAbort
				? 'Request timed out (10s)'
				: err instanceof Error
					? err.message
					: String(err);

			if (attempt < maxRetries - 1 && (isAbort || message.includes('fetch'))) {
				const delay = Math.min(1000 * 2 ** attempt, 5000);
				logger.warn(`sendEmail: network error, retrying in ${delay}ms`, {
					error: message,
					attempt: attempt + 1,
				});
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}

			logger.error('sendEmail: unexpected error', { error: message });
			return { success: false, error: message };
		} finally {
			clearTimeout(timeout);
		}
	}

	return { success: false, error: 'Max retries exceeded' };
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * Send an OTP email for email verification or password reset.
 */
export async function sendOTPEmail(
	env: Env,
	to: string,
	otp: string,
	purpose: 'email_verify' | 'password_reset'
): Promise<EmailResult> {
	const appName = env.APP_NAME ?? 'Cloudflare Worker';
	const title = purpose === 'email_verify' ? '验证您的邮箱' : '重置密码';

	return sendEmail(env, {
		to,
		subject: `${title} – ${appName}`,
		// Render the JSX template to a string
		html: (TemplateOTP({ otp, title, appName }) as any).toString(),
		text: `${title}\n\n验证码: ${otp}\n\n该验证码 10 分钟内有效。`,
		// Use a deterministic key to prevent accidental duplicate sends
		// if the auth flow retries this call.
		idempotencyKey: `${purpose}-${to}-${otp}`,
	});
}
