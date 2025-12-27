"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jet_logger_1 = __importDefault(require("jet-logger"));
/******************************************************************************
                                 Constants
******************************************************************************/
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Set to maximum expiration: 10 years (3650 days)
const JWT_EXPIRY = process.env.JWT_EXPIRY || '3650d';
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Generate a JWT token
 */
const generateToken = (payload) => {
    try {
        // JWT_EXPIRY is a string like '3650d', which is valid for expiresIn
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRY,
        });
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to generate token');
    }
};
exports.generateToken = generateToken;
/**
 * Verify and decode a JWT token
 */
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        jet_logger_1.default.err(error);
        throw new Error('Failed to verify token');
    }
};
exports.verifyToken = verifyToken;
/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    generateToken: exports.generateToken,
    verifyToken: exports.verifyToken,
    extractTokenFromHeader: exports.extractTokenFromHeader,
};
