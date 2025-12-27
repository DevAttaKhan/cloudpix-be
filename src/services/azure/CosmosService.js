"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCosmosClient = exports.getContainer = exports.getDatabase = void 0;
const cosmos_1 = require("@azure/cosmos");
const jet_logger_1 = __importDefault(require("jet-logger"));
// Get connection details from environment variables
const getCosmosConfig = () => {
    const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING;
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_NAME || 'CloudPixDB';
    if (connectionString) {
        // Parse connection string if provided
        const parts = connectionString.split(';');
        const endpointPart = parts.find(p => p.startsWith('AccountEndpoint='));
        const keyPart = parts.find(p => p.startsWith('AccountKey='));
        if (endpointPart && keyPart) {
            return {
                endpoint: endpointPart.split('=')[1],
                key: keyPart.split('=')[1],
                databaseName,
            };
        }
    }
    if (!endpoint || !key) {
        throw new Error('Cosmos DB configuration missing. Provide either ' +
            'AZURE_COSMOS_CONNECTION_STRING or COSMOS_DB_ENDPOINT + COSMOS_DB_KEY');
    }
    return { endpoint, key, databaseName };
};
let config = null;
let client = null;
let databaseInstance = null;
/**
 * Get or initialize Cosmos client
 */
const getClient = () => {
    if (!client) {
        if (!config) {
            config = getCosmosConfig();
        }
        client = new cosmos_1.CosmosClient({
            endpoint: config.endpoint,
            key: config.key,
        });
    }
    return client;
};
/**
 * Get or create the database instance
 */
const getDatabase = async () => {
    if (databaseInstance) {
        return databaseInstance;
    }
    try {
        if (!config) {
            config = getCosmosConfig();
        }
        const cosmosClient = getClient();
        const { database } = await cosmosClient.databases.createIfNotExists({
            id: config.databaseName,
        });
        databaseInstance = database;
        jet_logger_1.default.info(`Cosmos DB database '${config.databaseName}' ready`);
        return database;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to connect to Cosmos DB');
    }
};
exports.getDatabase = getDatabase;
/**
 * Get or create a container
 */
const getContainer = async (containerId, partitionKey = '/id') => {
    const database = await (0, exports.getDatabase)();
    try {
        const { container } = await database.containers.createIfNotExists({
            id: containerId,
            partitionKey: {
                paths: [partitionKey],
            },
        });
        return container;
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error(`Failed to get container '${containerId}'`);
    }
};
exports.getContainer = getContainer;
/**
 * Get the Cosmos client instance
 */
const getCosmosClient = () => {
    return getClient();
};
exports.getCosmosClient = getCosmosClient;
exports.default = {
    getDatabase: exports.getDatabase,
    getContainer: exports.getContainer,
    getCosmosClient: exports.getCosmosClient,
};
