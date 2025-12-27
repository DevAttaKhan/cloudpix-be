"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileById = exports.getUserFiles = exports.uploadFile = void 0;
const uuid_1 = require("uuid");
const CosmosFileRepo_1 = __importDefault(require("@src/repos/CosmosFileRepo"));
const CosmosShareLinkRepo_1 = __importDefault(require("@src/repos/CosmosShareLinkRepo"));
const BlobService_1 = require("@src/services/azure/BlobService");
const AppInsightsService_1 = require("@src/services/azure/AppInsightsService");
const jet_logger_1 = __importDefault(require("jet-logger"));
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Upload a file
 */
const uploadFile = async (data) => {
    try {
        // Generate fileId
        const fileId = (0, uuid_1.v4)();
        // Create blob name: {userId}/{fileId}/{fileName}
        const blobName = `${data.userId}/${fileId}/${data.fileName}`;
        // Upload to blob storage
        const blobUrl = await (0, BlobService_1.uploadBlob)(blobName, data.buffer, data.contentType);
        // Create file record
        const file = {
            fileId,
            userId: data.userId,
            fileName: data.fileName,
            blobUrl,
            fileSize: data.fileSize,
            contentType: data.contentType,
            uploadDate: new Date(),
            status: 'active',
        };
        const createdFile = await CosmosFileRepo_1.default.createFile(file);
        (0, AppInsightsService_1.trackEvent)('file_upload_success', {
            userId: data.userId,
            fileId,
            contentType: data.contentType,
        });
        (0, AppInsightsService_1.trackMetric)('file_upload_size', data.fileSize);
        return createdFile;
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'upload_file',
            userId: data.userId,
        });
        jet_logger_1.default.err(error);
        throw new Error('Failed to upload file');
    }
};
exports.uploadFile = uploadFile;
/**
 * Get user files
 */
const getUserFiles = async (userId) => {
    try {
        const files = await CosmosFileRepo_1.default.getFilesByUserId(userId);
        return files;
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'get_user_files',
            userId,
        });
        jet_logger_1.default.err(error);
        throw new Error('Failed to get user files');
    }
};
exports.getUserFiles = getUserFiles;
/**
 * Get file by ID
 */
const getFileById = async (fileId, userId) => {
    try {
        const file = await CosmosFileRepo_1.default.getFileById(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        // Verify ownership
        if (file.userId !== userId) {
            throw new Error('Unauthorized access to file');
        }
        return file;
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'get_file',
            fileId,
            userId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.getFileById = getFileById;
/**
 * Delete a file
 */
const deleteFile = async (fileId, userId) => {
    try {
        // Get file
        const file = await CosmosFileRepo_1.default.getFileById(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        // Verify ownership
        if (file.userId !== userId) {
            throw new Error('Unauthorized access to file');
        }
        // Extract blob name from URL
        const blobName = file.blobUrl.split('/').slice(-3).join('/'); // Get last 3 parts: userId/fileId/fileName
        // Delete from blob storage
        try {
            await (0, BlobService_1.deleteBlob)(blobName);
        }
        catch {
            jet_logger_1.default.warn(`Failed to delete blob ${blobName}, continuing with metadata deletion`);
        }
        // Delete all share links for this file (cascade delete)
        await CosmosShareLinkRepo_1.default.deleteShareLinksByFileId(fileId);
        // Delete file record
        await CosmosFileRepo_1.default.hardDeleteFile(fileId);
        (0, AppInsightsService_1.trackEvent)('file_delete_success', {
            userId,
            fileId,
        });
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'delete_file',
            fileId,
            userId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.deleteFile = deleteFile;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    uploadFile: exports.uploadFile,
    getUserFiles: exports.getUserFiles,
    getFileById: exports.getFileById,
    deleteFile: exports.deleteFile,
};
