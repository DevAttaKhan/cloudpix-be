"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const jet_logger_1 = __importDefault(require("jet-logger"));
const routes_1 = __importDefault(require("@src/routes"));
const PATHS_1 = __importDefault(require("@src/common/constants/PATHS"));
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const route_errors_1 = require("@src/common/util/route-errors");
const AppInsightsService_1 = require("@src/services/azure/AppInsightsService");
const app = (0, express_1.default)();
// Initialize Application Insights
(0, AppInsightsService_1.initializeAppInsights)();
// **** Middleware **** //
// CORS configuration - allow all origins
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
// Basic middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Security
if (process.env.NODE_ENV === 'production') {
    if (!process.env.DISABLE_HELMET) {
        app.use((0, helmet_1.default)());
    }
}
// Health check at root level (for convenience)
app.get('/health', (req, res) => {
    res.status(HTTP_STATUS_CODES_1.default.Ok).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'CloudPix API',
    });
});
// Add APIs, must be after middleware
app.use(PATHS_1.default._, routes_1.default);
// Add error handler
app.use((err, _, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        jet_logger_1.default.err(err, true);
    }
    let status = HTTP_STATUS_CODES_1.default.BadRequest;
    if (err instanceof route_errors_1.RouteError) {
        status = err.status;
        res.status(status).json({ error: err.message });
    }
    else {
        res.status(status).json({ error: err.message || 'Internal server error' });
    }
    return next(err);
});
// Root endpoint - API info
app.get('/', (_, res) => {
    return res.json({
        message: 'CloudPix API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            files: '/api/files',
            share: '/api/share',
        },
    });
});
exports.default = app;
