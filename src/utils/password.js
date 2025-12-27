"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jet_logger_1 = __importDefault(require("jet-logger"));
/******************************************************************************
                                 Constants
******************************************************************************/
const SALT_ROUNDS = 10;
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Hash a password
 */
const hashPassword = async (password) => {
    try {
        return await bcrypt_1.default.hash(password, SALT_ROUNDS);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to hash password');
    }
};
exports.hashPassword = hashPassword;
/**
 * Compare a password with a hash
 */
const comparePassword = async (password, hash) => {
    try {
        return await bcrypt_1.default.compare(password, hash);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to compare password');
    }
};
exports.comparePassword = comparePassword;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    hashPassword: exports.hashPassword,
    comparePassword: exports.comparePassword,
};
