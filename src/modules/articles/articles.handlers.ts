import type { AppContext } from '@/factory';
import { sendSuccess } from '@/lib/response';
import { ArticlesService } from './articles.service';

export const listHandler = async (c: AppContext) => {
	const service = new ArticlesService(c.env.DATABASE_URL);
	const data = await service.list();
	return sendSuccess(c, data);
};

export const getHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new ArticlesService(c.env.DATABASE_URL);
	const data = await service.getById(id);
	return sendSuccess(c, data);
};
