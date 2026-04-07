/** @jsxImportSource hono/jsx */
import { EmailLayout } from '../components/email-layout';

/**
 * Action Link Email Template (Magic Links, Verify Email, Reset Password)
 */
export const TemplateActionLink = ({
	title,
	actionText,
	url,
	appName,
	preheader,
}: {
	title: string;
	actionText: string;
	url: string;
	appName: string;
	preheader?: string;
}) => (
	<EmailLayout
		title={title}
		appName={appName}
		preheader={preheader || `${title} - 请点击链接继续`}
	>
		<h1
			style={{
				margin: '0 0 24px',
				fontSize: '24px',
				fontWeight: 'bold',
				color: '#0f172a',
				textAlign: 'center',
			}}
		>
			{title}
		</h1>

		<p style={{ margin: '0 0 24px', textAlign: 'center', color: '#475569' }}>
			{actionText}
		</p>

		<div style={{ textAlign: 'center', margin: '32px 0' }}>
			<a
				href={url}
				style={{
					display: 'inline-block',
					padding: '12px 24px',
					backgroundColor: '#0f172a',
					color: '#f8fafc',
					textDecoration: 'none',
					fontWeight: '600',
					borderRadius: '8px',
					fontSize: '16px',
				}}
			>
				点击继续
			</a>
		</div>

		<p
			style={{
				margin: '24px 0 0',
				textAlign: 'center',
				color: '#64748b',
				fontSize: '14px',
			}}
		>
			或者将以下链接复制到浏览器中访问：
			<br />
			<a href={url} style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
				{url}
			</a>
		</p>
	</EmailLayout>
);
