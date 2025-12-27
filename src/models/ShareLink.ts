import { isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, TParseOnError } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/util/validators';

/******************************************************************************
                                 Constants
******************************************************************************/

const DEFAULT_SHARE_LINK_VALS: IShareLink = {
  linkId: '',
  fileId: '',
  userId: '', // File owner
  expiryDate: new Date(),
  accessCount: 0,
  createdDate: new Date(),
  isRevoked: false,
} as const;

/******************************************************************************
                                 Types
******************************************************************************/

export interface IShareLink {
  linkId: string; // GUID, partition key
  fileId: string; // FK → Files.fileId
  userId: string; // File owner (FK → Users.userId)
  expiryDate: Date;
  accessCount: number;
  createdDate: Date;
  isRevoked: boolean;
  ttl?: any; // Time to live in seconds for Cosmos DB TTL
}

/******************************************************************************
                                 Setup
******************************************************************************/

// Initialize the "parseShareLink" function
const parseShareLink = parseObject<IShareLink>({
  linkId: isString,
  fileId: isString,
  userId: isString,
  expiryDate: transformIsDate,
  accessCount: isUnsignedInteger,
  createdDate: transformIsDate,
  isRevoked: (arg: any) => typeof arg === 'boolean',
  ttl: (arg: any): arg is number =>
    arg === undefined || typeof arg === 'number',
}) as any;

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New share link object.
 */
function __new__(shareLink?: Partial<IShareLink>): IShareLink {
  const defaults = { ...DEFAULT_SHARE_LINK_VALS };
  defaults.createdDate = new Date();
  defaults.isRevoked = false;
  defaults.accessCount = 0;
  return parseShareLink({ ...defaults, ...shareLink }, (errors) => {
    throw new Error(
      'Setup new share link failed ' + JSON.stringify(errors, null, 2),
    );
  }) as any;
}

/**
 * Check is a share link object. For the route validation.
 */
function test(arg: any, errCb?: TParseOnError): arg is IShareLink {
  return !!parseShareLink(arg, errCb);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: __new__,
  test,
} as const;
