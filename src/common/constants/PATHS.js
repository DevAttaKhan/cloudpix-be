"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JET_PATHS = void 0;
const jet_paths_1 = __importDefault(require("jet-paths"));
const PATHS = {
    _: '/api',
    Users: {
        _: '/users',
        Get: '/all',
        Add: '/add',
        Update: '/update',
        Delete: '/delete/:id',
    },
};
exports.JET_PATHS = (0, jet_paths_1.default)(PATHS);
exports.default = PATHS;
