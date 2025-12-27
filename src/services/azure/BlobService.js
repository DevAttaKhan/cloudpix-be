"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blobExists = exports.getBlobUrl = exports.deleteBlob = exports.uploadBlob = exports.getBlobClient = exports.getContainerClient = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const jet_logger_1 = __importDefault(require("jet-logger"));
const getBlobConfig = () => {
    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING;
    const containerName = process.env.BLOB_CONTAINER_NAME || 'cloudpix-files';
    console.log({ connectionString, containerName });
    if (!connectionString) {
        throw new Error('AZURE_BLOB_CONNECTION_STRING environment variable is required');
    }
    return { connectionString, containerName };
};
let config = null;
let blobServiceClient = null;
let containerClientInstance = null;
let sharedKeyCredential = null;
/**
 * Get storage account name and key from connection string
 */
const getStorageCredentials = () => {
    if (!config) {
        config = getBlobConfig();
    }
    const connectionString = config.connectionString;
    const accountNameRegex = /AccountName=([^;]+)/;
    const accountKeyRegex = /AccountKey=([^;]+)/;
    const accountNameMatch = accountNameRegex.exec(connectionString);
    const accountKeyMatch = accountKeyRegex.exec(connectionString);
    if (!accountNameMatch || !accountKeyMatch) {
        throw new Error('Invalid connection string format');
    }
    return {
        accountName: accountNameMatch[1],
        accountKey: accountKeyMatch[1],
    };
};
/**
 * Get or initialize Shared Key Credential for SAS token generation
 */
const getSharedKeyCredential = () => {
    if (!sharedKeyCredential) {
        const credentials = getStorageCredentials();
        sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(credentials.accountName, credentials.accountKey);
    }
    return sharedKeyCredential;
};
/**
 * Get or initialize Blob Service client
 */
const getBlobServiceClient = () => {
    if (!blobServiceClient) {
        if (!config) {
            config = getBlobConfig();
        }
        blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(config.connectionString);
    }
    return blobServiceClient;
};
/**
 * Generate SAS token URL for a blob
 * @param blobName - Name of the blob
 * @param expiresInHours - Hours until SAS token expires (default: 1 year - maximum allowed by Azure)
 */
const generateBlobSASUrl = (blobName, expiresInHours = 24 * 365 // 1 year - maximum allowed by Azure Blob Storage
) => {
    try {
        if (!config) {
            config = getBlobConfig();
        }
        const credentials = getStorageCredentials();
        const credential = getSharedKeyCredential();
        // Generate SAS token with read permissions, valid for specified hours
        const expiresOn = new Date();
        expiresOn.setHours(expiresOn.getHours() + expiresInHours);
        const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)({
            containerName: config.containerName,
            blobName: blobName,
            permissions: storage_blob_1.BlobSASPermissions.parse('r'), // Read permission only
            expiresOn: expiresOn,
        }, credential).toString();
        // Construct the full URL with SAS token
        const blobUrl = `https://${credentials.accountName}.blob.core.windows.net/${config.containerName}/${blobName}`;
        return `${blobUrl}?${sasToken}`;
    }
    catch (error) {
        jet_logger_1.default.err('Error generating SAS token:', error);
        throw new Error('Failed to generate blob access URL');
    }
};
/**
 * Get or create the container client
 */
const getContainerClient = async () => {
    if (containerClientInstance) {
        return containerClientInstance;
    }
    try {
        if (!config) {
            config = getBlobConfig();
        }
        const serviceClient = getBlobServiceClient();
        const containerClient = serviceClient.getContainerClient(config.containerName);
        // Create container without public access (private by default)
        // If public access is needed, use SAS tokens or enable it in Azure Portal
        await containerClient.createIfNotExists();
        containerClientInstance = containerClient;
        jet_logger_1.default.info(`Blob Storage container '${config.containerName}' ready`);
        return containerClient;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to connect to Blob Storage');
    }
};
exports.getContainerClient = getContainerClient;
/**
 * Get a blob client for a specific file
 */
const getBlobClient = async (blobName) => {
    const containerClient = await (0, exports.getContainerClient)();
    return containerClient.getBlockBlobClient(blobName);
};
exports.getBlobClient = getBlobClient;
/**
 * Upload a file to blob storage
 */
const uploadBlob = async (blobName, content, contentType) => {
    try {
        const blobClient = await (0, exports.getBlobClient)(blobName);
        await blobClient.upload(content, content.length, {
            blobHTTPHeaders: {
                blobContentType: contentType,
            },
        });
        // Return the blob URL with SAS token for access (valid for 1 year - maximum allowed by Azure)
        // Azure Blob Storage SAS tokens can be valid for up to 1 year (365 days)
        return generateBlobSASUrl(blobName, 24 * 365);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error(`Failed to upload blob '${blobName}'`);
    }
};
exports.uploadBlob = uploadBlob;
/**
 * Delete a blob from storage
 */
const deleteBlob = async (blobName) => {
    try {
        const blobClient = await (0, exports.getBlobClient)(blobName);
        await blobClient.delete();
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error(`Failed to delete blob '${blobName}'`);
    }
};
exports.deleteBlob = deleteBlob;
/**
 * Get blob URL with SAS token for access
 * @param blobName - Name of the blob
 * @param expiresInHours - Hours until SAS token expires (default: 1 year - maximum allowed by Azure)
 */
const getBlobUrl = (blobName, expiresInHours = 24 * 365 // 1 year - maximum allowed by Azure Blob Storage
) => {
    return generateBlobSASUrl(blobName, expiresInHours);
};
exports.getBlobUrl = getBlobUrl;
/**
 * Check if a blob exists
 */
const blobExists = async (blobName) => {
    try {
        const blobClient = await (0, exports.getBlobClient)(blobName);
        return await blobClient.exists();
    }
    catch (error) {
        jet_logger_1.default.err(error);
        return false;
    }
};
exports.blobExists = blobExists;
exports.default = {
    getContainerClient: exports.getContainerClient,
    getBlobClient: exports.getBlobClient,
    uploadBlob: exports.uploadBlob,
    deleteBlob: exports.deleteBlob,
    getBlobUrl: exports.getBlobUrl,
    blobExists: exports.blobExists,
};
