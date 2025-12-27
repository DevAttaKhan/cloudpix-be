"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jet_validators_1 = require("jet-validators");
const utils_1 = require("jet-validators/utils");
const validators_1 = require("@src/common/util/validators");
const DEFAULT_USER_VALS = {
    userId: '',
    email: '',
    passwordHash: '',
    createdDate: new Date(),
    lastLogin: undefined,
};
/******************************************************************************
                                  Setup
******************************************************************************/
// Initialize the "parseUser" function
const parseUser = (0, utils_1.parseObject)({
    userId: jet_validators_1.isString,
    email: jet_validators_1.isString,
    passwordHash: jet_validators_1.isString,
    createdDate: validators_1.transformIsDate,
    lastLogin: (arg) => arg === undefined || (0, validators_1.transformIsDate)(arg),
});
/******************************************************************************
                                 Functions
******************************************************************************/
/**
 * New user object.
 */
function __new__(user) {
    const defaults = { ...DEFAULT_USER_VALS };
    defaults.createdDate = new Date();
    return parseUser({ ...defaults, ...user }, (errors) => {
        throw new Error('Setup new user failed ' + JSON.stringify(errors, null, 2));
    });
}
/**
 * Check is a user object. For the route validation.
 */
function test(arg, errCb) {
    return !!parseUser(arg, errCb);
}
/******************************************************************************
                                Export default
******************************************************************************/
exports.default = {
    new: __new__,
    test,
};
