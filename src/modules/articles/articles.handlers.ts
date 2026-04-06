import type { AppContext } from '@/factory';
import { ArticlesService } from './articles.service';

export const listHandler = async (c: AppContext) => {
	const service = new ArticlesService(c.env.DATABASE_URL);
	const data = await service.list();
	return c.json(data, 200);
};

export const getHandler = async (c: AppContext) => {
	const { id } = c.req.valid('param' as never);
	const service = new ArticlesService(c.env.DATABASE_URL);
	const data = await service.getById(id);
	return c.json(data, 200);
};
