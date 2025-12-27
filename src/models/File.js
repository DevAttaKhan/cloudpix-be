"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jet_validators_1 = require("jet-validators");
const utils_1 = require("jet-validators/utils");
const validators_1 = require("@src/common/util/validators");
const DEFAULT_FILE_VALS = {
    fileId: '',
    userId: '',
    fileName: '',
    blobUrl: '',
    fileSize: 0,
    contentType: '',
    uploadDate: new Date(),
    status: 'active',
};
// Initialize the "parseFile" function
const parseFile = (0, utils_1.parseObject)({
    fileId: jet_validators_1.isString,
    userId: jet_validators_1.isString,
    fileName: jet_validators_1.isString,
    blobUrl: jet_validators_1.isString,
    fileSize: jet_validators_1.isUnsignedInteger,
    contentType: jet_validators_1.isString,
    uploadDate: validators_1.transformIsDate,
    status: (0, jet_validators_1.isValueOf)({ active: 'active', deleted: 'deleted' }),
});
/**
 * New file object.
 */
function __new__(file) {
    const defaults = { ...DEFAULT_FILE_VALS };
    defaults.uploadDate = new Date();
    defaults.status = 'active';
    const merged = { ...defaults, ...file };
    return parseFile(merged, (errors) => {
        throw new Error('Setup new file failed ' + JSON.stringify(errors, null, 2));
    });
}
/**
 * Check is a file object. For the route validation.
 */
function test(arg, errCb) {
    return !!parseFile(arg, errCb);
}
exports.default = {
    new: __new__,
    test,
};
