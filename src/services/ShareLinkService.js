"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShareLinksByFileId = exports.revokeShareLink = exports.getFileByShareLink = exports.createShareLink = void 0;
const uuid_1 = require("uuid");
const CosmosShareLinkRepo_1 = __importDefault(require("@src/repos/CosmosShareLinkRepo"));
const CosmosFileRepo_1 = __importDefault(require("@src/repos/CosmosFileRepo"));
const BlobService_1 = require("@src/services/azure/BlobService");
const AppInsightsService_1 = require("@src/services/azure/AppInsightsService");
const jet_logger_1 = __importDefault(require("jet-logger"));
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Calculate expiry date based on expiration days
 */
const calculateExpiryDate = (expirationDays) => {
    if (!expirationDays) {
        return undefined; // Never expire
    }
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expirationDays);
    return expiryDate;
};
/**
 * Calculate TTL in seconds for Cosmos DB
 */
const calculateTTL = (expiryDate) => {
    if (!expiryDate) {
        return undefined; // No TTL
    }
    const now = new Date();
    const diffInSeconds = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
    return diffInSeconds > 0 ? diffInSeconds : undefined;
};
/**
 * Create a share link
 */
const createShareLink = async (data) => {
    try {
        // Verify file exists and user owns it
        const file = await CosmosFileRepo_1.default.getFileById(data.fileId);
        if (!file) {
            throw new Error('File not found');
        }
        if (file.userId !== data.userId) {
            throw new Error('Unauthorized access to file');
        }
        if (file.status !== 'active') {
            throw new Error('Cannot share deleted file');
        }
        // Calculate expiry
        const expiryDate = calculateExpiryDate(data.expirationDays);
        const ttl = calculateTTL(expiryDate);
        // Create share link
        const shareLink = {
            linkId: (0, uuid_1.v4)(),
            fileId: data.fileId,
            userId: data.userId, // Store file owner
            expiryDate: expiryDate || new Date(), // Set to future date or current if never expires
            accessCount: 0,
            createdDate: new Date(),
            isRevoked: false,
            ttl,
        };
        const createdLink = await CosmosShareLinkRepo_1.default.createShareLink(shareLink);
        (0, AppInsightsService_1.trackEvent)('share_link_created', {
            userId: data.userId,
            fileId: data.fileId,
            linkId: createdLink.linkId,
        });
        return createdLink;
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'create_share_link',
            fileId: data.fileId,
            userId: data.userId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.createShareLink = createShareLink;
/**
 * Get file via share link and generate SAS URL for blob access
 */
const getFileByShareLink = async (linkId) => {
    try {
        const shareLink = await CosmosShareLinkRepo_1.default.getShareLinkById(linkId);
        if (!shareLink) {
            throw new Error('Share link not found');
        }
        // Check if link is valid
        if (!CosmosShareLinkRepo_1.default.isShareLinkValid(shareLink)) {
            throw new Error('Share link is expired or revoked');
        }
        // Get file
        const file = await CosmosFileRepo_1.default.getFileById(shareLink.fileId);
        if (!file || file.status !== 'active') {
            throw new Error('File not found or deleted');
        }
        // Extract blob name from blobUrl
        // blobUrl format: https://account.blob.core.windows.net/container/userId/fileId/fileName?sv=...&sig=...
        // Remove query parameters first, then extract path
        const urlWithoutQuery = file.blobUrl.split('?')[0];
        const blobUrlParts = urlWithoutQuery.split('/');
        // Get last 3 parts: userId/fileId/fileName (skip container name)
        const containerIndex = blobUrlParts.findIndex(part => part.includes('.blob.core.windows.net'));
        const blobName = blobUrlParts.slice(containerIndex + 2).join('/'); // Skip account and container
        // Generate SAS URL with expiration matching share link expiry or 24 hours, whichever is shorter
        const now = new Date();
        const expiryDate = new Date(shareLink.expiryDate);
        const hoursUntilExpiry = Math.max(1, Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
        const sasExpirationHours = Math.min(hoursUntilExpiry, 24); // Max 24 hours, or until share link expires
        const sasUrl = (0, BlobService_1.getBlobUrl)(blobName, sasExpirationHours);
        // Increment access count
        await CosmosShareLinkRepo_1.default.incrementAccessCount(linkId);
        (0, AppInsightsService_1.trackEvent)('share_link_accessed', {
            linkId,
            fileId: shareLink.fileId,
        });
        return {
            file,
            shareLink,
            downloadUrl: sasUrl,
        };
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'get_file_by_share_link',
            linkId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.getFileByShareLink = getFileByShareLink;
/**
 * Revoke a share link
 */
const revokeShareLink = async (linkId, userId) => {
    try {
        const shareLink = await CosmosShareLinkRepo_1.default.getShareLinkById(linkId);
        if (!shareLink) {
            throw new Error('Share link not found');
        }
        // Verify file ownership using userId stored in share link
        if (shareLink.userId !== userId) {
            throw new Error('Unauthorized access');
        }
        await CosmosShareLinkRepo_1.default.revokeShareLink(linkId);
        (0, AppInsightsService_1.trackEvent)('share_link_revoked', {
            userId,
            linkId,
            fileId: shareLink.fileId,
        });
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'revoke_share_link',
            linkId,
            userId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.revokeShareLink = revokeShareLink;
/**
 * Get all share links for a file
 */
const getShareLinksByFileId = async (fileId, userId) => {
    try {
        // Verify file exists and user owns it
        const file = await CosmosFileRepo_1.default.getFileById(fileId);
        if (!file) {
            throw new Error('File not found');
        }
        if (file.userId !== userId) {
            throw new Error('Unauthorized access to file');
        }
        const shareLinks = await CosmosShareLinkRepo_1.default.getShareLinksByFileId(fileId);
        (0, AppInsightsService_1.trackEvent)('share_links_listed', {
            userId,
            fileId,
            count: String(shareLinks.length),
        });
        return shareLinks;
    }
    catch (error) {
        (0, AppInsightsService_1.trackException)(error instanceof Error ? error : new Error(String(error)), {
            operation: 'get_share_links_by_file_id',
            fileId,
            userId,
        });
        jet_logger_1.default.err(error);
        throw error;
    }
};
exports.getShareLinksByFileId = getShareLinksByFileId;
/******************************************************************************
                            Export default
******************************************************************************/
exports.default = {
    createShareLink: exports.createShareLink,
    getFileByShareLink: exports.getFileByShareLink,
    revokeShareLink: exports.revokeShareLink,
    getShareLinksByFileId: exports.getShareLinksByFileId,
};
