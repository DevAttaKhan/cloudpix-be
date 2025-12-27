"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("@src/utils/jwt");
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const route_errors_1 = require("@src/common/util/route-errors");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * JWT authentication middleware
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            throw new route_errors_1.RouteError(HTTP_STATUS_CODES_1.default.Unauthorized, 'Authentication required');
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.userId = payload.userId;
        req.userEmail = payload.email;
        next();
    }
    catch (error) {
        if (error instanceof route_errors_1.RouteError) {
            throw error;
        }
        throw new route_errors_1.RouteError(HTTP_STATUS_CODES_1.default.Unauthorized, 'Invalid or expired token');
    }
};
exports.authenticate = authenticate;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    authenticate: exports.authenticate,
};
