"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.RouteError = void 0;
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
/**
 * Error with status code and message.
 */
class RouteError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.RouteError = RouteError;
/**
 * Handle "parseObj" errors.
 */
class ValidationError extends RouteError {
    constructor(errors) {
        const msg = JSON.stringify({
            message: ValidationError.MESSAGE,
            errors,
        });
        super(HTTP_STATUS_CODES_1.default.BadRequest, msg);
    }
}
exports.ValidationError = ValidationError;
ValidationError.MESSAGE = 'The parseObj() function discovered one or ' + 'more errors.';
