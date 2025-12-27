"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformIsDate = void 0;
const jet_validators_1 = require("jet-validators");
const utils_1 = require("jet-validators/utils");
/**
 * Convert to date object then check is a validate date.
 */
exports.transformIsDate = (0, utils_1.transform)((arg) => new Date(arg), (arg) => (0, jet_validators_1.isDate)(arg));
