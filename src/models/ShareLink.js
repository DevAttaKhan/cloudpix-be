"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jet_validators_1 = require("jet-validators");
const utils_1 = require("jet-validators/utils");
const validators_1 = require("@src/common/util/validators");
/******************************************************************************
                                 Constants
******************************************************************************/
const DEFAULT_SHARE_LINK_VALS = {
    linkId: '',
    fileId: '',
    userId: '', // File owner
    expiryDate: new Date(),
    accessCount: 0,
    createdDate: new Date(),
    isRevoked: false,
};
/******************************************************************************
                                 Setup
******************************************************************************/
// Initialize the "parseShareLink" function
const parseShareLink = (0, utils_1.parseObject)({
    linkId: jet_validators_1.isString,
    fileId: jet_validators_1.isString,
    userId: jet_validators_1.isString,
    expiryDate: validators_1.transformIsDate,
    accessCount: jet_validators_1.isUnsignedInteger,
    createdDate: validators_1.transformIsDate,
    isRevoked: (arg) => typeof arg === 'boolean',
    ttl: (arg) => arg === undefined || typeof arg === 'number',
});
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * New share link object.
 */
function __new__(shareLink) {
    const defaults = { ...DEFAULT_SHARE_LINK_VALS };
    defaults.createdDate = new Date();
    defaults.isRevoked = false;
    defaults.accessCount = 0;
    return parseShareLink({ ...defaults, ...shareLink }, (errors) => {
        throw new Error('Setup new share link failed ' + JSON.stringify(errors, null, 2));
    });
}
/**
 * Check is a share link object. For the route validation.
 */
function test(arg, errCb) {
    return !!parseShareLink(arg, errCb);
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    new: __new__,
    test,
};
