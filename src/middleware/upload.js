"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileType = exports.validateFileSize = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const route_errors_1 = require("@src/common/util/route-errors");
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
];
/**
 * File filter for multer
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new route_errors_1.RouteError(HTTP_STATUS_CODES_1.default.BadRequest, `File type not supported. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
};
/**
 * Multer configuration
 */
const storage = multer_1.default.memoryStorage();
/**
 * Multer upload middleware
 */
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});
/**
 * Validate file size
 */
const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
        throw new route_errors_1.RouteError(HTTP_STATUS_CODES_1.default.BadRequest, `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
};
exports.validateFileSize = validateFileSize;
/**
 * Validate file type
 */
const validateFileType = (file) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new route_errors_1.RouteError(HTTP_STATUS_CODES_1.default.BadRequest, `File type not supported. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }
};
exports.validateFileType = validateFileType;
exports.default = {
    upload: exports.upload,
    validateFileSize: exports.validateFileSize,
    validateFileType: exports.validateFileType,
};
