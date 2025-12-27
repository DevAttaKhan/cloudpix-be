"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CosmosService_1 = require("../services/azure/CosmosService");
const jet_logger_1 = __importDefault(require("jet-logger"));
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
exports.default = initializeContainers;
