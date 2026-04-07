/** @jsxImportSource hono/jsx */
import { EmailLayout } from '../components/email-layout';

/**
 * Welcome Email Template (Placeholder)
 */
export const TemplateWelcome = ({
	userName,
	appName,
}: {
	userName: string;
	appName: string;
}) => (
	<EmailLayout title={`欢迎使用 ${appName}`} appName={appName}>
		<h1 style={{ fontSize: '24px', color: '#0f172a' }}>欢迎，{userName}！👋</h1>
		<p style={{ color: '#475569' }}>
			感谢您加入 <strong>{appName}</strong>。我们致力于为您提供最棒的服务。
		</p>
	</EmailLayout>
);
