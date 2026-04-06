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
}

export type EmailResult =
	| { success: true; messageId: string }
	| { success: false; error: string };

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Send a single email via Resend.
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

	try {
		const resend = new Resend(env.RESEND_API_KEY);
		const { data, error } = await resend.emails.send({
			from,
			to: options.to,
			subject: options.subject,
			html: options.html,
			...(options.text ? { text: options.text } : {}),
		});

		if (error || !data?.id) {
			const message = error?.message ?? 'Unknown Resend error';
			logger.error('sendEmail: Resend API error', { error: message });
			return { success: false, error: message };
		}

		logger.info('sendEmail: sent', { messageId: data.id, to: options.to });
		return { success: true, messageId: data.id };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error('sendEmail: unexpected error', { error: message });
		return { success: false, error: message };
	}
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

const LABEL: Record<
	'email_verify' | 'password_reset',
	{ emoji: string; title: string; subject: string }
> = {
	email_verify: {
		emoji: '✅',
		title: 'Verify Your Email',
		subject: 'Verify Your Email – OTP',
	},
	password_reset: {
		emoji: '🔐',
		title: 'Password Reset',
		subject: 'Password Reset OTP',
	},
};

function buildOTPHtml(otp: string, purpose: keyof typeof LABEL): string {
	const { emoji, title } = LABEL[purpose];
	return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
  <h1 style="margin:0 0 16px">${emoji} ${title}</h1>
  <p style="margin:0 0 8px;color:#444">Your one-time password (OTP) is:</p>
  <div style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:6px;
              padding:12px 24px;margin:16px 0;background:#f4f4f5;border-radius:8px">
    ${otp}
  </div>
  <p style="color:#555">This OTP is valid for <strong>10 minutes</strong>.</p>
  <p style="color:#888;font-size:13px">
    If you did not request this, you can safely ignore this email.
  </p>
  <hr style="margin:28px 0;border:none;border-top:1px solid #e5e7eb" />
  <p style="color:#aaa;font-size:11px">Sent by ${title}</p>
</div>
  `.trim();
}

function buildOTPText(otp: string, purpose: keyof typeof LABEL): string {
	const { title } = LABEL[purpose];
	return [
		title,
		'',
		`Your OTP code: ${otp}`,
		'',
		'Valid for 10 minutes.',
		'',
		"If you didn't request this, please ignore this email.",
	].join('\n');
}

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
	const { subject } = LABEL[purpose];

	return sendEmail(env, {
		to,
		subject,
		html: buildOTPHtml(otp, purpose),
		text: buildOTPText(otp, purpose),
	});
}
