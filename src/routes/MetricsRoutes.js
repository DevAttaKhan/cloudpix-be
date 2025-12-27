"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const AppInsightsService_1 = require("@src/services/azure/AppInsightsService");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Metrics endpoint (Application Insights hook)
 */
function metrics(_, res) {
    try {
        // This endpoint can be used to manually trigger metrics or events
        // In production, Application Insights will automatically collect metrics
        (0, AppInsightsService_1.trackEvent)('metrics_endpoint_called');
        res.status(HTTP_STATUS_CODES_1.default.Ok).json({
            message: 'Metrics endpoint active',
            timestamp: new Date().toISOString(),
            appInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ? 'configured' : 'not configured',
        });
    }
    catch {
        res.status(HTTP_STATUS_CODES_1.default.InternalServerError).json({
            error: 'Failed to process metrics',
        });
    }
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    metrics,
};
