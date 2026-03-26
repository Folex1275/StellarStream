
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.StreamScalarFieldEnum = {
  id: 'id',
  streamId: 'streamId',
  txHash: 'txHash',
  sender: 'sender',
  receiver: 'receiver',
  tokenAddress: 'tokenAddress',
  amount: 'amount',
  duration: 'duration',
  status: 'status',
  withdrawn: 'withdrawn',
  legacy: 'legacy',
  migrated: 'migrated',
  isPrivate: 'isPrivate',
  createdAt: 'createdAt'
};

exports.Prisma.TokenPriceScalarFieldEnum = {
  tokenAddress: 'tokenAddress',
  symbol: 'symbol',
  decimals: 'decimals',
  priceUsd: 'priceUsd',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookScalarFieldEnum = {
  id: 'id',
  url: 'url',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SyncStateScalarFieldEnum = {
  id: 'id',
  lastLedgerSequence: 'lastLedgerSequence'
};

exports.Prisma.EventLogScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  streamId: 'streamId',
  txHash: 'txHash',
  eventIndex: 'eventIndex',
  ledger: 'ledger',
  ledgerClosedAt: 'ledgerClosedAt',
  sender: 'sender',
  receiver: 'receiver',
  amount: 'amount',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.StreamSnapshotScalarFieldEnum = {
  id: 'id',
  streamId: 'streamId',
  sender: 'sender',
  receiver: 'receiver',
  tokenAddress: 'tokenAddress',
  amountPerSecond: 'amountPerSecond',
  totalAmount: 'totalAmount',
  status: 'status',
  snapshotMonth: 'snapshotMonth',
  createdAt: 'createdAt'
};

exports.Prisma.StreamArchiveScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  streamId: 'streamId',
  txHash: 'txHash',
  ledger: 'ledger',
  ledgerClosedAt: 'ledgerClosedAt',
  sender: 'sender',
  receiver: 'receiver',
  amount: 'amount',
  metadata: 'metadata',
  createdAt: 'createdAt',
  archivedAt: 'archivedAt'
};

exports.Prisma.BridgeLogScalarFieldEnum = {
  id: 'id',
  bridge: 'bridge',
  eventType: 'eventType',
  sourceChain: 'sourceChain',
  targetChain: 'targetChain',
  sourceAsset: 'sourceAsset',
  targetAsset: 'targetAsset',
  amount: 'amount',
  sender: 'sender',
  recipient: 'recipient',
  txHash: 'txHash',
  status: 'status',
  payload: 'payload',
  landedAt: 'landedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ProposalScalarFieldEnum = {
  id: 'id',
  creator: 'creator',
  description: 'description',
  quorum: 'quorum',
  votesFor: 'votesFor',
  votesAgainst: 'votesAgainst',
  txHash: 'txHash',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  keyHash: 'keyHash',
  name: 'name',
  owner: 'owner',
  rateLimit: 'rateLimit',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastUsedAt: 'lastUsedAt'
};

exports.Prisma.LedgerHashScalarFieldEnum = {
  sequence: 'sequence',
  hash: 'hash',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationSubscriptionScalarFieldEnum = {
  id: 'id',
  stellarAddress: 'stellarAddress',
  platform: 'platform',
  webhookUrl: 'webhookUrl',
  chatId: 'chatId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssetConfigScalarFieldEnum = {
  id: 'id',
  assetId: 'assetId',
  symbol: 'symbol',
  name: 'name',
  decimals: 'decimals',
  isVerified: 'isVerified',
  isVisible: 'isVisible',
  yieldEnabled: 'yieldEnabled',
  iconUrl: 'iconUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.StreamStatus = exports.$Enums.StreamStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  ARCHIVED: 'ARCHIVED'
};

exports.NotificationPlatform = exports.$Enums.NotificationPlatform = {
  discord: 'discord',
  telegram: 'telegram'
};

exports.Prisma.ModelName = {
  Stream: 'Stream',
  TokenPrice: 'TokenPrice',
  Webhook: 'Webhook',
  SyncState: 'SyncState',
  EventLog: 'EventLog',
  StreamSnapshot: 'StreamSnapshot',
  StreamArchive: 'StreamArchive',
  BridgeLog: 'BridgeLog',
  Proposal: 'Proposal',
  ApiKey: 'ApiKey',
  LedgerHash: 'LedgerHash',
  NotificationSubscription: 'NotificationSubscription',
  AssetConfig: 'AssetConfig'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
