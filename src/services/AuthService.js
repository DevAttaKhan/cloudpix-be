"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const uuid_1 = require("uuid");
const CosmosUserRepo_1 = __importDefault(require("@src/repos/CosmosUserRepo"));
const jwt_1 = require("@src/utils/jwt");
const password_1 = require("@src/utils/password");
const AppInsightsService_1 = require("@src/services/azure/AppInsightsService");
const jet_logger_1 = __importDefault(require("jet-logger"));
/**
 * Register a new user
 */
const register = async (data) => {
    try {
        // Check if user already exists
        // If getUserByEmail returns null, user doesn't exist (or query failed)
        // We'll try to create the user and let Cosmos DB handle duplicates
        const existingUser = await CosmosUserRepo_1.default.getUserByEmail(data.email);
        if (existingUser) {
            (0, AppInsightsService_1.trackEvent)('auth_register_failed', { reason: 'user_exists' });
            throw new Error('User with this email already exists');
        }
        // Hash password
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        // Generate userId (GUID)
        const userId = (0, uuid_1.v4)();
        // Create user
        const user = {
            userId,
            email: data.email,
            passwordHash,
            createdDate: new Date(),
        };
        await CosmosUserRepo_1.default.createUser(user);
        // Generate token
        const token = (0, jwt_1.generateToken)({
            userId: user.userId,
            email: user.email,
        });
        (0, AppInsightsService_1.trackEvent)('auth_register_success', { userId });
        return {
            token,
            user: {
                userId: user.userId,
                email: user.email,
            },
        };
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'register',
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.register = register;
/**
 * Login user
 */
const login = async (data) => {
    try {
        // Get user by email
        const user = await CosmosUserRepo_1.default.getUserByEmail(data.email);
        if (!user) {
            (0, AppInsightsService_1.trackEvent)('auth_login_failed', { reason: 'user_not_found' });
            throw new Error('Invalid email or password');
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
        if (!isPasswordValid) {
            (0, AppInsightsService_1.trackEvent)('auth_login_failed', { reason: 'invalid_password' });
            throw new Error('Invalid email or password');
        }
        // Update last login
        await CosmosUserRepo_1.default.updateLastLogin(user.userId);
        // Generate token
        const token = (0, jwt_1.generateToken)({
            userId: user.userId,
            email: user.email,
        });
        (0, AppInsightsService_1.trackEvent)('auth_login_success', { userId: user.userId });
        return {
            token,
            user: {
                userId: user.userId,
                email: user.email,
            },
        };
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'login',
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.login = login;
/**
 * Get user profile
 */
const getProfile = async (userId) => {
    try {
        const user = await CosmosUserRepo_1.default.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            userId: user.userId,
            email: user.email,
        };
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'get_profile',
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.getProfile = getProfile;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    register: exports.register,
    login: exports.login,
    getProfile: exports.getProfile,
};
