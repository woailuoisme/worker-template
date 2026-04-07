import { createRouter } from '@/factory';
import { tasksRouter } from '@/modules/tasks/tasks.index';

export const v1Router = createRouter();

// Feature modules
v1Router.route('/tasks', tasksRouter);
