"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Health check endpoint
 */
function health(_, res) {
    console.log('Health check endpoint called');
    res.status(HTTP_STATUS_CODES_1.default.Ok).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'CloudPix API',
    });
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    health,
};
