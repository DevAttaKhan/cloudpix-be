"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDeleteFile = exports.deleteFile = exports.updateFile = exports.getFilesByUserId = exports.getFileById = exports.createFile = void 0;
const CosmosService_1 = require("@src/services/azure/CosmosService");
const jet_logger_1 = __importDefault(require("jet-logger"));
const constants_1 = require("@src/common/constants");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Create a new file record
 */
const createFile = async (file) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.FILES, '/fileId');
        const { resource } = await container.items.create(file);
        if (!resource) {
            throw new Error('Failed to create file');
        }
        return resource;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to create file');
    }
};
exports.createFile = createFile;
/**
 * Get file by fileId
 */
const getFileById = async (fileId) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.FILES, '/fileId');
        // Query by fileId since Cosmos DB auto-generates 'id' field
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.fileId = @fileId',
            parameters: [
                {
                    name: '@fileId',
                    value: fileId,
                },
            ],
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources.length > 0 ? resources[0] : null;
    }
    catch (error) {
        if (error.code === 404) {
            return null;
        }
        jet_logger_1.default.err(error);
        throw new Error('Failed to get file');
    }
};
exports.getFileById = getFileById;
/**
 * Get all files for a user
 */
const getFilesByUserId = async (userId) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.FILES, '/fileId');
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status',
            parameters: [
                {
                    name: '@userId',
                    value: userId,
                },
                {
                    name: '@status',
                    value: 'active',
                },
            ],
        };
        const { resources } = await container.items
            .query(querySpec)
            .fetchAll();
        return resources;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to get user files');
    }
};
exports.getFilesByUserId = getFilesByUserId;
/**
 * Update file
 */
const updateFile = async (file) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.FILES, '/fileId');
        // Fetch existing file to get its Cosmos DB 'id'
        const existingFile = await (0, exports.getFileById)(file.fileId);
        if (!existingFile) {
            throw new Error('File not found for update');
        }
        // Use the existing Cosmos DB 'id' for the replace operation
        const cosmosId = existingFile.id || file.fileId;
        const { resource } = await container
            .item(cosmosId, file.fileId) // Use cosmosId for item ID, file.fileId for partition key
            .replace(file);
        if (!resource) {
            throw new Error('Failed to update file');
        }
        return resource;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to update file');
    }
};
exports.updateFile = updateFile;
/**
 * Delete file (soft delete by setting status to deleted)
 */
const deleteFile = async (fileId) => {
    try {
        const file = await (0, exports.getFileById)(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        file.status = 'deleted';
        await (0, exports.updateFile)(file);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to delete file');
    }
};
exports.deleteFile = deleteFile;
/**
 * Hard delete file from Cosmos DB
 */
const hardDeleteFile = async (fileId) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.FILES, '/fileId');
        // Fetch existing file to get its Cosmos DB 'id'
        const existingFile = await (0, exports.getFileById)(fileId);
        if (!existingFile) {
            return; // File doesn't exist, nothing to delete
        }
        // Use the existing Cosmos DB 'id' for the delete operation
        const cosmosId = existingFile.id || fileId;
        await container.item(cosmosId, fileId).delete();
    }
    catch (error) {
        if (error.code !== 404) {
            jet_logger_1.default.err(error);
            throw new Error('Failed to hard delete file');
        }
    }
};
exports.hardDeleteFile = hardDeleteFile;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    createFile: exports.createFile,
    getFileById: exports.getFileById,
    getFilesByUserId: exports.getFilesByUserId,
    updateFile: exports.updateFile,
    deleteFile: exports.deleteFile,
    hardDeleteFile: exports.hardDeleteFile,
};
