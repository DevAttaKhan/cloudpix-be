"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthRoutes_1 = __importDefault(require("./AuthRoutes"));
const FileRoutes_1 = __importDefault(require("./FileRoutes"));
const ShareRoutes_1 = __importDefault(require("./ShareRoutes"));
const HealthRoutes_1 = __importDefault(require("./HealthRoutes"));
const MetricsRoutes_1 = __importDefault(require("./MetricsRoutes"));
const apiRouter = (0, express_1.Router)();
// ** Health & Metrics Routes ** //
apiRouter.get('/health', HealthRoutes_1.default.health);
apiRouter.get('/metrics', MetricsRoutes_1.default.metrics);
// ** Auth Routes ** //
const authRouter = (0, express_1.Router)();
authRouter.post('/register', AuthRoutes_1.default.register);
authRouter.post('/login', AuthRoutes_1.default.login);
authRouter.get('/profile', ...AuthRoutes_1.default.getProfile);
apiRouter.use('/auth', authRouter);
// ** File Routes ** //
const fileRouter = (0, express_1.Router)();
fileRouter.post('/upload', ...FileRoutes_1.default.upload);
fileRouter.get('/', ...FileRoutes_1.default.getAll);
fileRouter.get('/:id', ...FileRoutes_1.default.getById);
fileRouter.delete('/:id', ...FileRoutes_1.default.delete);
apiRouter.use('/files', fileRouter);
// ** Share Routes ** //
const shareRouter = (0, express_1.Router)();
shareRouter.post('/:linkId/revoke', ...ShareRoutes_1.default.revoke);
apiRouter.use('/share', shareRouter);
// Share link access (no auth required)
apiRouter.get('/share/:linkId', ShareRoutes_1.default.getByLinkId);
// File share creation and listing (requires auth)
const fileShareRouter = (0, express_1.Router)();
fileShareRouter.post('/:id/share', ...ShareRoutes_1.default.create);
fileShareRouter.get('/:id/share-links', ...ShareRoutes_1.default.getByFileId);
apiRouter.use('/files', fileShareRouter);
exports.default = apiRouter;
