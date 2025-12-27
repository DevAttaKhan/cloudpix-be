"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const AuthService_1 = __importDefault(require("@src/services/AuthService"));
const auth_1 = require("@src/middleware/auth");
/**
 * Register a new user
 */
async function register(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'Email and password are required',
            });
        }
        const result = await AuthService_1.default.register({
            email: email,
            password: password,
        });
        res.status(HTTP_STATUS_CODES_1.default.Created).json(result);
    }
    catch (error) {
        res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
            error: error.message || 'Failed to register user',
        });
    }
}
/**
 * Login user
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'Email and password are required',
            });
        }
        const result = await AuthService_1.default.login({ email, password });
        res.status(HTTP_STATUS_CODES_1.default.Ok).json(result);
    }
    catch (error) {
        res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
            error: error.message || 'Invalid credentials',
        });
    }
}
/**
 * Get user profile
 */
async function getProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const profile = await AuthService_1.default.getProfile(userId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json(profile);
    }
    catch (error) {
        res.status(HTTP_STATUS_CODES_1.default.NotFound).json({
            error: error.message || 'User not found',
        });
    }
}
exports.default = {
    register,
    login,
    getProfile: [auth_1.authenticate, getProfile],
};
