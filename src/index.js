"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jet_logger_1 = __importDefault(require("jet-logger"));
const server_1 = __importDefault(require("./server"));
const CosmosService_1 = require("./services/azure/CosmosService");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
if (fs_1.default.existsSync('.env')) {
    dotenv_1.default.config();
}
// Azure App Service sets PORT automatically, but we use ENV.Port which handles it
// Convert to number to ensure it's not an object
const port = Number(process.env.PORT) || 3000;
const CONTAINER_NAMES = {
    USERS: 'Users',
    FILES: 'Files',
    SHARE_LINKS: 'ShareLinks',
};
/**
 * Initialize all Cosmos DB containers
 */
async function initializeContainers() {
    try {
        // Users container - partition key: userId
        await (0, CosmosService_1.getContainer)(CONTAINER_NAMES.USERS, '/userId');
        jet_logger_1.default.info(`Container '${CONTAINER_NAMES.USERS}' initialized`);
        // Files container - partition key: fileId
        await (0, CosmosService_1.getContainer)(CONTAINER_NAMES.FILES, '/fileId');
        jet_logger_1.default.info(`Container '${CONTAINER_NAMES.FILES}' initialized`);
        // ShareLinks container - partition key: linkId
        await (0, CosmosService_1.getContainer)(CONTAINER_NAMES.SHARE_LINKS, '/linkId');
        jet_logger_1.default.info(`Container '${CONTAINER_NAMES.SHARE_LINKS}' initialized`);
    }
    catch (error) {
        jet_logger_1.default.err(error);
        throw new Error('Failed to initialize Cosmos DB containers');
    }
}
// Initialize Cosmos DB containers
initializeContainers()
    .then(() => {
    // Start the server
    server_1.default.listen(port, (err) => {
        if (!!err) {
            jet_logger_1.default.err(err.message);
            throw new Error(`Failed to start server: ${err.message}`);
        }
        else {
            jet_logger_1.default.info(`Express server started on port: ${port}`);
            jet_logger_1.default.info('Server is ready to accept connections');
        }
    });
})
    .catch((error) => {
    if (error instanceof Error) {
        jet_logger_1.default.err(`Failed to initialize database: ${error.message}`);
        throw error;
    }
    else {
        const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
        jet_logger_1.default.err(`Failed to initialize database: ${errorMessage}`);
        throw new Error(errorMessage);
    }
});
