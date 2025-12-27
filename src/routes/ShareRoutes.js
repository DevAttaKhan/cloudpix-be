"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTP_STATUS_CODES_1 = __importDefault(require("@src/common/constants/HTTP_STATUS_CODES"));
const ShareLinkService_1 = __importDefault(require("@src/services/ShareLinkService"));
const auth_1 = require("@src/middleware/auth");
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * Create a share link for a file
 */
async function createShareLink(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const { id: fileId } = req.params;
        if (!fileId || typeof fileId !== 'string') {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'File ID is required',
            });
        }
        const { expirationDays } = req.body;
        const shareLink = await ShareLinkService_1.default.createShareLink({
            fileId,
            userId,
            expirationDays,
        });
        // Generate share URL (public URL that can be shared)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareUrl = `${frontendUrl}/share/${shareLink.linkId}`;
        res.status(HTTP_STATUS_CODES_1.default.Created).json({
            ...shareLink,
            shareUrl, // Include the shareable URL
        });
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : error.message.includes('Unauthorized')
                ? HTTP_STATUS_CODES_1.default.Unauthorized
                : HTTP_STATUS_CODES_1.default.BadRequest;
        res.status(status).json({
            error: error.message || 'Failed to create share link',
        });
    }
}
/**
 * Get file via share link
 */
async function getFileByShareLink(req, res) {
    try {
        const { linkId } = req.params;
        if (!linkId || typeof linkId !== 'string') {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'Link ID is required',
            });
        }
        const result = await ShareLinkService_1.default.getFileByShareLink(linkId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json(result);
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : error.message.includes('expired') || error.message.includes('revoked')
                ? HTTP_STATUS_CODES_1.default.Gone
                : HTTP_STATUS_CODES_1.default.BadRequest;
        res.status(status).json({
            error: error.message || 'Failed to access share link',
        });
    }
}
/**
 * Revoke a share link
 */
async function revokeShareLink(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const { linkId } = req.params;
        if (!linkId || typeof linkId !== 'string') {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'Link ID is required',
            });
        }
        await ShareLinkService_1.default.revokeShareLink(linkId, userId);
        res.status(HTTP_STATUS_CODES_1.default.Ok).json({ message: 'Share link revoked successfully' });
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : error.message.includes('Unauthorized')
                ? HTTP_STATUS_CODES_1.default.Unauthorized
                : HTTP_STATUS_CODES_1.default.BadRequest;
        res.status(status).json({
            error: error.message || 'Failed to revoke share link',
        });
    }
}
/**
 * Get all share links for a file
 */
async function getShareLinksByFileId(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(HTTP_STATUS_CODES_1.default.Unauthorized).json({
                error: 'User not authenticated',
            });
        }
        const { id: fileId } = req.params;
        if (!fileId || typeof fileId !== 'string') {
            return res.status(HTTP_STATUS_CODES_1.default.BadRequest).json({
                error: 'File ID is required',
            });
        }
        const shareLinks = await ShareLinkService_1.default.getShareLinksByFileId(fileId, userId);
        // Add share URLs to each link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareLinksWithUrls = shareLinks.map(link => ({
            ...link,
            shareUrl: `${frontendUrl}/share/${link.linkId}`,
        }));
        res.status(HTTP_STATUS_CODES_1.default.Ok).json({ shareLinks: shareLinksWithUrls });
    }
    catch (error) {
        const status = error.message.includes('not found')
            ? HTTP_STATUS_CODES_1.default.NotFound
            : error.message.includes('Unauthorized')
                ? HTTP_STATUS_CODES_1.default.Unauthorized
                : HTTP_STATUS_CODES_1.default.BadRequest;
        res.status(status).json({
            error: error.message || 'Failed to get share links',
        });
    }
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    create: [auth_1.authenticate, createShareLink],
    getByLinkId: getFileByShareLink,
    revoke: [auth_1.authenticate, revokeShareLink],
    getByFileId: [auth_1.authenticate, getShareLinksByFileId],
};
