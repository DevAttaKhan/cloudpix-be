import { Router } from 'express';

import PATHS from '@src/common/constants/PATHS';

import AuthRoutes from './AuthRoutes';
import FileRoutes from './FileRoutes';
import ShareRoutes from './ShareRoutes';
import HealthRoutes from './HealthRoutes';
import MetricsRoutes from './MetricsRoutes';

const apiRouter = Router();

// ** Health & Metrics Routes ** //
apiRouter.get('/health', HealthRoutes.health);
apiRouter.get('/metrics', MetricsRoutes.metrics);

// ** Auth Routes ** //
const authRouter = Router();
authRouter.post('/register', AuthRoutes.register);
authRouter.post('/login', AuthRoutes.login);
authRouter.get('/profile', ...AuthRoutes.getProfile);
apiRouter.use('/auth', authRouter);

// ** File Routes ** //
const fileRouter = Router();
fileRouter.post('/upload', ...FileRoutes.upload);
fileRouter.get('/', ...FileRoutes.getAll);
fileRouter.get('/:id', ...FileRoutes.getById);
fileRouter.delete('/:id', ...FileRoutes.delete);
apiRouter.use('/files', fileRouter);

// ** Share Routes ** //
const shareRouter = Router();
shareRouter.post('/:linkId/revoke', ...ShareRoutes.revoke);
apiRouter.use('/share', shareRouter);

// Share link access (no auth required)
apiRouter.get('/share/:linkId', ShareRoutes.getByLinkId);

// File share creation and listing (requires auth)
const fileShareRouter = Router();
fileShareRouter.post('/:id/share', ...ShareRoutes.create);
fileShareRouter.get('/:id/share-links', ...ShareRoutes.getByFileId);
apiRouter.use('/files', fileShareRouter);

export default apiRouter;
