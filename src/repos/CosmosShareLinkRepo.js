"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isShareLinkValid = exports.deleteShareLinksByFileId = exports.incrementAccessCount = exports.revokeShareLink = exports.updateShareLink = exports.getShareLinksByFileId = exports.getShareLinkById = exports.createShareLink = void 0;
const CosmosService_1 = require("@src/services/azure/CosmosService");
const jet_logger_1 = __importDefault(require("jet-logger"));
const constants_1 = require("@src/common/constants");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Create a new share link
 */
const createShareLink = async (shareLink) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        const { resource } = await container.items.create(shareLink);
        if (!resource) {
            throw new Error('Failed to create share link');
        }
        return resource;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to create share link');
    }
};
exports.createShareLink = createShareLink;
/**
 * Get share link by linkId
 */
const getShareLinkById = async (linkId) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        // Query by linkId (partition key) instead of using item(id, partitionKey)
        // because Cosmos DB auto-generates an 'id' field that differs from linkId
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.linkId = @linkId',
            parameters: [
                {
                    name: '@linkId',
                    value: linkId,
                },
            ],
        };
        const { resources } = await container.items
            .query(querySpec)
            .fetchAll();
        return resources.length > 0 ? resources[0] : null;
    }
    catch (error) {
        if (error.code === 404) {
            return null;
        }
        jet_logger_1.default.err(error);
        throw new Error('Failed to get share link');
    }
};
exports.getShareLinkById = getShareLinkById;
/**
 * Get all share links for a file
 */
const getShareLinksByFileId = async (fileId) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.fileId = @fileId AND c.isRevoked = @isRevoked',
            parameters: [
                {
                    name: '@fileId',
                    value: fileId,
                },
                {
                    name: '@isRevoked',
                    value: false,
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
        throw new Error('Failed to get share links for file');
    }
};
exports.getShareLinksByFileId = getShareLinksByFileId;
/**
 * Update share link
 */
const updateShareLink = async (shareLink) => {
    try {
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        // First, get the share link to find the Cosmos DB 'id' field
        const existingLink = await (0, exports.getShareLinkById)(shareLink.linkId);
        if (!existingLink) {
            throw new Error('Share link not found');
        }
        // Use the Cosmos DB 'id' field for the replace operation
        const cosmosId = existingLink.id || shareLink.linkId;
        const { resource } = await container
            .item(cosmosId, shareLink.linkId)
            .replace(shareLink);
        if (!resource) {
            throw new Error('Failed to update share link');
        }
        return resource;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to update share link');
    }
};
exports.updateShareLink = updateShareLink;
/**
 * Revoke share link
 */
const revokeShareLink = async (linkId) => {
    try {
        const shareLink = await (0, exports.getShareLinkById)(linkId);
        if (!shareLink) {
            throw new Error('Share link not found');
        }
        shareLink.isRevoked = true;
        await (0, exports.updateShareLink)(shareLink);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to revoke share link');
    }
};
exports.revokeShareLink = revokeShareLink;
/**
 * Increment access count
 */
const incrementAccessCount = async (linkId) => {
    try {
        const shareLink = await (0, exports.getShareLinkById)(linkId);
        if (!shareLink) {
            throw new Error('Share link not found');
        }
        shareLink.accessCount = (shareLink.accessCount || 0) + 1;
        await (0, exports.updateShareLink)(shareLink);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to increment access count');
    }
};
exports.incrementAccessCount = incrementAccessCount;
/**
 * Delete all share links for a file (cascade delete)
 */
const deleteShareLinksByFileId = async (fileId) => {
    try {
        const shareLinks = await (0, exports.getShareLinksByFileId)(fileId);
        const container = await (0, CosmosService_1.getContainer)(constants_1.CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        for (const link of shareLinks) {
            // Get the Cosmos DB 'id' field
            const existingLink = await (0, exports.getShareLinkById)(link.linkId);
            if (existingLink) {
                const cosmosId = existingLink.id || link.linkId;
                await container.item(cosmosId, link.linkId).delete();
            }
        }
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to delete share links for file');
    }
};
exports.deleteShareLinksByFileId = deleteShareLinksByFileId;
/**
 * Check if share link is valid (not expired, not revoked)
 */
const isShareLinkValid = (shareLink) => {
    if (shareLink.isRevoked) {
        return false;
    }
    if (shareLink.expiryDate && new Date(shareLink.expiryDate) < new Date()) {
        return false;
    }
    return true;
};
exports.isShareLinkValid = isShareLinkValid;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    createShareLink: exports.createShareLink,
    getShareLinkById: exports.getShareLinkById,
    getShareLinksByFileId: exports.getShareLinksByFileId,
    updateShareLink: exports.updateShareLink,
    revokeShareLink: exports.revokeShareLink,
    incrementAccessCount: exports.incrementAccessCount,
    deleteShareLinksByFileId: exports.deleteShareLinksByFileId,
    isShareLinkValid: exports.isShareLinkValid,
};
