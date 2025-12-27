"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const FileService_1 = __importDefault(require("@src/services/FileService"));
const auth_1 = require("@src/middleware/auth");
const upload_1 = require("@src/middleware/upload");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Upload a file
 */
async function uploadFile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const file = req.file;
        if (!file) {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'No file provided',
            });
        }
        // Validate file
        (0, upload_1.validateFileSize)(file);
        (0, upload_1.validateFileType)(file);
        const result = await FileService_1.default.uploadFile({
            userId,
            fileName: file.originalname,
            contentType: file.mimetype,
            fileSize: file.size,
            buffer: file.buffer,
        });
        res.status(HTTP_STATUS_CODES_1.default.Created).json(result);
    }
    catch (error) {
        res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
            error: error.message || 'Failed to upload file',
        });
    }
}
/**
 * Get all user files
 */
async function getUserFiles(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const files = await FileService_1.default.getUserFiles(userId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json({ files });
    }
    catch (error) {
        res.status(HTTP_STATUS_CODES_1.default.InternalServerError).json({
            error: error.message || 'Failed to get files',
        });
    }
}
/**
 * Get file by ID
 */
async function getFileById(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const { id } = req.params;
        const file = await FileService_1.default.getFileById(id, userId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json(file);
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : HTTP_STATUS_CODES_1.default.Unauthorized;
        res.status(status).json({
            error: error.message || 'Failed to get file',
        });
    }
}
/**
 * Delete a file
 */
async function deleteFile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const { id } = req.params;
        await FileService_1.default.deleteFile(id, userId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json({ message: 'File deleted successfully' });
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : error.message.includes('Unauthorized')
                ? HTTP_STATUS_CODES_1.default.Unauthorized
                : HTTP_STATUS_CODES_1.default.InternalServerError;
        res.status(status).json({
            error: error.message || 'Failed to delete file',
        });
    }
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    upload: [auth_1.authenticate, upload_1.upload.single('file'), uploadFile],
    getAll: [auth_1.authenticate, getUserFiles],
    getById: [auth_1.authenticate, getFileById],
    delete: [auth_1.authenticate, deleteFile],
};
