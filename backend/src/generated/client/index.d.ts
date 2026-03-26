
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Stream
 * 
 */
export type Stream = $Result.DefaultSelection<Prisma.$StreamPayload>
/**
 * Model TokenPrice
 * 
 */
export type TokenPrice = $Result.DefaultSelection<Prisma.$TokenPricePayload>
/**
 * Model Webhook
 * 
 */
export type Webhook = $Result.DefaultSelection<Prisma.$WebhookPayload>
/**
 * Model SyncState
 * 
 */
export type SyncState = $Result.DefaultSelection<Prisma.$SyncStatePayload>
/**
 * Model EventLog
 * 
 */
export type EventLog = $Result.DefaultSelection<Prisma.$EventLogPayload>
/**
 * Model StreamSnapshot
 * 
 */
export type StreamSnapshot = $Result.DefaultSelection<Prisma.$StreamSnapshotPayload>
/**
 * Model StreamArchive
 * 
 */
export type StreamArchive = $Result.DefaultSelection<Prisma.$StreamArchivePayload>
/**
 * Model BridgeLog
 * 
 */
export type BridgeLog = $Result.DefaultSelection<Prisma.$BridgeLogPayload>
/**
 * Model Proposal
 * 
 */
export type Proposal = $Result.DefaultSelection<Prisma.$ProposalPayload>
/**
 * Model ApiKey
 * 
 */
export type ApiKey = $Result.DefaultSelection<Prisma.$ApiKeyPayload>
/**
 * Model LedgerHash
 * 
 */
export type LedgerHash = $Result.DefaultSelection<Prisma.$LedgerHashPayload>
/**
 * Model NotificationSubscription
 * 
 */
export type NotificationSubscription = $Result.DefaultSelection<Prisma.$NotificationSubscriptionPayload>
/**
 * Model AssetConfig
 * 
 */
export type AssetConfig = $Result.DefaultSelection<Prisma.$AssetConfigPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const StreamStatus: {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  ARCHIVED: 'ARCHIVED'
};

export type StreamStatus = (typeof StreamStatus)[keyof typeof StreamStatus]


export const NotificationPlatform: {
  discord: 'discord',
  telegram: 'telegram'
};

export type NotificationPlatform = (typeof NotificationPlatform)[keyof typeof NotificationPlatform]

}

export type StreamStatus = $Enums.StreamStatus

export const StreamStatus: typeof $Enums.StreamStatus

export type NotificationPlatform = $Enums.NotificationPlatform

export const NotificationPlatform: typeof $Enums.NotificationPlatform

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Streams
 * const streams = await prisma.stream.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Streams
   * const streams = await prisma.stream.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.stream`: Exposes CRUD operations for the **Stream** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Streams
    * const streams = await prisma.stream.findMany()
    * ```
    */
  get stream(): Prisma.StreamDelegate<ExtArgs>;

  /**
   * `prisma.tokenPrice`: Exposes CRUD operations for the **TokenPrice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TokenPrices
    * const tokenPrices = await prisma.tokenPrice.findMany()
    * ```
    */
  get tokenPrice(): Prisma.TokenPriceDelegate<ExtArgs>;

  /**
   * `prisma.webhook`: Exposes CRUD operations for the **Webhook** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Webhooks
    * const webhooks = await prisma.webhook.findMany()
    * ```
    */
  get webhook(): Prisma.WebhookDelegate<ExtArgs>;

  /**
   * `prisma.syncState`: Exposes CRUD operations for the **SyncState** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SyncStates
    * const syncStates = await prisma.syncState.findMany()
    * ```
    */
  get syncState(): Prisma.SyncStateDelegate<ExtArgs>;

  /**
   * `prisma.eventLog`: Exposes CRUD operations for the **EventLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventLogs
    * const eventLogs = await prisma.eventLog.findMany()
    * ```
    */
  get eventLog(): Prisma.EventLogDelegate<ExtArgs>;

  /**
   * `prisma.streamSnapshot`: Exposes CRUD operations for the **StreamSnapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StreamSnapshots
    * const streamSnapshots = await prisma.streamSnapshot.findMany()
    * ```
    */
  get streamSnapshot(): Prisma.StreamSnapshotDelegate<ExtArgs>;

  /**
   * `prisma.streamArchive`: Exposes CRUD operations for the **StreamArchive** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StreamArchives
    * const streamArchives = await prisma.streamArchive.findMany()
    * ```
    */
  get streamArchive(): Prisma.StreamArchiveDelegate<ExtArgs>;

  /**
   * `prisma.bridgeLog`: Exposes CRUD operations for the **BridgeLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BridgeLogs
    * const bridgeLogs = await prisma.bridgeLog.findMany()
    * ```
    */
  get bridgeLog(): Prisma.BridgeLogDelegate<ExtArgs>;

  /**
   * `prisma.proposal`: Exposes CRUD operations for the **Proposal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Proposals
    * const proposals = await prisma.proposal.findMany()
    * ```
    */
  get proposal(): Prisma.ProposalDelegate<ExtArgs>;

  /**
   * `prisma.apiKey`: Exposes CRUD operations for the **ApiKey** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ApiKeys
    * const apiKeys = await prisma.apiKey.findMany()
    * ```
    */
  get apiKey(): Prisma.ApiKeyDelegate<ExtArgs>;

  /**
   * `prisma.ledgerHash`: Exposes CRUD operations for the **LedgerHash** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LedgerHashes
    * const ledgerHashes = await prisma.ledgerHash.findMany()
    * ```
    */
  get ledgerHash(): Prisma.LedgerHashDelegate<ExtArgs>;

  /**
   * `prisma.notificationSubscription`: Exposes CRUD operations for the **NotificationSubscription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NotificationSubscriptions
    * const notificationSubscriptions = await prisma.notificationSubscription.findMany()
    * ```
    */
  get notificationSubscription(): Prisma.NotificationSubscriptionDelegate<ExtArgs>;

  /**
   * `prisma.assetConfig`: Exposes CRUD operations for the **AssetConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AssetConfigs
    * const assetConfigs = await prisma.assetConfig.findMany()
    * ```
    */
  get assetConfig(): Prisma.AssetConfigDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
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

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "stream" | "tokenPrice" | "webhook" | "syncState" | "eventLog" | "streamSnapshot" | "streamArchive" | "bridgeLog" | "proposal" | "apiKey" | "ledgerHash" | "notificationSubscription"
      modelProps: "stream" | "contractEvent" | "tokenPrice" | "webhook" | "syncState" | "eventLog" | "streamSnapshot" | "streamArchive" | "bridgeLog" | "proposal" | "apiKey" | "ledgerHash" | "notificationSubscription" | "assetConfig"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Stream: {
        payload: Prisma.$StreamPayload<ExtArgs>
        fields: Prisma.StreamFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StreamFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StreamFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          findFirst: {
            args: Prisma.StreamFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StreamFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          findMany: {
            args: Prisma.StreamFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>[]
          }
          create: {
            args: Prisma.StreamCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          createMany: {
            args: Prisma.StreamCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StreamCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>[]
          }
          delete: {
            args: Prisma.StreamDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          update: {
            args: Prisma.StreamUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          deleteMany: {
            args: Prisma.StreamDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StreamUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StreamUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamPayload>
          }
          aggregate: {
            args: Prisma.StreamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStream>
          }
          groupBy: {
            args: Prisma.StreamGroupByArgs<ExtArgs>
            result: $Utils.Optional<StreamGroupByOutputType>[]
          }
          count: {
            args: Prisma.StreamCountArgs<ExtArgs>
            result: $Utils.Optional<StreamCountAggregateOutputType> | number
          }
        }
      }
      TokenPrice: {
        payload: Prisma.$TokenPricePayload<ExtArgs>
        fields: Prisma.TokenPriceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TokenPriceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TokenPriceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          findFirst: {
            args: Prisma.TokenPriceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TokenPriceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          findMany: {
            args: Prisma.TokenPriceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>[]
          }
          create: {
            args: Prisma.TokenPriceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          createMany: {
            args: Prisma.TokenPriceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TokenPriceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>[]
          }
          delete: {
            args: Prisma.TokenPriceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          update: {
            args: Prisma.TokenPriceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          deleteMany: {
            args: Prisma.TokenPriceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TokenPriceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TokenPriceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TokenPricePayload>
          }
          aggregate: {
            args: Prisma.TokenPriceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTokenPrice>
          }
          groupBy: {
            args: Prisma.TokenPriceGroupByArgs<ExtArgs>
            result: $Utils.Optional<TokenPriceGroupByOutputType>[]
          }
          count: {
            args: Prisma.TokenPriceCountArgs<ExtArgs>
            result: $Utils.Optional<TokenPriceCountAggregateOutputType> | number
          }
        }
      }
      Webhook: {
        payload: Prisma.$WebhookPayload<ExtArgs>
        fields: Prisma.WebhookFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebhookFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebhookFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          findFirst: {
            args: Prisma.WebhookFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebhookFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          findMany: {
            args: Prisma.WebhookFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>[]
          }
          create: {
            args: Prisma.WebhookCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          createMany: {
            args: Prisma.WebhookCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebhookCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>[]
          }
          delete: {
            args: Prisma.WebhookDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          update: {
            args: Prisma.WebhookUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          deleteMany: {
            args: Prisma.WebhookDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebhookUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WebhookUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookPayload>
          }
          aggregate: {
            args: Prisma.WebhookAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebhook>
          }
          groupBy: {
            args: Prisma.WebhookGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebhookGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebhookCountArgs<ExtArgs>
            result: $Utils.Optional<WebhookCountAggregateOutputType> | number
          }
        }
      }
      SyncState: {
        payload: Prisma.$SyncStatePayload<ExtArgs>
        fields: Prisma.SyncStateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SyncStateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SyncStateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          findFirst: {
            args: Prisma.SyncStateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SyncStateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          findMany: {
            args: Prisma.SyncStateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>[]
          }
          create: {
            args: Prisma.SyncStateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          createMany: {
            args: Prisma.SyncStateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SyncStateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>[]
          }
          delete: {
            args: Prisma.SyncStateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          update: {
            args: Prisma.SyncStateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          deleteMany: {
            args: Prisma.SyncStateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SyncStateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SyncStateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncStatePayload>
          }
          aggregate: {
            args: Prisma.SyncStateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSyncState>
          }
          groupBy: {
            args: Prisma.SyncStateGroupByArgs<ExtArgs>
            result: $Utils.Optional<SyncStateGroupByOutputType>[]
          }
          count: {
            args: Prisma.SyncStateCountArgs<ExtArgs>
            result: $Utils.Optional<SyncStateCountAggregateOutputType> | number
          }
        }
      }
      EventLog: {
        payload: Prisma.$EventLogPayload<ExtArgs>
        fields: Prisma.EventLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findFirst: {
            args: Prisma.EventLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          findMany: {
            args: Prisma.EventLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          create: {
            args: Prisma.EventLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          createMany: {
            args: Prisma.EventLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>[]
          }
          delete: {
            args: Prisma.EventLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          update: {
            args: Prisma.EventLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          deleteMany: {
            args: Prisma.EventLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EventLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventLogPayload>
          }
          aggregate: {
            args: Prisma.EventLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventLog>
          }
          groupBy: {
            args: Prisma.EventLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventLogCountArgs<ExtArgs>
            result: $Utils.Optional<EventLogCountAggregateOutputType> | number
          }
        }
      }
      StreamSnapshot: {
        payload: Prisma.$StreamSnapshotPayload<ExtArgs>
        fields: Prisma.StreamSnapshotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StreamSnapshotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StreamSnapshotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          findFirst: {
            args: Prisma.StreamSnapshotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StreamSnapshotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          findMany: {
            args: Prisma.StreamSnapshotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>[]
          }
          create: {
            args: Prisma.StreamSnapshotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          createMany: {
            args: Prisma.StreamSnapshotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StreamSnapshotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>[]
          }
          delete: {
            args: Prisma.StreamSnapshotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          update: {
            args: Prisma.StreamSnapshotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          deleteMany: {
            args: Prisma.StreamSnapshotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StreamSnapshotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StreamSnapshotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamSnapshotPayload>
          }
          aggregate: {
            args: Prisma.StreamSnapshotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStreamSnapshot>
          }
          groupBy: {
            args: Prisma.StreamSnapshotGroupByArgs<ExtArgs>
            result: $Utils.Optional<StreamSnapshotGroupByOutputType>[]
          }
          count: {
            args: Prisma.StreamSnapshotCountArgs<ExtArgs>
            result: $Utils.Optional<StreamSnapshotCountAggregateOutputType> | number
          }
        }
      }
      StreamArchive: {
        payload: Prisma.$StreamArchivePayload<ExtArgs>
        fields: Prisma.StreamArchiveFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StreamArchiveFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StreamArchiveFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          findFirst: {
            args: Prisma.StreamArchiveFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StreamArchiveFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          findMany: {
            args: Prisma.StreamArchiveFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>[]
          }
          create: {
            args: Prisma.StreamArchiveCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          createMany: {
            args: Prisma.StreamArchiveCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StreamArchiveCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>[]
          }
          delete: {
            args: Prisma.StreamArchiveDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          update: {
            args: Prisma.StreamArchiveUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          deleteMany: {
            args: Prisma.StreamArchiveDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StreamArchiveUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.StreamArchiveUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StreamArchivePayload>
          }
          aggregate: {
            args: Prisma.StreamArchiveAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStreamArchive>
          }
          groupBy: {
            args: Prisma.StreamArchiveGroupByArgs<ExtArgs>
            result: $Utils.Optional<StreamArchiveGroupByOutputType>[]
          }
          count: {
            args: Prisma.StreamArchiveCountArgs<ExtArgs>
            result: $Utils.Optional<StreamArchiveCountAggregateOutputType> | number
          }
        }
      }
      BridgeLog: {
        payload: Prisma.$BridgeLogPayload<ExtArgs>
        fields: Prisma.BridgeLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BridgeLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BridgeLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          findFirst: {
            args: Prisma.BridgeLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BridgeLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          findMany: {
            args: Prisma.BridgeLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>[]
          }
          create: {
            args: Prisma.BridgeLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          createMany: {
            args: Prisma.BridgeLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BridgeLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>[]
          }
          delete: {
            args: Prisma.BridgeLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          update: {
            args: Prisma.BridgeLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          deleteMany: {
            args: Prisma.BridgeLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BridgeLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BridgeLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BridgeLogPayload>
          }
          aggregate: {
            args: Prisma.BridgeLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBridgeLog>
          }
          groupBy: {
            args: Prisma.BridgeLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<BridgeLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.BridgeLogCountArgs<ExtArgs>
            result: $Utils.Optional<BridgeLogCountAggregateOutputType> | number
          }
        }
      }
      Proposal: {
        payload: Prisma.$ProposalPayload<ExtArgs>
        fields: Prisma.ProposalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProposalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProposalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          findFirst: {
            args: Prisma.ProposalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProposalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          findMany: {
            args: Prisma.ProposalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>[]
          }
          create: {
            args: Prisma.ProposalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          createMany: {
            args: Prisma.ProposalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProposalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>[]
          }
          delete: {
            args: Prisma.ProposalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          update: {
            args: Prisma.ProposalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          deleteMany: {
            args: Prisma.ProposalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProposalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ProposalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProposalPayload>
          }
          aggregate: {
            args: Prisma.ProposalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProposal>
          }
          groupBy: {
            args: Prisma.ProposalGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProposalGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProposalCountArgs<ExtArgs>
            result: $Utils.Optional<ProposalCountAggregateOutputType> | number
          }
        }
      }
      ApiKey: {
        payload: Prisma.$ApiKeyPayload<ExtArgs>
        fields: Prisma.ApiKeyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ApiKeyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ApiKeyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          findFirst: {
            args: Prisma.ApiKeyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ApiKeyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          findMany: {
            args: Prisma.ApiKeyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>[]
          }
          create: {
            args: Prisma.ApiKeyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          createMany: {
            args: Prisma.ApiKeyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ApiKeyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>[]
          }
          delete: {
            args: Prisma.ApiKeyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          update: {
            args: Prisma.ApiKeyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          deleteMany: {
            args: Prisma.ApiKeyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ApiKeyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ApiKeyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiKeyPayload>
          }
          aggregate: {
            args: Prisma.ApiKeyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApiKey>
          }
          groupBy: {
            args: Prisma.ApiKeyGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApiKeyGroupByOutputType>[]
          }
          count: {
            args: Prisma.ApiKeyCountArgs<ExtArgs>
            result: $Utils.Optional<ApiKeyCountAggregateOutputType> | number
          }
        }
      }
      LedgerHash: {
        payload: Prisma.$LedgerHashPayload<ExtArgs>
        fields: Prisma.LedgerHashFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LedgerHashFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LedgerHashFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          findFirst: {
            args: Prisma.LedgerHashFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LedgerHashFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          findMany: {
            args: Prisma.LedgerHashFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>[]
          }
          create: {
            args: Prisma.LedgerHashCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          createMany: {
            args: Prisma.LedgerHashCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LedgerHashCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>[]
          }
          delete: {
            args: Prisma.LedgerHashDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          update: {
            args: Prisma.LedgerHashUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          deleteMany: {
            args: Prisma.LedgerHashDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LedgerHashUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LedgerHashUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LedgerHashPayload>
          }
          aggregate: {
            args: Prisma.LedgerHashAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLedgerHash>
          }
          groupBy: {
            args: Prisma.LedgerHashGroupByArgs<ExtArgs>
            result: $Utils.Optional<LedgerHashGroupByOutputType>[]
          }
          count: {
            args: Prisma.LedgerHashCountArgs<ExtArgs>
            result: $Utils.Optional<LedgerHashCountAggregateOutputType> | number
          }
        }
      }
      NotificationSubscription: {
        payload: Prisma.$NotificationSubscriptionPayload<ExtArgs>
        fields: Prisma.NotificationSubscriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationSubscriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationSubscriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          findFirst: {
            args: Prisma.NotificationSubscriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationSubscriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          findMany: {
            args: Prisma.NotificationSubscriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>[]
          }
          create: {
            args: Prisma.NotificationSubscriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          createMany: {
            args: Prisma.NotificationSubscriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationSubscriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>[]
          }
          delete: {
            args: Prisma.NotificationSubscriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          update: {
            args: Prisma.NotificationSubscriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          deleteMany: {
            args: Prisma.NotificationSubscriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationSubscriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationSubscriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSubscriptionPayload>
          }
          aggregate: {
            args: Prisma.NotificationSubscriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotificationSubscription>
          }
          groupBy: {
            args: Prisma.NotificationSubscriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationSubscriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationSubscriptionCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationSubscriptionCountAggregateOutputType> | number
          }
        }
      }
      AssetConfig: {
        payload: Prisma.$AssetConfigPayload<ExtArgs>
        fields: Prisma.AssetConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AssetConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AssetConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          findFirst: {
            args: Prisma.AssetConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AssetConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          findMany: {
            args: Prisma.AssetConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>[]
          }
          create: {
            args: Prisma.AssetConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          createMany: {
            args: Prisma.AssetConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AssetConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>[]
          }
          delete: {
            args: Prisma.AssetConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          update: {
            args: Prisma.AssetConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          deleteMany: {
            args: Prisma.AssetConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AssetConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AssetConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AssetConfigPayload>
          }
          aggregate: {
            args: Prisma.AssetConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAssetConfig>
          }
          groupBy: {
            args: Prisma.AssetConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<AssetConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.AssetConfigCountArgs<ExtArgs>
            result: $Utils.Optional<AssetConfigCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Stream
   */

  export type AggregateStream = {
    _count: StreamCountAggregateOutputType | null
    _avg: StreamAvgAggregateOutputType | null
    _sum: StreamSumAggregateOutputType | null
    _min: StreamMinAggregateOutputType | null
    _max: StreamMaxAggregateOutputType | null
  }

  export type StreamAvgAggregateOutputType = {
    duration: number | null
  }

  export type StreamSumAggregateOutputType = {
    duration: number | null
  }

  export type StreamMinAggregateOutputType = {
    id: string | null
    streamId: string | null
    txHash: string | null
    sender: string | null
    receiver: string | null
    tokenAddress: string | null
    amount: string | null
    duration: number | null
    status: $Enums.StreamStatus | null
    withdrawn: string | null
    legacy: boolean | null
    migrated: boolean | null
    isPrivate: boolean | null
    createdAt: Date | null
  }

  export type StreamMaxAggregateOutputType = {
    id: string | null
    streamId: string | null
    txHash: string | null
    sender: string | null
    receiver: string | null
    tokenAddress: string | null
    amount: string | null
    duration: number | null
    status: $Enums.StreamStatus | null
    withdrawn: string | null
    legacy: boolean | null
    migrated: boolean | null
    isPrivate: boolean | null
    createdAt: Date | null
  }

  export type StreamCountAggregateOutputType = {
    id: number
    streamId: number
    txHash: number
    sender: number
    receiver: number
    tokenAddress: number
    amount: number
    duration: number
    status: number
    withdrawn: number
    legacy: number
    migrated: number
    isPrivate: number
    createdAt: number
    _all: number
  }


  export type StreamAvgAggregateInputType = {
    duration?: true
  }

  export type StreamSumAggregateInputType = {
    duration?: true
  }

  export type StreamMinAggregateInputType = {
    id?: true
    streamId?: true
    txHash?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amount?: true
    duration?: true
    status?: true
    withdrawn?: true
    legacy?: true
    migrated?: true
    isPrivate?: true
    createdAt?: true
  }

  export type StreamMaxAggregateInputType = {
    id?: true
    streamId?: true
    txHash?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amount?: true
    duration?: true
    status?: true
    withdrawn?: true
    legacy?: true
    migrated?: true
    isPrivate?: true
    createdAt?: true
  }

  export type StreamCountAggregateInputType = {
    id?: true
    streamId?: true
    txHash?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amount?: true
    duration?: true
    status?: true
    withdrawn?: true
    legacy?: true
    migrated?: true
    isPrivate?: true
    createdAt?: true
    _all?: true
  }

  export type StreamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Stream to aggregate.
     */
    where?: StreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Streams to fetch.
     */
    orderBy?: StreamOrderByWithRelationInput | StreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Streams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Streams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Streams
    **/
    _count?: true | StreamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StreamAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StreamSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StreamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StreamMaxAggregateInputType
  }

  export type GetStreamAggregateType<T extends StreamAggregateArgs> = {
        [P in keyof T & keyof AggregateStream]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStream[P]>
      : GetScalarType<T[P], AggregateStream[P]>
  }




  export type StreamGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StreamWhereInput
    orderBy?: StreamOrderByWithAggregationInput | StreamOrderByWithAggregationInput[]
    by: StreamScalarFieldEnum[] | StreamScalarFieldEnum
    having?: StreamScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StreamCountAggregateInputType | true
    _avg?: StreamAvgAggregateInputType
    _sum?: StreamSumAggregateInputType
    _min?: StreamMinAggregateInputType
    _max?: StreamMaxAggregateInputType
  }

  export type StreamGroupByOutputType = {
    id: string
    streamId: string | null
    txHash: string
    sender: string
    receiver: string
    tokenAddress: string | null
    amount: string
    duration: number | null
    status: $Enums.StreamStatus
    withdrawn: string | null
    legacy: boolean
    migrated: boolean
    isPrivate: boolean
    createdAt: Date
    _count: StreamCountAggregateOutputType | null
    _avg: StreamAvgAggregateOutputType | null
    _sum: StreamSumAggregateOutputType | null
    _min: StreamMinAggregateOutputType | null
    _max: StreamMaxAggregateOutputType | null
  }

  type GetStreamGroupByPayload<T extends StreamGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StreamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StreamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StreamGroupByOutputType[P]>
            : GetScalarType<T[P], StreamGroupByOutputType[P]>
        }
      >
    >


  export type StreamSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    streamId?: boolean
    txHash?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amount?: boolean
    duration?: boolean
    status?: boolean
    withdrawn?: boolean
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["stream"]>

  export type StreamSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    streamId?: boolean
    txHash?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amount?: boolean
    duration?: boolean
    status?: boolean
    withdrawn?: boolean
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["stream"]>

  export type StreamSelectScalar = {
    id?: boolean
    streamId?: boolean
    txHash?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amount?: boolean
    duration?: boolean
    status?: boolean
    withdrawn?: boolean
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: boolean
  }


  export type $StreamPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Stream"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      streamId: string | null
      txHash: string
      sender: string
      receiver: string
      tokenAddress: string | null
      amount: string
      duration: number | null
      status: $Enums.StreamStatus
      withdrawn: string | null
      legacy: boolean
      migrated: boolean
      isPrivate: boolean
      createdAt: Date
    }, ExtArgs["result"]["stream"]>
    composites: {}
  }

  type StreamGetPayload<S extends boolean | null | undefined | StreamDefaultArgs> = $Result.GetResult<Prisma.$StreamPayload, S>

  type StreamCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StreamFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StreamCountAggregateInputType | true
    }

  export interface StreamDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Stream'], meta: { name: 'Stream' } }
    /**
     * Find zero or one Stream that matches the filter.
     * @param {StreamFindUniqueArgs} args - Arguments to find a Stream
     * @example
     * // Get one Stream
     * const stream = await prisma.stream.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StreamFindUniqueArgs>(args: SelectSubset<T, StreamFindUniqueArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Stream that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StreamFindUniqueOrThrowArgs} args - Arguments to find a Stream
     * @example
     * // Get one Stream
     * const stream = await prisma.stream.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StreamFindUniqueOrThrowArgs>(args: SelectSubset<T, StreamFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Stream that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamFindFirstArgs} args - Arguments to find a Stream
     * @example
     * // Get one Stream
     * const stream = await prisma.stream.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StreamFindFirstArgs>(args?: SelectSubset<T, StreamFindFirstArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Stream that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamFindFirstOrThrowArgs} args - Arguments to find a Stream
     * @example
     * // Get one Stream
     * const stream = await prisma.stream.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StreamFindFirstOrThrowArgs>(args?: SelectSubset<T, StreamFindFirstOrThrowArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Streams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Streams
     * const streams = await prisma.stream.findMany()
     * 
     * // Get first 10 Streams
     * const streams = await prisma.stream.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const streamWithIdOnly = await prisma.stream.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StreamFindManyArgs>(args?: SelectSubset<T, StreamFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Stream.
     * @param {StreamCreateArgs} args - Arguments to create a Stream.
     * @example
     * // Create one Stream
     * const Stream = await prisma.stream.create({
     *   data: {
     *     // ... data to create a Stream
     *   }
     * })
     * 
     */
    create<T extends StreamCreateArgs>(args: SelectSubset<T, StreamCreateArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Streams.
     * @param {StreamCreateManyArgs} args - Arguments to create many Streams.
     * @example
     * // Create many Streams
     * const stream = await prisma.stream.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StreamCreateManyArgs>(args?: SelectSubset<T, StreamCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Streams and returns the data saved in the database.
     * @param {StreamCreateManyAndReturnArgs} args - Arguments to create many Streams.
     * @example
     * // Create many Streams
     * const stream = await prisma.stream.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Streams and only return the `id`
     * const streamWithIdOnly = await prisma.stream.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StreamCreateManyAndReturnArgs>(args?: SelectSubset<T, StreamCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Stream.
     * @param {StreamDeleteArgs} args - Arguments to delete one Stream.
     * @example
     * // Delete one Stream
     * const Stream = await prisma.stream.delete({
     *   where: {
     *     // ... filter to delete one Stream
     *   }
     * })
     * 
     */
    delete<T extends StreamDeleteArgs>(args: SelectSubset<T, StreamDeleteArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Stream.
     * @param {StreamUpdateArgs} args - Arguments to update one Stream.
     * @example
     * // Update one Stream
     * const stream = await prisma.stream.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StreamUpdateArgs>(args: SelectSubset<T, StreamUpdateArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Streams.
     * @param {StreamDeleteManyArgs} args - Arguments to filter Streams to delete.
     * @example
     * // Delete a few Streams
     * const { count } = await prisma.stream.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StreamDeleteManyArgs>(args?: SelectSubset<T, StreamDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Streams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Streams
     * const stream = await prisma.stream.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StreamUpdateManyArgs>(args: SelectSubset<T, StreamUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Stream.
     * @param {StreamUpsertArgs} args - Arguments to update or create a Stream.
     * @example
     * // Update or create a Stream
     * const stream = await prisma.stream.upsert({
     *   create: {
     *     // ... data to create a Stream
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Stream we want to update
     *   }
     * })
     */
    upsert<T extends StreamUpsertArgs>(args: SelectSubset<T, StreamUpsertArgs<ExtArgs>>): Prisma__StreamClient<$Result.GetResult<Prisma.$StreamPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Streams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamCountArgs} args - Arguments to filter Streams to count.
     * @example
     * // Count the number of Streams
     * const count = await prisma.stream.count({
     *   where: {
     *     // ... the filter for the Streams we want to count
     *   }
     * })
    **/
    count<T extends StreamCountArgs>(
      args?: Subset<T, StreamCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StreamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Stream.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StreamAggregateArgs>(args: Subset<T, StreamAggregateArgs>): Prisma.PrismaPromise<GetStreamAggregateType<T>>

    /**
     * Group by Stream.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StreamGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StreamGroupByArgs['orderBy'] }
        : { orderBy?: StreamGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StreamGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStreamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Stream model
   */
  readonly fields: StreamFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Stream.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StreamClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Stream model
   */ 
  interface StreamFieldRefs {
    readonly id: FieldRef<"Stream", 'String'>
    readonly streamId: FieldRef<"Stream", 'String'>
    readonly txHash: FieldRef<"Stream", 'String'>
    readonly sender: FieldRef<"Stream", 'String'>
    readonly receiver: FieldRef<"Stream", 'String'>
    readonly tokenAddress: FieldRef<"Stream", 'String'>
    readonly amount: FieldRef<"Stream", 'String'>
    readonly duration: FieldRef<"Stream", 'Int'>
    readonly status: FieldRef<"Stream", 'StreamStatus'>
    readonly withdrawn: FieldRef<"Stream", 'String'>
    readonly legacy: FieldRef<"Stream", 'Boolean'>
    readonly migrated: FieldRef<"Stream", 'Boolean'>
    readonly isPrivate: FieldRef<"Stream", 'Boolean'>
    readonly createdAt: FieldRef<"Stream", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Stream findUnique
   */
  export type StreamFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter, which Stream to fetch.
     */
    where: StreamWhereUniqueInput
  }

  /**
   * Stream findUniqueOrThrow
   */
  export type StreamFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter, which Stream to fetch.
     */
    where: StreamWhereUniqueInput
  }

  /**
   * Stream findFirst
   */
  export type StreamFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter, which Stream to fetch.
     */
    where?: StreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Streams to fetch.
     */
    orderBy?: StreamOrderByWithRelationInput | StreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Streams.
     */
    cursor?: StreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Streams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Streams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Streams.
     */
    distinct?: StreamScalarFieldEnum | StreamScalarFieldEnum[]
  }

  /**
   * Stream findFirstOrThrow
   */
  export type StreamFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter, which Stream to fetch.
     */
    where?: StreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Streams to fetch.
     */
    orderBy?: StreamOrderByWithRelationInput | StreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Streams.
     */
    cursor?: StreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Streams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Streams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Streams.
     */
    distinct?: StreamScalarFieldEnum | StreamScalarFieldEnum[]
  }

  /**
   * Stream findMany
   */
  export type StreamFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter, which Streams to fetch.
     */
    where?: StreamWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Streams to fetch.
     */
    orderBy?: StreamOrderByWithRelationInput | StreamOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Streams.
     */
    cursor?: StreamWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Streams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Streams.
     */
    skip?: number
    distinct?: StreamScalarFieldEnum | StreamScalarFieldEnum[]
  }

  /**
   * Stream create
   */
  export type StreamCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * The data needed to create a Stream.
     */
    data: XOR<StreamCreateInput, StreamUncheckedCreateInput>
  }

  /**
   * Stream createMany
   */
  export type StreamCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Streams.
     */
    data: StreamCreateManyInput | StreamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Stream createManyAndReturn
   */
  export type StreamCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Streams.
     */
    data: StreamCreateManyInput | StreamCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Stream update
   */
  export type StreamUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * The data needed to update a Stream.
     */
    data: XOR<StreamUpdateInput, StreamUncheckedUpdateInput>
    /**
     * Choose, which Stream to update.
     */
    where: StreamWhereUniqueInput
  }

  /**
   * Stream updateMany
   */
  export type StreamUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Streams.
     */
    data: XOR<StreamUpdateManyMutationInput, StreamUncheckedUpdateManyInput>
    /**
     * Filter which Streams to update
     */
    where?: StreamWhereInput
  }

  /**
   * Stream upsert
   */
  export type StreamUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * The filter to search for the Stream to update in case it exists.
     */
    where: StreamWhereUniqueInput
    /**
     * In case the Stream found by the `where` argument doesn't exist, create a new Stream with this data.
     */
    create: XOR<StreamCreateInput, StreamUncheckedCreateInput>
    /**
     * In case the Stream was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StreamUpdateInput, StreamUncheckedUpdateInput>
  }

  /**
   * Stream delete
   */
  export type StreamDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
    /**
     * Filter which Stream to delete.
     */
    where: StreamWhereUniqueInput
  }

  /**
   * Stream deleteMany
   */
  export type StreamDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Streams to delete
     */
    where?: StreamWhereInput
  }

  /**
   * Stream without action
   */
  export type StreamDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Stream
     */
    select?: StreamSelect<ExtArgs> | null
  }


  /**
   * Model TokenPrice
   */

  export type AggregateTokenPrice = {
    _count: TokenPriceCountAggregateOutputType | null
    _avg: TokenPriceAvgAggregateOutputType | null
    _sum: TokenPriceSumAggregateOutputType | null
    _min: TokenPriceMinAggregateOutputType | null
    _max: TokenPriceMaxAggregateOutputType | null
  }

  export type TokenPriceAvgAggregateOutputType = {
    decimals: number | null
    priceUsd: number | null
  }

  export type TokenPriceSumAggregateOutputType = {
    decimals: number | null
    priceUsd: number | null
  }

  export type TokenPriceMinAggregateOutputType = {
    tokenAddress: string | null
    symbol: string | null
    decimals: number | null
    priceUsd: number | null
    updatedAt: Date | null
  }

  export type TokenPriceMaxAggregateOutputType = {
    tokenAddress: string | null
    symbol: string | null
    decimals: number | null
    priceUsd: number | null
    updatedAt: Date | null
  }

  export type TokenPriceCountAggregateOutputType = {
    tokenAddress: number
    symbol: number
    decimals: number
    priceUsd: number
    updatedAt: number
    _all: number
  }


  export type TokenPriceAvgAggregateInputType = {
    decimals?: true
    priceUsd?: true
  }

  export type TokenPriceSumAggregateInputType = {
    decimals?: true
    priceUsd?: true
  }

  export type TokenPriceMinAggregateInputType = {
    tokenAddress?: true
    symbol?: true
    decimals?: true
    priceUsd?: true
    updatedAt?: true
  }

  export type TokenPriceMaxAggregateInputType = {
    tokenAddress?: true
    symbol?: true
    decimals?: true
    priceUsd?: true
    updatedAt?: true
  }

  export type TokenPriceCountAggregateInputType = {
    tokenAddress?: true
    symbol?: true
    decimals?: true
    priceUsd?: true
    updatedAt?: true
    _all?: true
  }

  export type TokenPriceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TokenPrice to aggregate.
     */
    where?: TokenPriceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TokenPrices to fetch.
     */
    orderBy?: TokenPriceOrderByWithRelationInput | TokenPriceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TokenPriceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TokenPrices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TokenPrices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TokenPrices
    **/
    _count?: true | TokenPriceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TokenPriceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TokenPriceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TokenPriceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TokenPriceMaxAggregateInputType
  }

  export type GetTokenPriceAggregateType<T extends TokenPriceAggregateArgs> = {
        [P in keyof T & keyof AggregateTokenPrice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTokenPrice[P]>
      : GetScalarType<T[P], AggregateTokenPrice[P]>
  }




  export type TokenPriceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TokenPriceWhereInput
    orderBy?: TokenPriceOrderByWithAggregationInput | TokenPriceOrderByWithAggregationInput[]
    by: TokenPriceScalarFieldEnum[] | TokenPriceScalarFieldEnum
    having?: TokenPriceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TokenPriceCountAggregateInputType | true
    _avg?: TokenPriceAvgAggregateInputType
    _sum?: TokenPriceSumAggregateInputType
    _min?: TokenPriceMinAggregateInputType
    _max?: TokenPriceMaxAggregateInputType
  }

  export type TokenPriceGroupByOutputType = {
    tokenAddress: string
    symbol: string
    decimals: number
    priceUsd: number
    updatedAt: Date
    _count: TokenPriceCountAggregateOutputType | null
    _avg: TokenPriceAvgAggregateOutputType | null
    _sum: TokenPriceSumAggregateOutputType | null
    _min: TokenPriceMinAggregateOutputType | null
    _max: TokenPriceMaxAggregateOutputType | null
  }

  type GetTokenPriceGroupByPayload<T extends TokenPriceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TokenPriceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TokenPriceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TokenPriceGroupByOutputType[P]>
            : GetScalarType<T[P], TokenPriceGroupByOutputType[P]>
        }
      >
    >


  export type TokenPriceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tokenAddress?: boolean
    symbol?: boolean
    decimals?: boolean
    priceUsd?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tokenPrice"]>

  export type TokenPriceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tokenAddress?: boolean
    symbol?: boolean
    decimals?: boolean
    priceUsd?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tokenPrice"]>

  export type TokenPriceSelectScalar = {
    tokenAddress?: boolean
    symbol?: boolean
    decimals?: boolean
    priceUsd?: boolean
    updatedAt?: boolean
  }


  export type $TokenPricePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TokenPrice"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tokenAddress: string
      symbol: string
      decimals: number
      priceUsd: number
      updatedAt: Date
    }, ExtArgs["result"]["tokenPrice"]>
    composites: {}
  }

  type TokenPriceGetPayload<S extends boolean | null | undefined | TokenPriceDefaultArgs> = $Result.GetResult<Prisma.$TokenPricePayload, S>

  type TokenPriceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TokenPriceFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TokenPriceCountAggregateInputType | true
    }

  export interface TokenPriceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TokenPrice'], meta: { name: 'TokenPrice' } }
    /**
     * Find zero or one TokenPrice that matches the filter.
     * @param {TokenPriceFindUniqueArgs} args - Arguments to find a TokenPrice
     * @example
     * // Get one TokenPrice
     * const tokenPrice = await prisma.tokenPrice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TokenPriceFindUniqueArgs>(args: SelectSubset<T, TokenPriceFindUniqueArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TokenPrice that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TokenPriceFindUniqueOrThrowArgs} args - Arguments to find a TokenPrice
     * @example
     * // Get one TokenPrice
     * const tokenPrice = await prisma.tokenPrice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TokenPriceFindUniqueOrThrowArgs>(args: SelectSubset<T, TokenPriceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TokenPrice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceFindFirstArgs} args - Arguments to find a TokenPrice
     * @example
     * // Get one TokenPrice
     * const tokenPrice = await prisma.tokenPrice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TokenPriceFindFirstArgs>(args?: SelectSubset<T, TokenPriceFindFirstArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TokenPrice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceFindFirstOrThrowArgs} args - Arguments to find a TokenPrice
     * @example
     * // Get one TokenPrice
     * const tokenPrice = await prisma.tokenPrice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TokenPriceFindFirstOrThrowArgs>(args?: SelectSubset<T, TokenPriceFindFirstOrThrowArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TokenPrices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TokenPrices
     * const tokenPrices = await prisma.tokenPrice.findMany()
     * 
     * // Get first 10 TokenPrices
     * const tokenPrices = await prisma.tokenPrice.findMany({ take: 10 })
     * 
     * // Only select the `tokenAddress`
     * const tokenPriceWithTokenAddressOnly = await prisma.tokenPrice.findMany({ select: { tokenAddress: true } })
     * 
     */
    findMany<T extends TokenPriceFindManyArgs>(args?: SelectSubset<T, TokenPriceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TokenPrice.
     * @param {TokenPriceCreateArgs} args - Arguments to create a TokenPrice.
     * @example
     * // Create one TokenPrice
     * const TokenPrice = await prisma.tokenPrice.create({
     *   data: {
     *     // ... data to create a TokenPrice
     *   }
     * })
     * 
     */
    create<T extends TokenPriceCreateArgs>(args: SelectSubset<T, TokenPriceCreateArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TokenPrices.
     * @param {TokenPriceCreateManyArgs} args - Arguments to create many TokenPrices.
     * @example
     * // Create many TokenPrices
     * const tokenPrice = await prisma.tokenPrice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TokenPriceCreateManyArgs>(args?: SelectSubset<T, TokenPriceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TokenPrices and returns the data saved in the database.
     * @param {TokenPriceCreateManyAndReturnArgs} args - Arguments to create many TokenPrices.
     * @example
     * // Create many TokenPrices
     * const tokenPrice = await prisma.tokenPrice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TokenPrices and only return the `tokenAddress`
     * const tokenPriceWithTokenAddressOnly = await prisma.tokenPrice.createManyAndReturn({ 
     *   select: { tokenAddress: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TokenPriceCreateManyAndReturnArgs>(args?: SelectSubset<T, TokenPriceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TokenPrice.
     * @param {TokenPriceDeleteArgs} args - Arguments to delete one TokenPrice.
     * @example
     * // Delete one TokenPrice
     * const TokenPrice = await prisma.tokenPrice.delete({
     *   where: {
     *     // ... filter to delete one TokenPrice
     *   }
     * })
     * 
     */
    delete<T extends TokenPriceDeleteArgs>(args: SelectSubset<T, TokenPriceDeleteArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TokenPrice.
     * @param {TokenPriceUpdateArgs} args - Arguments to update one TokenPrice.
     * @example
     * // Update one TokenPrice
     * const tokenPrice = await prisma.tokenPrice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TokenPriceUpdateArgs>(args: SelectSubset<T, TokenPriceUpdateArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TokenPrices.
     * @param {TokenPriceDeleteManyArgs} args - Arguments to filter TokenPrices to delete.
     * @example
     * // Delete a few TokenPrices
     * const { count } = await prisma.tokenPrice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TokenPriceDeleteManyArgs>(args?: SelectSubset<T, TokenPriceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TokenPrices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TokenPrices
     * const tokenPrice = await prisma.tokenPrice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TokenPriceUpdateManyArgs>(args: SelectSubset<T, TokenPriceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TokenPrice.
     * @param {TokenPriceUpsertArgs} args - Arguments to update or create a TokenPrice.
     * @example
     * // Update or create a TokenPrice
     * const tokenPrice = await prisma.tokenPrice.upsert({
     *   create: {
     *     // ... data to create a TokenPrice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TokenPrice we want to update
     *   }
     * })
     */
    upsert<T extends TokenPriceUpsertArgs>(args: SelectSubset<T, TokenPriceUpsertArgs<ExtArgs>>): Prisma__TokenPriceClient<$Result.GetResult<Prisma.$TokenPricePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TokenPrices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceCountArgs} args - Arguments to filter TokenPrices to count.
     * @example
     * // Count the number of TokenPrices
     * const count = await prisma.tokenPrice.count({
     *   where: {
     *     // ... the filter for the TokenPrices we want to count
     *   }
     * })
    **/
    count<T extends TokenPriceCountArgs>(
      args?: Subset<T, TokenPriceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TokenPriceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TokenPrice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TokenPriceAggregateArgs>(args: Subset<T, TokenPriceAggregateArgs>): Prisma.PrismaPromise<GetTokenPriceAggregateType<T>>

    /**
     * Group by TokenPrice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenPriceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TokenPriceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TokenPriceGroupByArgs['orderBy'] }
        : { orderBy?: TokenPriceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TokenPriceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTokenPriceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TokenPrice model
   */
  readonly fields: TokenPriceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TokenPrice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TokenPriceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TokenPrice model
   */ 
  interface TokenPriceFieldRefs {
    readonly tokenAddress: FieldRef<"TokenPrice", 'String'>
    readonly symbol: FieldRef<"TokenPrice", 'String'>
    readonly decimals: FieldRef<"TokenPrice", 'Int'>
    readonly priceUsd: FieldRef<"TokenPrice", 'Float'>
    readonly updatedAt: FieldRef<"TokenPrice", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TokenPrice findUnique
   */
  export type TokenPriceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter, which TokenPrice to fetch.
     */
    where: TokenPriceWhereUniqueInput
  }

  /**
   * TokenPrice findUniqueOrThrow
   */
  export type TokenPriceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter, which TokenPrice to fetch.
     */
    where: TokenPriceWhereUniqueInput
  }

  /**
   * TokenPrice findFirst
   */
  export type TokenPriceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter, which TokenPrice to fetch.
     */
    where?: TokenPriceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TokenPrices to fetch.
     */
    orderBy?: TokenPriceOrderByWithRelationInput | TokenPriceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TokenPrices.
     */
    cursor?: TokenPriceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TokenPrices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TokenPrices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TokenPrices.
     */
    distinct?: TokenPriceScalarFieldEnum | TokenPriceScalarFieldEnum[]
  }

  /**
   * TokenPrice findFirstOrThrow
   */
  export type TokenPriceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter, which TokenPrice to fetch.
     */
    where?: TokenPriceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TokenPrices to fetch.
     */
    orderBy?: TokenPriceOrderByWithRelationInput | TokenPriceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TokenPrices.
     */
    cursor?: TokenPriceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TokenPrices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TokenPrices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TokenPrices.
     */
    distinct?: TokenPriceScalarFieldEnum | TokenPriceScalarFieldEnum[]
  }

  /**
   * TokenPrice findMany
   */
  export type TokenPriceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter, which TokenPrices to fetch.
     */
    where?: TokenPriceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TokenPrices to fetch.
     */
    orderBy?: TokenPriceOrderByWithRelationInput | TokenPriceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TokenPrices.
     */
    cursor?: TokenPriceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TokenPrices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TokenPrices.
     */
    skip?: number
    distinct?: TokenPriceScalarFieldEnum | TokenPriceScalarFieldEnum[]
  }

  /**
   * TokenPrice create
   */
  export type TokenPriceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * The data needed to create a TokenPrice.
     */
    data: XOR<TokenPriceCreateInput, TokenPriceUncheckedCreateInput>
  }

  /**
   * TokenPrice createMany
   */
  export type TokenPriceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TokenPrices.
     */
    data: TokenPriceCreateManyInput | TokenPriceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TokenPrice createManyAndReturn
   */
  export type TokenPriceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TokenPrices.
     */
    data: TokenPriceCreateManyInput | TokenPriceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TokenPrice update
   */
  export type TokenPriceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * The data needed to update a TokenPrice.
     */
    data: XOR<TokenPriceUpdateInput, TokenPriceUncheckedUpdateInput>
    /**
     * Choose, which TokenPrice to update.
     */
    where: TokenPriceWhereUniqueInput
  }

  /**
   * TokenPrice updateMany
   */
  export type TokenPriceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TokenPrices.
     */
    data: XOR<TokenPriceUpdateManyMutationInput, TokenPriceUncheckedUpdateManyInput>
    /**
     * Filter which TokenPrices to update
     */
    where?: TokenPriceWhereInput
  }

  /**
   * TokenPrice upsert
   */
  export type TokenPriceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * The filter to search for the TokenPrice to update in case it exists.
     */
    where: TokenPriceWhereUniqueInput
    /**
     * In case the TokenPrice found by the `where` argument doesn't exist, create a new TokenPrice with this data.
     */
    create: XOR<TokenPriceCreateInput, TokenPriceUncheckedCreateInput>
    /**
     * In case the TokenPrice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TokenPriceUpdateInput, TokenPriceUncheckedUpdateInput>
  }

  /**
   * TokenPrice delete
   */
  export type TokenPriceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
    /**
     * Filter which TokenPrice to delete.
     */
    where: TokenPriceWhereUniqueInput
  }

  /**
   * TokenPrice deleteMany
   */
  export type TokenPriceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TokenPrices to delete
     */
    where?: TokenPriceWhereInput
  }

  /**
   * TokenPrice without action
   */
  export type TokenPriceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TokenPrice
     */
    select?: TokenPriceSelect<ExtArgs> | null
  }


  /**
   * Model Webhook
   */

  export type AggregateWebhook = {
    _count: WebhookCountAggregateOutputType | null
    _min: WebhookMinAggregateOutputType | null
    _max: WebhookMaxAggregateOutputType | null
  }

  export type WebhookMinAggregateOutputType = {
    id: string | null
    url: string | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebhookMaxAggregateOutputType = {
    id: string | null
    url: string | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebhookCountAggregateOutputType = {
    id: number
    url: number
    description: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WebhookMinAggregateInputType = {
    id?: true
    url?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebhookMaxAggregateInputType = {
    id?: true
    url?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebhookCountAggregateInputType = {
    id?: true
    url?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WebhookAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Webhook to aggregate.
     */
    where?: WebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Webhooks to fetch.
     */
    orderBy?: WebhookOrderByWithRelationInput | WebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Webhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Webhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Webhooks
    **/
    _count?: true | WebhookCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebhookMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebhookMaxAggregateInputType
  }

  export type GetWebhookAggregateType<T extends WebhookAggregateArgs> = {
        [P in keyof T & keyof AggregateWebhook]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebhook[P]>
      : GetScalarType<T[P], AggregateWebhook[P]>
  }




  export type WebhookGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookWhereInput
    orderBy?: WebhookOrderByWithAggregationInput | WebhookOrderByWithAggregationInput[]
    by: WebhookScalarFieldEnum[] | WebhookScalarFieldEnum
    having?: WebhookScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebhookCountAggregateInputType | true
    _min?: WebhookMinAggregateInputType
    _max?: WebhookMaxAggregateInputType
  }

  export type WebhookGroupByOutputType = {
    id: string
    url: string
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: WebhookCountAggregateOutputType | null
    _min: WebhookMinAggregateOutputType | null
    _max: WebhookMaxAggregateOutputType | null
  }

  type GetWebhookGroupByPayload<T extends WebhookGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebhookGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebhookGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebhookGroupByOutputType[P]>
            : GetScalarType<T[P], WebhookGroupByOutputType[P]>
        }
      >
    >


  export type WebhookSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["webhook"]>

  export type WebhookSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["webhook"]>

  export type WebhookSelectScalar = {
    id?: boolean
    url?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $WebhookPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Webhook"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      url: string
      description: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["webhook"]>
    composites: {}
  }

  type WebhookGetPayload<S extends boolean | null | undefined | WebhookDefaultArgs> = $Result.GetResult<Prisma.$WebhookPayload, S>

  type WebhookCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WebhookFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WebhookCountAggregateInputType | true
    }

  export interface WebhookDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Webhook'], meta: { name: 'Webhook' } }
    /**
     * Find zero or one Webhook that matches the filter.
     * @param {WebhookFindUniqueArgs} args - Arguments to find a Webhook
     * @example
     * // Get one Webhook
     * const webhook = await prisma.webhook.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebhookFindUniqueArgs>(args: SelectSubset<T, WebhookFindUniqueArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Webhook that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WebhookFindUniqueOrThrowArgs} args - Arguments to find a Webhook
     * @example
     * // Get one Webhook
     * const webhook = await prisma.webhook.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebhookFindUniqueOrThrowArgs>(args: SelectSubset<T, WebhookFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Webhook that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookFindFirstArgs} args - Arguments to find a Webhook
     * @example
     * // Get one Webhook
     * const webhook = await prisma.webhook.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebhookFindFirstArgs>(args?: SelectSubset<T, WebhookFindFirstArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Webhook that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookFindFirstOrThrowArgs} args - Arguments to find a Webhook
     * @example
     * // Get one Webhook
     * const webhook = await prisma.webhook.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebhookFindFirstOrThrowArgs>(args?: SelectSubset<T, WebhookFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Webhooks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Webhooks
     * const webhooks = await prisma.webhook.findMany()
     * 
     * // Get first 10 Webhooks
     * const webhooks = await prisma.webhook.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webhookWithIdOnly = await prisma.webhook.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebhookFindManyArgs>(args?: SelectSubset<T, WebhookFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Webhook.
     * @param {WebhookCreateArgs} args - Arguments to create a Webhook.
     * @example
     * // Create one Webhook
     * const Webhook = await prisma.webhook.create({
     *   data: {
     *     // ... data to create a Webhook
     *   }
     * })
     * 
     */
    create<T extends WebhookCreateArgs>(args: SelectSubset<T, WebhookCreateArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Webhooks.
     * @param {WebhookCreateManyArgs} args - Arguments to create many Webhooks.
     * @example
     * // Create many Webhooks
     * const webhook = await prisma.webhook.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebhookCreateManyArgs>(args?: SelectSubset<T, WebhookCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Webhooks and returns the data saved in the database.
     * @param {WebhookCreateManyAndReturnArgs} args - Arguments to create many Webhooks.
     * @example
     * // Create many Webhooks
     * const webhook = await prisma.webhook.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Webhooks and only return the `id`
     * const webhookWithIdOnly = await prisma.webhook.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebhookCreateManyAndReturnArgs>(args?: SelectSubset<T, WebhookCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Webhook.
     * @param {WebhookDeleteArgs} args - Arguments to delete one Webhook.
     * @example
     * // Delete one Webhook
     * const Webhook = await prisma.webhook.delete({
     *   where: {
     *     // ... filter to delete one Webhook
     *   }
     * })
     * 
     */
    delete<T extends WebhookDeleteArgs>(args: SelectSubset<T, WebhookDeleteArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Webhook.
     * @param {WebhookUpdateArgs} args - Arguments to update one Webhook.
     * @example
     * // Update one Webhook
     * const webhook = await prisma.webhook.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebhookUpdateArgs>(args: SelectSubset<T, WebhookUpdateArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Webhooks.
     * @param {WebhookDeleteManyArgs} args - Arguments to filter Webhooks to delete.
     * @example
     * // Delete a few Webhooks
     * const { count } = await prisma.webhook.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebhookDeleteManyArgs>(args?: SelectSubset<T, WebhookDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Webhooks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Webhooks
     * const webhook = await prisma.webhook.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebhookUpdateManyArgs>(args: SelectSubset<T, WebhookUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Webhook.
     * @param {WebhookUpsertArgs} args - Arguments to update or create a Webhook.
     * @example
     * // Update or create a Webhook
     * const webhook = await prisma.webhook.upsert({
     *   create: {
     *     // ... data to create a Webhook
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Webhook we want to update
     *   }
     * })
     */
    upsert<T extends WebhookUpsertArgs>(args: SelectSubset<T, WebhookUpsertArgs<ExtArgs>>): Prisma__WebhookClient<$Result.GetResult<Prisma.$WebhookPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Webhooks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookCountArgs} args - Arguments to filter Webhooks to count.
     * @example
     * // Count the number of Webhooks
     * const count = await prisma.webhook.count({
     *   where: {
     *     // ... the filter for the Webhooks we want to count
     *   }
     * })
    **/
    count<T extends WebhookCountArgs>(
      args?: Subset<T, WebhookCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebhookCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Webhook.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebhookAggregateArgs>(args: Subset<T, WebhookAggregateArgs>): Prisma.PrismaPromise<GetWebhookAggregateType<T>>

    /**
     * Group by Webhook.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebhookGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebhookGroupByArgs['orderBy'] }
        : { orderBy?: WebhookGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebhookGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebhookGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Webhook model
   */
  readonly fields: WebhookFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Webhook.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebhookClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Webhook model
   */ 
  interface WebhookFieldRefs {
    readonly id: FieldRef<"Webhook", 'String'>
    readonly url: FieldRef<"Webhook", 'String'>
    readonly description: FieldRef<"Webhook", 'String'>
    readonly isActive: FieldRef<"Webhook", 'Boolean'>
    readonly createdAt: FieldRef<"Webhook", 'DateTime'>
    readonly updatedAt: FieldRef<"Webhook", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Webhook findUnique
   */
  export type WebhookFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter, which Webhook to fetch.
     */
    where: WebhookWhereUniqueInput
  }

  /**
   * Webhook findUniqueOrThrow
   */
  export type WebhookFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter, which Webhook to fetch.
     */
    where: WebhookWhereUniqueInput
  }

  /**
   * Webhook findFirst
   */
  export type WebhookFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter, which Webhook to fetch.
     */
    where?: WebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Webhooks to fetch.
     */
    orderBy?: WebhookOrderByWithRelationInput | WebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Webhooks.
     */
    cursor?: WebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Webhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Webhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Webhooks.
     */
    distinct?: WebhookScalarFieldEnum | WebhookScalarFieldEnum[]
  }

  /**
   * Webhook findFirstOrThrow
   */
  export type WebhookFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter, which Webhook to fetch.
     */
    where?: WebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Webhooks to fetch.
     */
    orderBy?: WebhookOrderByWithRelationInput | WebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Webhooks.
     */
    cursor?: WebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Webhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Webhooks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Webhooks.
     */
    distinct?: WebhookScalarFieldEnum | WebhookScalarFieldEnum[]
  }

  /**
   * Webhook findMany
   */
  export type WebhookFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter, which Webhooks to fetch.
     */
    where?: WebhookWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Webhooks to fetch.
     */
    orderBy?: WebhookOrderByWithRelationInput | WebhookOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Webhooks.
     */
    cursor?: WebhookWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Webhooks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Webhooks.
     */
    skip?: number
    distinct?: WebhookScalarFieldEnum | WebhookScalarFieldEnum[]
  }

  /**
   * Webhook create
   */
  export type WebhookCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * The data needed to create a Webhook.
     */
    data: XOR<WebhookCreateInput, WebhookUncheckedCreateInput>
  }

  /**
   * Webhook createMany
   */
  export type WebhookCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Webhooks.
     */
    data: WebhookCreateManyInput | WebhookCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Webhook createManyAndReturn
   */
  export type WebhookCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Webhooks.
     */
    data: WebhookCreateManyInput | WebhookCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Webhook update
   */
  export type WebhookUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * The data needed to update a Webhook.
     */
    data: XOR<WebhookUpdateInput, WebhookUncheckedUpdateInput>
    /**
     * Choose, which Webhook to update.
     */
    where: WebhookWhereUniqueInput
  }

  /**
   * Webhook updateMany
   */
  export type WebhookUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Webhooks.
     */
    data: XOR<WebhookUpdateManyMutationInput, WebhookUncheckedUpdateManyInput>
    /**
     * Filter which Webhooks to update
     */
    where?: WebhookWhereInput
  }

  /**
   * Webhook upsert
   */
  export type WebhookUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * The filter to search for the Webhook to update in case it exists.
     */
    where: WebhookWhereUniqueInput
    /**
     * In case the Webhook found by the `where` argument doesn't exist, create a new Webhook with this data.
     */
    create: XOR<WebhookCreateInput, WebhookUncheckedCreateInput>
    /**
     * In case the Webhook was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebhookUpdateInput, WebhookUncheckedUpdateInput>
  }

  /**
   * Webhook delete
   */
  export type WebhookDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
    /**
     * Filter which Webhook to delete.
     */
    where: WebhookWhereUniqueInput
  }

  /**
   * Webhook deleteMany
   */
  export type WebhookDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Webhooks to delete
     */
    where?: WebhookWhereInput
  }

  /**
   * Webhook without action
   */
  export type WebhookDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Webhook
     */
    select?: WebhookSelect<ExtArgs> | null
  }


  /**
   * Model SyncState
   */

  export type AggregateSyncState = {
    _count: SyncStateCountAggregateOutputType | null
    _avg: SyncStateAvgAggregateOutputType | null
    _sum: SyncStateSumAggregateOutputType | null
    _min: SyncStateMinAggregateOutputType | null
    _max: SyncStateMaxAggregateOutputType | null
  }

  export type SyncStateAvgAggregateOutputType = {
    id: number | null
    lastLedgerSequence: number | null
  }

  export type SyncStateSumAggregateOutputType = {
    id: number | null
    lastLedgerSequence: number | null
  }

  export type SyncStateMinAggregateOutputType = {
    id: number | null
    lastLedgerSequence: number | null
  }

  export type SyncStateMaxAggregateOutputType = {
    id: number | null
    lastLedgerSequence: number | null
  }

  export type SyncStateCountAggregateOutputType = {
    id: number
    lastLedgerSequence: number
    _all: number
  }


  export type SyncStateAvgAggregateInputType = {
    id?: true
    lastLedgerSequence?: true
  }

  export type SyncStateSumAggregateInputType = {
    id?: true
    lastLedgerSequence?: true
  }

  export type SyncStateMinAggregateInputType = {
    id?: true
    lastLedgerSequence?: true
  }

  export type SyncStateMaxAggregateInputType = {
    id?: true
    lastLedgerSequence?: true
  }

  export type SyncStateCountAggregateInputType = {
    id?: true
    lastLedgerSequence?: true
    _all?: true
  }

  export type SyncStateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncState to aggregate.
     */
    where?: SyncStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncStates to fetch.
     */
    orderBy?: SyncStateOrderByWithRelationInput | SyncStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SyncStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SyncStates
    **/
    _count?: true | SyncStateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SyncStateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SyncStateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SyncStateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SyncStateMaxAggregateInputType
  }

  export type GetSyncStateAggregateType<T extends SyncStateAggregateArgs> = {
        [P in keyof T & keyof AggregateSyncState]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSyncState[P]>
      : GetScalarType<T[P], AggregateSyncState[P]>
  }




  export type SyncStateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncStateWhereInput
    orderBy?: SyncStateOrderByWithAggregationInput | SyncStateOrderByWithAggregationInput[]
    by: SyncStateScalarFieldEnum[] | SyncStateScalarFieldEnum
    having?: SyncStateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SyncStateCountAggregateInputType | true
    _avg?: SyncStateAvgAggregateInputType
    _sum?: SyncStateSumAggregateInputType
    _min?: SyncStateMinAggregateInputType
    _max?: SyncStateMaxAggregateInputType
  }

  export type SyncStateGroupByOutputType = {
    id: number
    lastLedgerSequence: number
    _count: SyncStateCountAggregateOutputType | null
    _avg: SyncStateAvgAggregateOutputType | null
    _sum: SyncStateSumAggregateOutputType | null
    _min: SyncStateMinAggregateOutputType | null
    _max: SyncStateMaxAggregateOutputType | null
  }

  type GetSyncStateGroupByPayload<T extends SyncStateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SyncStateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SyncStateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SyncStateGroupByOutputType[P]>
            : GetScalarType<T[P], SyncStateGroupByOutputType[P]>
        }
      >
    >


  export type SyncStateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lastLedgerSequence?: boolean
  }, ExtArgs["result"]["syncState"]>

  export type SyncStateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lastLedgerSequence?: boolean
  }, ExtArgs["result"]["syncState"]>

  export type SyncStateSelectScalar = {
    id?: boolean
    lastLedgerSequence?: boolean
  }


  export type $SyncStatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SyncState"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      lastLedgerSequence: number
    }, ExtArgs["result"]["syncState"]>
    composites: {}
  }

  type SyncStateGetPayload<S extends boolean | null | undefined | SyncStateDefaultArgs> = $Result.GetResult<Prisma.$SyncStatePayload, S>

  type SyncStateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SyncStateFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SyncStateCountAggregateInputType | true
    }

  export interface SyncStateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SyncState'], meta: { name: 'SyncState' } }
    /**
     * Find zero or one SyncState that matches the filter.
     * @param {SyncStateFindUniqueArgs} args - Arguments to find a SyncState
     * @example
     * // Get one SyncState
     * const syncState = await prisma.syncState.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SyncStateFindUniqueArgs>(args: SelectSubset<T, SyncStateFindUniqueArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SyncState that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SyncStateFindUniqueOrThrowArgs} args - Arguments to find a SyncState
     * @example
     * // Get one SyncState
     * const syncState = await prisma.syncState.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SyncStateFindUniqueOrThrowArgs>(args: SelectSubset<T, SyncStateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SyncState that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateFindFirstArgs} args - Arguments to find a SyncState
     * @example
     * // Get one SyncState
     * const syncState = await prisma.syncState.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SyncStateFindFirstArgs>(args?: SelectSubset<T, SyncStateFindFirstArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SyncState that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateFindFirstOrThrowArgs} args - Arguments to find a SyncState
     * @example
     * // Get one SyncState
     * const syncState = await prisma.syncState.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SyncStateFindFirstOrThrowArgs>(args?: SelectSubset<T, SyncStateFindFirstOrThrowArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SyncStates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SyncStates
     * const syncStates = await prisma.syncState.findMany()
     * 
     * // Get first 10 SyncStates
     * const syncStates = await prisma.syncState.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const syncStateWithIdOnly = await prisma.syncState.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SyncStateFindManyArgs>(args?: SelectSubset<T, SyncStateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SyncState.
     * @param {SyncStateCreateArgs} args - Arguments to create a SyncState.
     * @example
     * // Create one SyncState
     * const SyncState = await prisma.syncState.create({
     *   data: {
     *     // ... data to create a SyncState
     *   }
     * })
     * 
     */
    create<T extends SyncStateCreateArgs>(args: SelectSubset<T, SyncStateCreateArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SyncStates.
     * @param {SyncStateCreateManyArgs} args - Arguments to create many SyncStates.
     * @example
     * // Create many SyncStates
     * const syncState = await prisma.syncState.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SyncStateCreateManyArgs>(args?: SelectSubset<T, SyncStateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SyncStates and returns the data saved in the database.
     * @param {SyncStateCreateManyAndReturnArgs} args - Arguments to create many SyncStates.
     * @example
     * // Create many SyncStates
     * const syncState = await prisma.syncState.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SyncStates and only return the `id`
     * const syncStateWithIdOnly = await prisma.syncState.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SyncStateCreateManyAndReturnArgs>(args?: SelectSubset<T, SyncStateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SyncState.
     * @param {SyncStateDeleteArgs} args - Arguments to delete one SyncState.
     * @example
     * // Delete one SyncState
     * const SyncState = await prisma.syncState.delete({
     *   where: {
     *     // ... filter to delete one SyncState
     *   }
     * })
     * 
     */
    delete<T extends SyncStateDeleteArgs>(args: SelectSubset<T, SyncStateDeleteArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SyncState.
     * @param {SyncStateUpdateArgs} args - Arguments to update one SyncState.
     * @example
     * // Update one SyncState
     * const syncState = await prisma.syncState.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SyncStateUpdateArgs>(args: SelectSubset<T, SyncStateUpdateArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SyncStates.
     * @param {SyncStateDeleteManyArgs} args - Arguments to filter SyncStates to delete.
     * @example
     * // Delete a few SyncStates
     * const { count } = await prisma.syncState.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SyncStateDeleteManyArgs>(args?: SelectSubset<T, SyncStateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SyncStates
     * const syncState = await prisma.syncState.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SyncStateUpdateManyArgs>(args: SelectSubset<T, SyncStateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SyncState.
     * @param {SyncStateUpsertArgs} args - Arguments to update or create a SyncState.
     * @example
     * // Update or create a SyncState
     * const syncState = await prisma.syncState.upsert({
     *   create: {
     *     // ... data to create a SyncState
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SyncState we want to update
     *   }
     * })
     */
    upsert<T extends SyncStateUpsertArgs>(args: SelectSubset<T, SyncStateUpsertArgs<ExtArgs>>): Prisma__SyncStateClient<$Result.GetResult<Prisma.$SyncStatePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SyncStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateCountArgs} args - Arguments to filter SyncStates to count.
     * @example
     * // Count the number of SyncStates
     * const count = await prisma.syncState.count({
     *   where: {
     *     // ... the filter for the SyncStates we want to count
     *   }
     * })
    **/
    count<T extends SyncStateCountArgs>(
      args?: Subset<T, SyncStateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SyncStateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SyncState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SyncStateAggregateArgs>(args: Subset<T, SyncStateAggregateArgs>): Prisma.PrismaPromise<GetSyncStateAggregateType<T>>

    /**
     * Group by SyncState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncStateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SyncStateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SyncStateGroupByArgs['orderBy'] }
        : { orderBy?: SyncStateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SyncStateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSyncStateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SyncState model
   */
  readonly fields: SyncStateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SyncState.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SyncStateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SyncState model
   */ 
  interface SyncStateFieldRefs {
    readonly id: FieldRef<"SyncState", 'Int'>
    readonly lastLedgerSequence: FieldRef<"SyncState", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * SyncState findUnique
   */
  export type SyncStateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter, which SyncState to fetch.
     */
    where: SyncStateWhereUniqueInput
  }

  /**
   * SyncState findUniqueOrThrow
   */
  export type SyncStateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter, which SyncState to fetch.
     */
    where: SyncStateWhereUniqueInput
  }

  /**
   * SyncState findFirst
   */
  export type SyncStateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter, which SyncState to fetch.
     */
    where?: SyncStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncStates to fetch.
     */
    orderBy?: SyncStateOrderByWithRelationInput | SyncStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncStates.
     */
    cursor?: SyncStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncStates.
     */
    distinct?: SyncStateScalarFieldEnum | SyncStateScalarFieldEnum[]
  }

  /**
   * SyncState findFirstOrThrow
   */
  export type SyncStateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter, which SyncState to fetch.
     */
    where?: SyncStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncStates to fetch.
     */
    orderBy?: SyncStateOrderByWithRelationInput | SyncStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncStates.
     */
    cursor?: SyncStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncStates.
     */
    distinct?: SyncStateScalarFieldEnum | SyncStateScalarFieldEnum[]
  }

  /**
   * SyncState findMany
   */
  export type SyncStateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter, which SyncStates to fetch.
     */
    where?: SyncStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncStates to fetch.
     */
    orderBy?: SyncStateOrderByWithRelationInput | SyncStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SyncStates.
     */
    cursor?: SyncStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncStates.
     */
    skip?: number
    distinct?: SyncStateScalarFieldEnum | SyncStateScalarFieldEnum[]
  }

  /**
   * SyncState create
   */
  export type SyncStateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * The data needed to create a SyncState.
     */
    data?: XOR<SyncStateCreateInput, SyncStateUncheckedCreateInput>
  }

  /**
   * SyncState createMany
   */
  export type SyncStateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SyncStates.
     */
    data: SyncStateCreateManyInput | SyncStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SyncState createManyAndReturn
   */
  export type SyncStateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SyncStates.
     */
    data: SyncStateCreateManyInput | SyncStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SyncState update
   */
  export type SyncStateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * The data needed to update a SyncState.
     */
    data: XOR<SyncStateUpdateInput, SyncStateUncheckedUpdateInput>
    /**
     * Choose, which SyncState to update.
     */
    where: SyncStateWhereUniqueInput
  }

  /**
   * SyncState updateMany
   */
  export type SyncStateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SyncStates.
     */
    data: XOR<SyncStateUpdateManyMutationInput, SyncStateUncheckedUpdateManyInput>
    /**
     * Filter which SyncStates to update
     */
    where?: SyncStateWhereInput
  }

  /**
   * SyncState upsert
   */
  export type SyncStateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * The filter to search for the SyncState to update in case it exists.
     */
    where: SyncStateWhereUniqueInput
    /**
     * In case the SyncState found by the `where` argument doesn't exist, create a new SyncState with this data.
     */
    create: XOR<SyncStateCreateInput, SyncStateUncheckedCreateInput>
    /**
     * In case the SyncState was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SyncStateUpdateInput, SyncStateUncheckedUpdateInput>
  }

  /**
   * SyncState delete
   */
  export type SyncStateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
    /**
     * Filter which SyncState to delete.
     */
    where: SyncStateWhereUniqueInput
  }

  /**
   * SyncState deleteMany
   */
  export type SyncStateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncStates to delete
     */
    where?: SyncStateWhereInput
  }

  /**
   * SyncState without action
   */
  export type SyncStateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncState
     */
    select?: SyncStateSelect<ExtArgs> | null
  }


  /**
   * Model EventLog
   */

  export type AggregateEventLog = {
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  export type EventLogAvgAggregateOutputType = {
    eventIndex: number | null
    ledger: number | null
    amount: number | null
  }

  export type EventLogSumAggregateOutputType = {
    eventIndex: number | null
    ledger: number | null
    amount: bigint | null
  }

  export type EventLogMinAggregateOutputType = {
    id: string | null
    eventType: string | null
    streamId: string | null
    txHash: string | null
    eventIndex: number | null
    ledger: number | null
    ledgerClosedAt: string | null
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date | null
  }

  export type EventLogMaxAggregateOutputType = {
    id: string | null
    eventType: string | null
    streamId: string | null
    txHash: string | null
    eventIndex: number | null
    ledger: number | null
    ledgerClosedAt: string | null
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date | null
  }

  export type EventLogCountAggregateOutputType = {
    id: number
    eventType: number
    streamId: number
    txHash: number
    eventIndex: number
    ledger: number
    ledgerClosedAt: number
    sender: number
    receiver: number
    amount: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type EventLogAvgAggregateInputType = {
    eventIndex?: true
    ledger?: true
    amount?: true
  }

  export type EventLogSumAggregateInputType = {
    eventIndex?: true
    ledger?: true
    amount?: true
  }

  export type EventLogMinAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    eventIndex?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
  }

  export type EventLogMaxAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    eventIndex?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
  }

  export type EventLogCountAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    eventIndex?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type EventLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLog to aggregate.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventLogs
    **/
    _count?: true | EventLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventLogMaxAggregateInputType
  }

  export type GetEventLogAggregateType<T extends EventLogAggregateArgs> = {
        [P in keyof T & keyof AggregateEventLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventLog[P]>
      : GetScalarType<T[P], AggregateEventLog[P]>
  }




  export type EventLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventLogWhereInput
    orderBy?: EventLogOrderByWithAggregationInput | EventLogOrderByWithAggregationInput[]
    by: EventLogScalarFieldEnum[] | EventLogScalarFieldEnum
    having?: EventLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventLogCountAggregateInputType | true
    _avg?: EventLogAvgAggregateInputType
    _sum?: EventLogSumAggregateInputType
    _min?: EventLogMinAggregateInputType
    _max?: EventLogMaxAggregateInputType
  }

  export type EventLogGroupByOutputType = {
    id: string
    eventType: string
    streamId: string
    txHash: string
    eventIndex: number
    ledger: number
    ledgerClosedAt: string
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date
    _count: EventLogCountAggregateOutputType | null
    _avg: EventLogAvgAggregateOutputType | null
    _sum: EventLogSumAggregateOutputType | null
    _min: EventLogMinAggregateOutputType | null
    _max: EventLogMaxAggregateOutputType | null
  }

  type GetEventLogGroupByPayload<T extends EventLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventLogGroupByOutputType[P]>
            : GetScalarType<T[P], EventLogGroupByOutputType[P]>
        }
      >
    >


  export type EventLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    eventIndex?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    eventIndex?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["eventLog"]>

  export type EventLogSelectScalar = {
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    eventIndex?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
  }


  export type $EventLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventType: string
      streamId: string
      txHash: string
      eventIndex: number
      ledger: number
      ledgerClosedAt: string
      sender: string | null
      receiver: string | null
      amount: bigint | null
      metadata: string | null
      createdAt: Date
    }, ExtArgs["result"]["eventLog"]>
    composites: {}
  }

  type EventLogGetPayload<S extends boolean | null | undefined | EventLogDefaultArgs> = $Result.GetResult<Prisma.$EventLogPayload, S>

  type EventLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<EventLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: EventLogCountAggregateInputType | true
    }

  export interface EventLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventLog'], meta: { name: 'EventLog' } }
    /**
     * Find zero or one EventLog that matches the filter.
     * @param {EventLogFindUniqueArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventLogFindUniqueArgs>(args: SelectSubset<T, EventLogFindUniqueArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one EventLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {EventLogFindUniqueOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventLogFindUniqueOrThrowArgs>(args: SelectSubset<T, EventLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first EventLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventLogFindFirstArgs>(args?: SelectSubset<T, EventLogFindFirstArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first EventLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindFirstOrThrowArgs} args - Arguments to find a EventLog
     * @example
     * // Get one EventLog
     * const eventLog = await prisma.eventLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventLogFindFirstOrThrowArgs>(args?: SelectSubset<T, EventLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more EventLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventLogs
     * const eventLogs = await prisma.eventLog.findMany()
     * 
     * // Get first 10 EventLogs
     * const eventLogs = await prisma.eventLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventLogFindManyArgs>(args?: SelectSubset<T, EventLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a EventLog.
     * @param {EventLogCreateArgs} args - Arguments to create a EventLog.
     * @example
     * // Create one EventLog
     * const EventLog = await prisma.eventLog.create({
     *   data: {
     *     // ... data to create a EventLog
     *   }
     * })
     * 
     */
    create<T extends EventLogCreateArgs>(args: SelectSubset<T, EventLogCreateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many EventLogs.
     * @param {EventLogCreateManyArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventLogCreateManyArgs>(args?: SelectSubset<T, EventLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventLogs and returns the data saved in the database.
     * @param {EventLogCreateManyAndReturnArgs} args - Arguments to create many EventLogs.
     * @example
     * // Create many EventLogs
     * const eventLog = await prisma.eventLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventLogs and only return the `id`
     * const eventLogWithIdOnly = await prisma.eventLog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventLogCreateManyAndReturnArgs>(args?: SelectSubset<T, EventLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a EventLog.
     * @param {EventLogDeleteArgs} args - Arguments to delete one EventLog.
     * @example
     * // Delete one EventLog
     * const EventLog = await prisma.eventLog.delete({
     *   where: {
     *     // ... filter to delete one EventLog
     *   }
     * })
     * 
     */
    delete<T extends EventLogDeleteArgs>(args: SelectSubset<T, EventLogDeleteArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one EventLog.
     * @param {EventLogUpdateArgs} args - Arguments to update one EventLog.
     * @example
     * // Update one EventLog
     * const eventLog = await prisma.eventLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventLogUpdateArgs>(args: SelectSubset<T, EventLogUpdateArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more EventLogs.
     * @param {EventLogDeleteManyArgs} args - Arguments to filter EventLogs to delete.
     * @example
     * // Delete a few EventLogs
     * const { count } = await prisma.eventLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventLogDeleteManyArgs>(args?: SelectSubset<T, EventLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventLogs
     * const eventLog = await prisma.eventLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventLogUpdateManyArgs>(args: SelectSubset<T, EventLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one EventLog.
     * @param {EventLogUpsertArgs} args - Arguments to update or create a EventLog.
     * @example
     * // Update or create a EventLog
     * const eventLog = await prisma.eventLog.upsert({
     *   create: {
     *     // ... data to create a EventLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventLog we want to update
     *   }
     * })
     */
    upsert<T extends EventLogUpsertArgs>(args: SelectSubset<T, EventLogUpsertArgs<ExtArgs>>): Prisma__EventLogClient<$Result.GetResult<Prisma.$EventLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of EventLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogCountArgs} args - Arguments to filter EventLogs to count.
     * @example
     * // Count the number of EventLogs
     * const count = await prisma.eventLog.count({
     *   where: {
     *     // ... the filter for the EventLogs we want to count
     *   }
     * })
    **/
    count<T extends EventLogCountArgs>(
      args?: Subset<T, EventLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventLogAggregateArgs>(args: Subset<T, EventLogAggregateArgs>): Prisma.PrismaPromise<GetEventLogAggregateType<T>>

    /**
     * Group by EventLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventLogGroupByArgs['orderBy'] }
        : { orderBy?: EventLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventLog model
   */
  readonly fields: EventLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventLog model
   */ 
  interface EventLogFieldRefs {
    readonly id: FieldRef<"EventLog", 'String'>
    readonly eventType: FieldRef<"EventLog", 'String'>
    readonly streamId: FieldRef<"EventLog", 'String'>
    readonly txHash: FieldRef<"EventLog", 'String'>
    readonly eventIndex: FieldRef<"EventLog", 'Int'>
    readonly ledger: FieldRef<"EventLog", 'Int'>
    readonly ledgerClosedAt: FieldRef<"EventLog", 'String'>
    readonly sender: FieldRef<"EventLog", 'String'>
    readonly receiver: FieldRef<"EventLog", 'String'>
    readonly amount: FieldRef<"EventLog", 'BigInt'>
    readonly metadata: FieldRef<"EventLog", 'String'>
    readonly createdAt: FieldRef<"EventLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EventLog findUnique
   */
  export type EventLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findUniqueOrThrow
   */
  export type EventLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog findFirst
   */
  export type EventLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findFirstOrThrow
   */
  export type EventLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter, which EventLog to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventLogs.
     */
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog findMany
   */
  export type EventLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter, which EventLogs to fetch.
     */
    where?: EventLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventLogs to fetch.
     */
    orderBy?: EventLogOrderByWithRelationInput | EventLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventLogs.
     */
    cursor?: EventLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventLogs.
     */
    skip?: number
    distinct?: EventLogScalarFieldEnum | EventLogScalarFieldEnum[]
  }

  /**
   * EventLog create
   */
  export type EventLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * The data needed to create a EventLog.
     */
    data: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
  }

  /**
   * EventLog createMany
   */
  export type EventLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventLog createManyAndReturn
   */
  export type EventLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many EventLogs.
     */
    data: EventLogCreateManyInput | EventLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventLog update
   */
  export type EventLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * The data needed to update a EventLog.
     */
    data: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
    /**
     * Choose, which EventLog to update.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog updateMany
   */
  export type EventLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventLogs.
     */
    data: XOR<EventLogUpdateManyMutationInput, EventLogUncheckedUpdateManyInput>
    /**
     * Filter which EventLogs to update
     */
    where?: EventLogWhereInput
  }

  /**
   * EventLog upsert
   */
  export type EventLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * The filter to search for the EventLog to update in case it exists.
     */
    where: EventLogWhereUniqueInput
    /**
     * In case the EventLog found by the `where` argument doesn't exist, create a new EventLog with this data.
     */
    create: XOR<EventLogCreateInput, EventLogUncheckedCreateInput>
    /**
     * In case the EventLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventLogUpdateInput, EventLogUncheckedUpdateInput>
  }

  /**
   * EventLog delete
   */
  export type EventLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
    /**
     * Filter which EventLog to delete.
     */
    where: EventLogWhereUniqueInput
  }

  /**
   * EventLog deleteMany
   */
  export type EventLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventLogs to delete
     */
    where?: EventLogWhereInput
  }

  /**
   * EventLog without action
   */
  export type EventLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventLog
     */
    select?: EventLogSelect<ExtArgs> | null
  }


  /**
   * Model StreamSnapshot
   */

  export type AggregateStreamSnapshot = {
    _count: StreamSnapshotCountAggregateOutputType | null
    _avg: StreamSnapshotAvgAggregateOutputType | null
    _sum: StreamSnapshotSumAggregateOutputType | null
    _min: StreamSnapshotMinAggregateOutputType | null
    _max: StreamSnapshotMaxAggregateOutputType | null
  }

  export type StreamSnapshotAvgAggregateOutputType = {
    amountPerSecond: number | null
    totalAmount: number | null
  }

  export type StreamSnapshotSumAggregateOutputType = {
    amountPerSecond: bigint | null
    totalAmount: bigint | null
  }

  export type StreamSnapshotMinAggregateOutputType = {
    id: string | null
    streamId: string | null
    sender: string | null
    receiver: string | null
    tokenAddress: string | null
    amountPerSecond: bigint | null
    totalAmount: bigint | null
    status: $Enums.StreamStatus | null
    snapshotMonth: string | null
    createdAt: Date | null
  }

  export type StreamSnapshotMaxAggregateOutputType = {
    id: string | null
    streamId: string | null
    sender: string | null
    receiver: string | null
    tokenAddress: string | null
    amountPerSecond: bigint | null
    totalAmount: bigint | null
    status: $Enums.StreamStatus | null
    snapshotMonth: string | null
    createdAt: Date | null
  }

  export type StreamSnapshotCountAggregateOutputType = {
    id: number
    streamId: number
    sender: number
    receiver: number
    tokenAddress: number
    amountPerSecond: number
    totalAmount: number
    status: number
    snapshotMonth: number
    createdAt: number
    _all: number
  }


  export type StreamSnapshotAvgAggregateInputType = {
    amountPerSecond?: true
    totalAmount?: true
  }

  export type StreamSnapshotSumAggregateInputType = {
    amountPerSecond?: true
    totalAmount?: true
  }

  export type StreamSnapshotMinAggregateInputType = {
    id?: true
    streamId?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amountPerSecond?: true
    totalAmount?: true
    status?: true
    snapshotMonth?: true
    createdAt?: true
  }

  export type StreamSnapshotMaxAggregateInputType = {
    id?: true
    streamId?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amountPerSecond?: true
    totalAmount?: true
    status?: true
    snapshotMonth?: true
    createdAt?: true
  }

  export type StreamSnapshotCountAggregateInputType = {
    id?: true
    streamId?: true
    sender?: true
    receiver?: true
    tokenAddress?: true
    amountPerSecond?: true
    totalAmount?: true
    status?: true
    snapshotMonth?: true
    createdAt?: true
    _all?: true
  }

  export type StreamSnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StreamSnapshot to aggregate.
     */
    where?: StreamSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamSnapshots to fetch.
     */
    orderBy?: StreamSnapshotOrderByWithRelationInput | StreamSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StreamSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StreamSnapshots
    **/
    _count?: true | StreamSnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StreamSnapshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StreamSnapshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StreamSnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StreamSnapshotMaxAggregateInputType
  }

  export type GetStreamSnapshotAggregateType<T extends StreamSnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregateStreamSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStreamSnapshot[P]>
      : GetScalarType<T[P], AggregateStreamSnapshot[P]>
  }




  export type StreamSnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StreamSnapshotWhereInput
    orderBy?: StreamSnapshotOrderByWithAggregationInput | StreamSnapshotOrderByWithAggregationInput[]
    by: StreamSnapshotScalarFieldEnum[] | StreamSnapshotScalarFieldEnum
    having?: StreamSnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StreamSnapshotCountAggregateInputType | true
    _avg?: StreamSnapshotAvgAggregateInputType
    _sum?: StreamSnapshotSumAggregateInputType
    _min?: StreamSnapshotMinAggregateInputType
    _max?: StreamSnapshotMaxAggregateInputType
  }

  export type StreamSnapshotGroupByOutputType = {
    id: string
    streamId: string
    sender: string
    receiver: string
    tokenAddress: string
    amountPerSecond: bigint
    totalAmount: bigint
    status: $Enums.StreamStatus
    snapshotMonth: string
    createdAt: Date
    _count: StreamSnapshotCountAggregateOutputType | null
    _avg: StreamSnapshotAvgAggregateOutputType | null
    _sum: StreamSnapshotSumAggregateOutputType | null
    _min: StreamSnapshotMinAggregateOutputType | null
    _max: StreamSnapshotMaxAggregateOutputType | null
  }

  type GetStreamSnapshotGroupByPayload<T extends StreamSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StreamSnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StreamSnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StreamSnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], StreamSnapshotGroupByOutputType[P]>
        }
      >
    >


  export type StreamSnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    streamId?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amountPerSecond?: boolean
    totalAmount?: boolean
    status?: boolean
    snapshotMonth?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["streamSnapshot"]>

  export type StreamSnapshotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    streamId?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amountPerSecond?: boolean
    totalAmount?: boolean
    status?: boolean
    snapshotMonth?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["streamSnapshot"]>

  export type StreamSnapshotSelectScalar = {
    id?: boolean
    streamId?: boolean
    sender?: boolean
    receiver?: boolean
    tokenAddress?: boolean
    amountPerSecond?: boolean
    totalAmount?: boolean
    status?: boolean
    snapshotMonth?: boolean
    createdAt?: boolean
  }


  export type $StreamSnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StreamSnapshot"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      streamId: string
      sender: string
      receiver: string
      tokenAddress: string
      amountPerSecond: bigint
      totalAmount: bigint
      status: $Enums.StreamStatus
      snapshotMonth: string
      createdAt: Date
    }, ExtArgs["result"]["streamSnapshot"]>
    composites: {}
  }

  type StreamSnapshotGetPayload<S extends boolean | null | undefined | StreamSnapshotDefaultArgs> = $Result.GetResult<Prisma.$StreamSnapshotPayload, S>

  type StreamSnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StreamSnapshotFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StreamSnapshotCountAggregateInputType | true
    }

  export interface StreamSnapshotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StreamSnapshot'], meta: { name: 'StreamSnapshot' } }
    /**
     * Find zero or one StreamSnapshot that matches the filter.
     * @param {StreamSnapshotFindUniqueArgs} args - Arguments to find a StreamSnapshot
     * @example
     * // Get one StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StreamSnapshotFindUniqueArgs>(args: SelectSubset<T, StreamSnapshotFindUniqueArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StreamSnapshot that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StreamSnapshotFindUniqueOrThrowArgs} args - Arguments to find a StreamSnapshot
     * @example
     * // Get one StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StreamSnapshotFindUniqueOrThrowArgs>(args: SelectSubset<T, StreamSnapshotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StreamSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotFindFirstArgs} args - Arguments to find a StreamSnapshot
     * @example
     * // Get one StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StreamSnapshotFindFirstArgs>(args?: SelectSubset<T, StreamSnapshotFindFirstArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StreamSnapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotFindFirstOrThrowArgs} args - Arguments to find a StreamSnapshot
     * @example
     * // Get one StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StreamSnapshotFindFirstOrThrowArgs>(args?: SelectSubset<T, StreamSnapshotFindFirstOrThrowArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StreamSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StreamSnapshots
     * const streamSnapshots = await prisma.streamSnapshot.findMany()
     * 
     * // Get first 10 StreamSnapshots
     * const streamSnapshots = await prisma.streamSnapshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const streamSnapshotWithIdOnly = await prisma.streamSnapshot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StreamSnapshotFindManyArgs>(args?: SelectSubset<T, StreamSnapshotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StreamSnapshot.
     * @param {StreamSnapshotCreateArgs} args - Arguments to create a StreamSnapshot.
     * @example
     * // Create one StreamSnapshot
     * const StreamSnapshot = await prisma.streamSnapshot.create({
     *   data: {
     *     // ... data to create a StreamSnapshot
     *   }
     * })
     * 
     */
    create<T extends StreamSnapshotCreateArgs>(args: SelectSubset<T, StreamSnapshotCreateArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StreamSnapshots.
     * @param {StreamSnapshotCreateManyArgs} args - Arguments to create many StreamSnapshots.
     * @example
     * // Create many StreamSnapshots
     * const streamSnapshot = await prisma.streamSnapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StreamSnapshotCreateManyArgs>(args?: SelectSubset<T, StreamSnapshotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StreamSnapshots and returns the data saved in the database.
     * @param {StreamSnapshotCreateManyAndReturnArgs} args - Arguments to create many StreamSnapshots.
     * @example
     * // Create many StreamSnapshots
     * const streamSnapshot = await prisma.streamSnapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StreamSnapshots and only return the `id`
     * const streamSnapshotWithIdOnly = await prisma.streamSnapshot.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StreamSnapshotCreateManyAndReturnArgs>(args?: SelectSubset<T, StreamSnapshotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StreamSnapshot.
     * @param {StreamSnapshotDeleteArgs} args - Arguments to delete one StreamSnapshot.
     * @example
     * // Delete one StreamSnapshot
     * const StreamSnapshot = await prisma.streamSnapshot.delete({
     *   where: {
     *     // ... filter to delete one StreamSnapshot
     *   }
     * })
     * 
     */
    delete<T extends StreamSnapshotDeleteArgs>(args: SelectSubset<T, StreamSnapshotDeleteArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StreamSnapshot.
     * @param {StreamSnapshotUpdateArgs} args - Arguments to update one StreamSnapshot.
     * @example
     * // Update one StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StreamSnapshotUpdateArgs>(args: SelectSubset<T, StreamSnapshotUpdateArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StreamSnapshots.
     * @param {StreamSnapshotDeleteManyArgs} args - Arguments to filter StreamSnapshots to delete.
     * @example
     * // Delete a few StreamSnapshots
     * const { count } = await prisma.streamSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StreamSnapshotDeleteManyArgs>(args?: SelectSubset<T, StreamSnapshotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StreamSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StreamSnapshots
     * const streamSnapshot = await prisma.streamSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StreamSnapshotUpdateManyArgs>(args: SelectSubset<T, StreamSnapshotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StreamSnapshot.
     * @param {StreamSnapshotUpsertArgs} args - Arguments to update or create a StreamSnapshot.
     * @example
     * // Update or create a StreamSnapshot
     * const streamSnapshot = await prisma.streamSnapshot.upsert({
     *   create: {
     *     // ... data to create a StreamSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StreamSnapshot we want to update
     *   }
     * })
     */
    upsert<T extends StreamSnapshotUpsertArgs>(args: SelectSubset<T, StreamSnapshotUpsertArgs<ExtArgs>>): Prisma__StreamSnapshotClient<$Result.GetResult<Prisma.$StreamSnapshotPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StreamSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotCountArgs} args - Arguments to filter StreamSnapshots to count.
     * @example
     * // Count the number of StreamSnapshots
     * const count = await prisma.streamSnapshot.count({
     *   where: {
     *     // ... the filter for the StreamSnapshots we want to count
     *   }
     * })
    **/
    count<T extends StreamSnapshotCountArgs>(
      args?: Subset<T, StreamSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StreamSnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StreamSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StreamSnapshotAggregateArgs>(args: Subset<T, StreamSnapshotAggregateArgs>): Prisma.PrismaPromise<GetStreamSnapshotAggregateType<T>>

    /**
     * Group by StreamSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamSnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StreamSnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StreamSnapshotGroupByArgs['orderBy'] }
        : { orderBy?: StreamSnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StreamSnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStreamSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StreamSnapshot model
   */
  readonly fields: StreamSnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StreamSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StreamSnapshotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StreamSnapshot model
   */ 
  interface StreamSnapshotFieldRefs {
    readonly id: FieldRef<"StreamSnapshot", 'String'>
    readonly streamId: FieldRef<"StreamSnapshot", 'String'>
    readonly sender: FieldRef<"StreamSnapshot", 'String'>
    readonly receiver: FieldRef<"StreamSnapshot", 'String'>
    readonly tokenAddress: FieldRef<"StreamSnapshot", 'String'>
    readonly amountPerSecond: FieldRef<"StreamSnapshot", 'BigInt'>
    readonly totalAmount: FieldRef<"StreamSnapshot", 'BigInt'>
    readonly status: FieldRef<"StreamSnapshot", 'StreamStatus'>
    readonly snapshotMonth: FieldRef<"StreamSnapshot", 'String'>
    readonly createdAt: FieldRef<"StreamSnapshot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StreamSnapshot findUnique
   */
  export type StreamSnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter, which StreamSnapshot to fetch.
     */
    where: StreamSnapshotWhereUniqueInput
  }

  /**
   * StreamSnapshot findUniqueOrThrow
   */
  export type StreamSnapshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter, which StreamSnapshot to fetch.
     */
    where: StreamSnapshotWhereUniqueInput
  }

  /**
   * StreamSnapshot findFirst
   */
  export type StreamSnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter, which StreamSnapshot to fetch.
     */
    where?: StreamSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamSnapshots to fetch.
     */
    orderBy?: StreamSnapshotOrderByWithRelationInput | StreamSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StreamSnapshots.
     */
    cursor?: StreamSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StreamSnapshots.
     */
    distinct?: StreamSnapshotScalarFieldEnum | StreamSnapshotScalarFieldEnum[]
  }

  /**
   * StreamSnapshot findFirstOrThrow
   */
  export type StreamSnapshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter, which StreamSnapshot to fetch.
     */
    where?: StreamSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamSnapshots to fetch.
     */
    orderBy?: StreamSnapshotOrderByWithRelationInput | StreamSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StreamSnapshots.
     */
    cursor?: StreamSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StreamSnapshots.
     */
    distinct?: StreamSnapshotScalarFieldEnum | StreamSnapshotScalarFieldEnum[]
  }

  /**
   * StreamSnapshot findMany
   */
  export type StreamSnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter, which StreamSnapshots to fetch.
     */
    where?: StreamSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamSnapshots to fetch.
     */
    orderBy?: StreamSnapshotOrderByWithRelationInput | StreamSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StreamSnapshots.
     */
    cursor?: StreamSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamSnapshots.
     */
    skip?: number
    distinct?: StreamSnapshotScalarFieldEnum | StreamSnapshotScalarFieldEnum[]
  }

  /**
   * StreamSnapshot create
   */
  export type StreamSnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * The data needed to create a StreamSnapshot.
     */
    data: XOR<StreamSnapshotCreateInput, StreamSnapshotUncheckedCreateInput>
  }

  /**
   * StreamSnapshot createMany
   */
  export type StreamSnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StreamSnapshots.
     */
    data: StreamSnapshotCreateManyInput | StreamSnapshotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StreamSnapshot createManyAndReturn
   */
  export type StreamSnapshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StreamSnapshots.
     */
    data: StreamSnapshotCreateManyInput | StreamSnapshotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StreamSnapshot update
   */
  export type StreamSnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * The data needed to update a StreamSnapshot.
     */
    data: XOR<StreamSnapshotUpdateInput, StreamSnapshotUncheckedUpdateInput>
    /**
     * Choose, which StreamSnapshot to update.
     */
    where: StreamSnapshotWhereUniqueInput
  }

  /**
   * StreamSnapshot updateMany
   */
  export type StreamSnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StreamSnapshots.
     */
    data: XOR<StreamSnapshotUpdateManyMutationInput, StreamSnapshotUncheckedUpdateManyInput>
    /**
     * Filter which StreamSnapshots to update
     */
    where?: StreamSnapshotWhereInput
  }

  /**
   * StreamSnapshot upsert
   */
  export type StreamSnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * The filter to search for the StreamSnapshot to update in case it exists.
     */
    where: StreamSnapshotWhereUniqueInput
    /**
     * In case the StreamSnapshot found by the `where` argument doesn't exist, create a new StreamSnapshot with this data.
     */
    create: XOR<StreamSnapshotCreateInput, StreamSnapshotUncheckedCreateInput>
    /**
     * In case the StreamSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StreamSnapshotUpdateInput, StreamSnapshotUncheckedUpdateInput>
  }

  /**
   * StreamSnapshot delete
   */
  export type StreamSnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
    /**
     * Filter which StreamSnapshot to delete.
     */
    where: StreamSnapshotWhereUniqueInput
  }

  /**
   * StreamSnapshot deleteMany
   */
  export type StreamSnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StreamSnapshots to delete
     */
    where?: StreamSnapshotWhereInput
  }

  /**
   * StreamSnapshot without action
   */
  export type StreamSnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamSnapshot
     */
    select?: StreamSnapshotSelect<ExtArgs> | null
  }


  /**
   * Model StreamArchive
   */

  export type AggregateStreamArchive = {
    _count: StreamArchiveCountAggregateOutputType | null
    _avg: StreamArchiveAvgAggregateOutputType | null
    _sum: StreamArchiveSumAggregateOutputType | null
    _min: StreamArchiveMinAggregateOutputType | null
    _max: StreamArchiveMaxAggregateOutputType | null
  }

  export type StreamArchiveAvgAggregateOutputType = {
    ledger: number | null
    amount: number | null
  }

  export type StreamArchiveSumAggregateOutputType = {
    ledger: number | null
    amount: bigint | null
  }

  export type StreamArchiveMinAggregateOutputType = {
    id: string | null
    eventType: string | null
    streamId: string | null
    txHash: string | null
    ledger: number | null
    ledgerClosedAt: string | null
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date | null
    archivedAt: Date | null
  }

  export type StreamArchiveMaxAggregateOutputType = {
    id: string | null
    eventType: string | null
    streamId: string | null
    txHash: string | null
    ledger: number | null
    ledgerClosedAt: string | null
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date | null
    archivedAt: Date | null
  }

  export type StreamArchiveCountAggregateOutputType = {
    id: number
    eventType: number
    streamId: number
    txHash: number
    ledger: number
    ledgerClosedAt: number
    sender: number
    receiver: number
    amount: number
    metadata: number
    createdAt: number
    archivedAt: number
    _all: number
  }


  export type StreamArchiveAvgAggregateInputType = {
    ledger?: true
    amount?: true
  }

  export type StreamArchiveSumAggregateInputType = {
    ledger?: true
    amount?: true
  }

  export type StreamArchiveMinAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
    archivedAt?: true
  }

  export type StreamArchiveMaxAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
    archivedAt?: true
  }

  export type StreamArchiveCountAggregateInputType = {
    id?: true
    eventType?: true
    streamId?: true
    txHash?: true
    ledger?: true
    ledgerClosedAt?: true
    sender?: true
    receiver?: true
    amount?: true
    metadata?: true
    createdAt?: true
    archivedAt?: true
    _all?: true
  }

  export type StreamArchiveAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StreamArchive to aggregate.
     */
    where?: StreamArchiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamArchives to fetch.
     */
    orderBy?: StreamArchiveOrderByWithRelationInput | StreamArchiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StreamArchiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamArchives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamArchives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StreamArchives
    **/
    _count?: true | StreamArchiveCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: StreamArchiveAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: StreamArchiveSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StreamArchiveMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StreamArchiveMaxAggregateInputType
  }

  export type GetStreamArchiveAggregateType<T extends StreamArchiveAggregateArgs> = {
        [P in keyof T & keyof AggregateStreamArchive]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStreamArchive[P]>
      : GetScalarType<T[P], AggregateStreamArchive[P]>
  }




  export type StreamArchiveGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StreamArchiveWhereInput
    orderBy?: StreamArchiveOrderByWithAggregationInput | StreamArchiveOrderByWithAggregationInput[]
    by: StreamArchiveScalarFieldEnum[] | StreamArchiveScalarFieldEnum
    having?: StreamArchiveScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StreamArchiveCountAggregateInputType | true
    _avg?: StreamArchiveAvgAggregateInputType
    _sum?: StreamArchiveSumAggregateInputType
    _min?: StreamArchiveMinAggregateInputType
    _max?: StreamArchiveMaxAggregateInputType
  }

  export type StreamArchiveGroupByOutputType = {
    id: string
    eventType: string
    streamId: string
    txHash: string
    ledger: number
    ledgerClosedAt: string
    sender: string | null
    receiver: string | null
    amount: bigint | null
    metadata: string | null
    createdAt: Date
    archivedAt: Date
    _count: StreamArchiveCountAggregateOutputType | null
    _avg: StreamArchiveAvgAggregateOutputType | null
    _sum: StreamArchiveSumAggregateOutputType | null
    _min: StreamArchiveMinAggregateOutputType | null
    _max: StreamArchiveMaxAggregateOutputType | null
  }

  type GetStreamArchiveGroupByPayload<T extends StreamArchiveGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StreamArchiveGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StreamArchiveGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StreamArchiveGroupByOutputType[P]>
            : GetScalarType<T[P], StreamArchiveGroupByOutputType[P]>
        }
      >
    >


  export type StreamArchiveSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
    archivedAt?: boolean
  }, ExtArgs["result"]["streamArchive"]>

  export type StreamArchiveSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
    archivedAt?: boolean
  }, ExtArgs["result"]["streamArchive"]>

  export type StreamArchiveSelectScalar = {
    id?: boolean
    eventType?: boolean
    streamId?: boolean
    txHash?: boolean
    ledger?: boolean
    ledgerClosedAt?: boolean
    sender?: boolean
    receiver?: boolean
    amount?: boolean
    metadata?: boolean
    createdAt?: boolean
    archivedAt?: boolean
  }


  export type $StreamArchivePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StreamArchive"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventType: string
      streamId: string
      txHash: string
      ledger: number
      ledgerClosedAt: string
      sender: string | null
      receiver: string | null
      amount: bigint | null
      metadata: string | null
      createdAt: Date
      archivedAt: Date
    }, ExtArgs["result"]["streamArchive"]>
    composites: {}
  }

  type StreamArchiveGetPayload<S extends boolean | null | undefined | StreamArchiveDefaultArgs> = $Result.GetResult<Prisma.$StreamArchivePayload, S>

  type StreamArchiveCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<StreamArchiveFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: StreamArchiveCountAggregateInputType | true
    }

  export interface StreamArchiveDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StreamArchive'], meta: { name: 'StreamArchive' } }
    /**
     * Find zero or one StreamArchive that matches the filter.
     * @param {StreamArchiveFindUniqueArgs} args - Arguments to find a StreamArchive
     * @example
     * // Get one StreamArchive
     * const streamArchive = await prisma.streamArchive.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StreamArchiveFindUniqueArgs>(args: SelectSubset<T, StreamArchiveFindUniqueArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one StreamArchive that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {StreamArchiveFindUniqueOrThrowArgs} args - Arguments to find a StreamArchive
     * @example
     * // Get one StreamArchive
     * const streamArchive = await prisma.streamArchive.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StreamArchiveFindUniqueOrThrowArgs>(args: SelectSubset<T, StreamArchiveFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first StreamArchive that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveFindFirstArgs} args - Arguments to find a StreamArchive
     * @example
     * // Get one StreamArchive
     * const streamArchive = await prisma.streamArchive.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StreamArchiveFindFirstArgs>(args?: SelectSubset<T, StreamArchiveFindFirstArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first StreamArchive that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveFindFirstOrThrowArgs} args - Arguments to find a StreamArchive
     * @example
     * // Get one StreamArchive
     * const streamArchive = await prisma.streamArchive.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StreamArchiveFindFirstOrThrowArgs>(args?: SelectSubset<T, StreamArchiveFindFirstOrThrowArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more StreamArchives that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StreamArchives
     * const streamArchives = await prisma.streamArchive.findMany()
     * 
     * // Get first 10 StreamArchives
     * const streamArchives = await prisma.streamArchive.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const streamArchiveWithIdOnly = await prisma.streamArchive.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StreamArchiveFindManyArgs>(args?: SelectSubset<T, StreamArchiveFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a StreamArchive.
     * @param {StreamArchiveCreateArgs} args - Arguments to create a StreamArchive.
     * @example
     * // Create one StreamArchive
     * const StreamArchive = await prisma.streamArchive.create({
     *   data: {
     *     // ... data to create a StreamArchive
     *   }
     * })
     * 
     */
    create<T extends StreamArchiveCreateArgs>(args: SelectSubset<T, StreamArchiveCreateArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many StreamArchives.
     * @param {StreamArchiveCreateManyArgs} args - Arguments to create many StreamArchives.
     * @example
     * // Create many StreamArchives
     * const streamArchive = await prisma.streamArchive.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StreamArchiveCreateManyArgs>(args?: SelectSubset<T, StreamArchiveCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StreamArchives and returns the data saved in the database.
     * @param {StreamArchiveCreateManyAndReturnArgs} args - Arguments to create many StreamArchives.
     * @example
     * // Create many StreamArchives
     * const streamArchive = await prisma.streamArchive.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StreamArchives and only return the `id`
     * const streamArchiveWithIdOnly = await prisma.streamArchive.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StreamArchiveCreateManyAndReturnArgs>(args?: SelectSubset<T, StreamArchiveCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a StreamArchive.
     * @param {StreamArchiveDeleteArgs} args - Arguments to delete one StreamArchive.
     * @example
     * // Delete one StreamArchive
     * const StreamArchive = await prisma.streamArchive.delete({
     *   where: {
     *     // ... filter to delete one StreamArchive
     *   }
     * })
     * 
     */
    delete<T extends StreamArchiveDeleteArgs>(args: SelectSubset<T, StreamArchiveDeleteArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one StreamArchive.
     * @param {StreamArchiveUpdateArgs} args - Arguments to update one StreamArchive.
     * @example
     * // Update one StreamArchive
     * const streamArchive = await prisma.streamArchive.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StreamArchiveUpdateArgs>(args: SelectSubset<T, StreamArchiveUpdateArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more StreamArchives.
     * @param {StreamArchiveDeleteManyArgs} args - Arguments to filter StreamArchives to delete.
     * @example
     * // Delete a few StreamArchives
     * const { count } = await prisma.streamArchive.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StreamArchiveDeleteManyArgs>(args?: SelectSubset<T, StreamArchiveDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StreamArchives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StreamArchives
     * const streamArchive = await prisma.streamArchive.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StreamArchiveUpdateManyArgs>(args: SelectSubset<T, StreamArchiveUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one StreamArchive.
     * @param {StreamArchiveUpsertArgs} args - Arguments to update or create a StreamArchive.
     * @example
     * // Update or create a StreamArchive
     * const streamArchive = await prisma.streamArchive.upsert({
     *   create: {
     *     // ... data to create a StreamArchive
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StreamArchive we want to update
     *   }
     * })
     */
    upsert<T extends StreamArchiveUpsertArgs>(args: SelectSubset<T, StreamArchiveUpsertArgs<ExtArgs>>): Prisma__StreamArchiveClient<$Result.GetResult<Prisma.$StreamArchivePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of StreamArchives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveCountArgs} args - Arguments to filter StreamArchives to count.
     * @example
     * // Count the number of StreamArchives
     * const count = await prisma.streamArchive.count({
     *   where: {
     *     // ... the filter for the StreamArchives we want to count
     *   }
     * })
    **/
    count<T extends StreamArchiveCountArgs>(
      args?: Subset<T, StreamArchiveCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StreamArchiveCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StreamArchive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StreamArchiveAggregateArgs>(args: Subset<T, StreamArchiveAggregateArgs>): Prisma.PrismaPromise<GetStreamArchiveAggregateType<T>>

    /**
     * Group by StreamArchive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StreamArchiveGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends StreamArchiveGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StreamArchiveGroupByArgs['orderBy'] }
        : { orderBy?: StreamArchiveGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StreamArchiveGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStreamArchiveGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StreamArchive model
   */
  readonly fields: StreamArchiveFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StreamArchive.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StreamArchiveClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StreamArchive model
   */ 
  interface StreamArchiveFieldRefs {
    readonly id: FieldRef<"StreamArchive", 'String'>
    readonly eventType: FieldRef<"StreamArchive", 'String'>
    readonly streamId: FieldRef<"StreamArchive", 'String'>
    readonly txHash: FieldRef<"StreamArchive", 'String'>
    readonly ledger: FieldRef<"StreamArchive", 'Int'>
    readonly ledgerClosedAt: FieldRef<"StreamArchive", 'String'>
    readonly sender: FieldRef<"StreamArchive", 'String'>
    readonly receiver: FieldRef<"StreamArchive", 'String'>
    readonly amount: FieldRef<"StreamArchive", 'BigInt'>
    readonly metadata: FieldRef<"StreamArchive", 'String'>
    readonly createdAt: FieldRef<"StreamArchive", 'DateTime'>
    readonly archivedAt: FieldRef<"StreamArchive", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StreamArchive findUnique
   */
  export type StreamArchiveFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter, which StreamArchive to fetch.
     */
    where: StreamArchiveWhereUniqueInput
  }

  /**
   * StreamArchive findUniqueOrThrow
   */
  export type StreamArchiveFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter, which StreamArchive to fetch.
     */
    where: StreamArchiveWhereUniqueInput
  }

  /**
   * StreamArchive findFirst
   */
  export type StreamArchiveFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter, which StreamArchive to fetch.
     */
    where?: StreamArchiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamArchives to fetch.
     */
    orderBy?: StreamArchiveOrderByWithRelationInput | StreamArchiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StreamArchives.
     */
    cursor?: StreamArchiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamArchives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamArchives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StreamArchives.
     */
    distinct?: StreamArchiveScalarFieldEnum | StreamArchiveScalarFieldEnum[]
  }

  /**
   * StreamArchive findFirstOrThrow
   */
  export type StreamArchiveFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter, which StreamArchive to fetch.
     */
    where?: StreamArchiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamArchives to fetch.
     */
    orderBy?: StreamArchiveOrderByWithRelationInput | StreamArchiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StreamArchives.
     */
    cursor?: StreamArchiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamArchives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamArchives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StreamArchives.
     */
    distinct?: StreamArchiveScalarFieldEnum | StreamArchiveScalarFieldEnum[]
  }

  /**
   * StreamArchive findMany
   */
  export type StreamArchiveFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter, which StreamArchives to fetch.
     */
    where?: StreamArchiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StreamArchives to fetch.
     */
    orderBy?: StreamArchiveOrderByWithRelationInput | StreamArchiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StreamArchives.
     */
    cursor?: StreamArchiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StreamArchives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StreamArchives.
     */
    skip?: number
    distinct?: StreamArchiveScalarFieldEnum | StreamArchiveScalarFieldEnum[]
  }

  /**
   * StreamArchive create
   */
  export type StreamArchiveCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * The data needed to create a StreamArchive.
     */
    data: XOR<StreamArchiveCreateInput, StreamArchiveUncheckedCreateInput>
  }

  /**
   * StreamArchive createMany
   */
  export type StreamArchiveCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StreamArchives.
     */
    data: StreamArchiveCreateManyInput | StreamArchiveCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StreamArchive createManyAndReturn
   */
  export type StreamArchiveCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many StreamArchives.
     */
    data: StreamArchiveCreateManyInput | StreamArchiveCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StreamArchive update
   */
  export type StreamArchiveUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * The data needed to update a StreamArchive.
     */
    data: XOR<StreamArchiveUpdateInput, StreamArchiveUncheckedUpdateInput>
    /**
     * Choose, which StreamArchive to update.
     */
    where: StreamArchiveWhereUniqueInput
  }

  /**
   * StreamArchive updateMany
   */
  export type StreamArchiveUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StreamArchives.
     */
    data: XOR<StreamArchiveUpdateManyMutationInput, StreamArchiveUncheckedUpdateManyInput>
    /**
     * Filter which StreamArchives to update
     */
    where?: StreamArchiveWhereInput
  }

  /**
   * StreamArchive upsert
   */
  export type StreamArchiveUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * The filter to search for the StreamArchive to update in case it exists.
     */
    where: StreamArchiveWhereUniqueInput
    /**
     * In case the StreamArchive found by the `where` argument doesn't exist, create a new StreamArchive with this data.
     */
    create: XOR<StreamArchiveCreateInput, StreamArchiveUncheckedCreateInput>
    /**
     * In case the StreamArchive was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StreamArchiveUpdateInput, StreamArchiveUncheckedUpdateInput>
  }

  /**
   * StreamArchive delete
   */
  export type StreamArchiveDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
    /**
     * Filter which StreamArchive to delete.
     */
    where: StreamArchiveWhereUniqueInput
  }

  /**
   * StreamArchive deleteMany
   */
  export type StreamArchiveDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StreamArchives to delete
     */
    where?: StreamArchiveWhereInput
  }

  /**
   * StreamArchive without action
   */
  export type StreamArchiveDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StreamArchive
     */
    select?: StreamArchiveSelect<ExtArgs> | null
  }


  /**
   * Model BridgeLog
   */

  export type AggregateBridgeLog = {
    _count: BridgeLogCountAggregateOutputType | null
    _min: BridgeLogMinAggregateOutputType | null
    _max: BridgeLogMaxAggregateOutputType | null
  }

  export type BridgeLogMinAggregateOutputType = {
    id: string | null
    bridge: string | null
    eventType: string | null
    sourceChain: string | null
    targetChain: string | null
    sourceAsset: string | null
    targetAsset: string | null
    amount: string | null
    sender: string | null
    recipient: string | null
    txHash: string | null
    status: string | null
    payload: string | null
    landedAt: Date | null
    createdAt: Date | null
  }

  export type BridgeLogMaxAggregateOutputType = {
    id: string | null
    bridge: string | null
    eventType: string | null
    sourceChain: string | null
    targetChain: string | null
    sourceAsset: string | null
    targetAsset: string | null
    amount: string | null
    sender: string | null
    recipient: string | null
    txHash: string | null
    status: string | null
    payload: string | null
    landedAt: Date | null
    createdAt: Date | null
  }

  export type BridgeLogCountAggregateOutputType = {
    id: number
    bridge: number
    eventType: number
    sourceChain: number
    targetChain: number
    sourceAsset: number
    targetAsset: number
    amount: number
    sender: number
    recipient: number
    txHash: number
    status: number
    payload: number
    landedAt: number
    createdAt: number
    _all: number
  }


  export type BridgeLogMinAggregateInputType = {
    id?: true
    bridge?: true
    eventType?: true
    sourceChain?: true
    targetChain?: true
    sourceAsset?: true
    targetAsset?: true
    amount?: true
    sender?: true
    recipient?: true
    txHash?: true
    status?: true
    payload?: true
    landedAt?: true
    createdAt?: true
  }

  export type BridgeLogMaxAggregateInputType = {
    id?: true
    bridge?: true
    eventType?: true
    sourceChain?: true
    targetChain?: true
    sourceAsset?: true
    targetAsset?: true
    amount?: true
    sender?: true
    recipient?: true
    txHash?: true
    status?: true
    payload?: true
    landedAt?: true
    createdAt?: true
  }

  export type BridgeLogCountAggregateInputType = {
    id?: true
    bridge?: true
    eventType?: true
    sourceChain?: true
    targetChain?: true
    sourceAsset?: true
    targetAsset?: true
    amount?: true
    sender?: true
    recipient?: true
    txHash?: true
    status?: true
    payload?: true
    landedAt?: true
    createdAt?: true
    _all?: true
  }

  export type BridgeLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BridgeLog to aggregate.
     */
    where?: BridgeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BridgeLogs to fetch.
     */
    orderBy?: BridgeLogOrderByWithRelationInput | BridgeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BridgeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BridgeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BridgeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BridgeLogs
    **/
    _count?: true | BridgeLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BridgeLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BridgeLogMaxAggregateInputType
  }

  export type GetBridgeLogAggregateType<T extends BridgeLogAggregateArgs> = {
        [P in keyof T & keyof AggregateBridgeLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBridgeLog[P]>
      : GetScalarType<T[P], AggregateBridgeLog[P]>
  }




  export type BridgeLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BridgeLogWhereInput
    orderBy?: BridgeLogOrderByWithAggregationInput | BridgeLogOrderByWithAggregationInput[]
    by: BridgeLogScalarFieldEnum[] | BridgeLogScalarFieldEnum
    having?: BridgeLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BridgeLogCountAggregateInputType | true
    _min?: BridgeLogMinAggregateInputType
    _max?: BridgeLogMaxAggregateInputType
  }

  export type BridgeLogGroupByOutputType = {
    id: string
    bridge: string
    eventType: string
    sourceChain: string
    targetChain: string
    sourceAsset: string
    targetAsset: string | null
    amount: string
    sender: string | null
    recipient: string
    txHash: string
    status: string
    payload: string | null
    landedAt: Date | null
    createdAt: Date
    _count: BridgeLogCountAggregateOutputType | null
    _min: BridgeLogMinAggregateOutputType | null
    _max: BridgeLogMaxAggregateOutputType | null
  }

  type GetBridgeLogGroupByPayload<T extends BridgeLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BridgeLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BridgeLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BridgeLogGroupByOutputType[P]>
            : GetScalarType<T[P], BridgeLogGroupByOutputType[P]>
        }
      >
    >


  export type BridgeLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bridge?: boolean
    eventType?: boolean
    sourceChain?: boolean
    targetChain?: boolean
    sourceAsset?: boolean
    targetAsset?: boolean
    amount?: boolean
    sender?: boolean
    recipient?: boolean
    txHash?: boolean
    status?: boolean
    payload?: boolean
    landedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["bridgeLog"]>

  export type BridgeLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bridge?: boolean
    eventType?: boolean
    sourceChain?: boolean
    targetChain?: boolean
    sourceAsset?: boolean
    targetAsset?: boolean
    amount?: boolean
    sender?: boolean
    recipient?: boolean
    txHash?: boolean
    status?: boolean
    payload?: boolean
    landedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["bridgeLog"]>

  export type BridgeLogSelectScalar = {
    id?: boolean
    bridge?: boolean
    eventType?: boolean
    sourceChain?: boolean
    targetChain?: boolean
    sourceAsset?: boolean
    targetAsset?: boolean
    amount?: boolean
    sender?: boolean
    recipient?: boolean
    txHash?: boolean
    status?: boolean
    payload?: boolean
    landedAt?: boolean
    createdAt?: boolean
  }


  export type $BridgeLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BridgeLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      bridge: string
      eventType: string
      sourceChain: string
      targetChain: string
      sourceAsset: string
      targetAsset: string | null
      amount: string
      sender: string | null
      recipient: string
      txHash: string
      status: string
      payload: string | null
      landedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["bridgeLog"]>
    composites: {}
  }

  type BridgeLogGetPayload<S extends boolean | null | undefined | BridgeLogDefaultArgs> = $Result.GetResult<Prisma.$BridgeLogPayload, S>

  type BridgeLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BridgeLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BridgeLogCountAggregateInputType | true
    }

  export interface BridgeLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BridgeLog'], meta: { name: 'BridgeLog' } }
    /**
     * Find zero or one BridgeLog that matches the filter.
     * @param {BridgeLogFindUniqueArgs} args - Arguments to find a BridgeLog
     * @example
     * // Get one BridgeLog
     * const bridgeLog = await prisma.bridgeLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BridgeLogFindUniqueArgs>(args: SelectSubset<T, BridgeLogFindUniqueArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one BridgeLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BridgeLogFindUniqueOrThrowArgs} args - Arguments to find a BridgeLog
     * @example
     * // Get one BridgeLog
     * const bridgeLog = await prisma.bridgeLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BridgeLogFindUniqueOrThrowArgs>(args: SelectSubset<T, BridgeLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first BridgeLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogFindFirstArgs} args - Arguments to find a BridgeLog
     * @example
     * // Get one BridgeLog
     * const bridgeLog = await prisma.bridgeLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BridgeLogFindFirstArgs>(args?: SelectSubset<T, BridgeLogFindFirstArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first BridgeLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogFindFirstOrThrowArgs} args - Arguments to find a BridgeLog
     * @example
     * // Get one BridgeLog
     * const bridgeLog = await prisma.bridgeLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BridgeLogFindFirstOrThrowArgs>(args?: SelectSubset<T, BridgeLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more BridgeLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BridgeLogs
     * const bridgeLogs = await prisma.bridgeLog.findMany()
     * 
     * // Get first 10 BridgeLogs
     * const bridgeLogs = await prisma.bridgeLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bridgeLogWithIdOnly = await prisma.bridgeLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BridgeLogFindManyArgs>(args?: SelectSubset<T, BridgeLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a BridgeLog.
     * @param {BridgeLogCreateArgs} args - Arguments to create a BridgeLog.
     * @example
     * // Create one BridgeLog
     * const BridgeLog = await prisma.bridgeLog.create({
     *   data: {
     *     // ... data to create a BridgeLog
     *   }
     * })
     * 
     */
    create<T extends BridgeLogCreateArgs>(args: SelectSubset<T, BridgeLogCreateArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many BridgeLogs.
     * @param {BridgeLogCreateManyArgs} args - Arguments to create many BridgeLogs.
     * @example
     * // Create many BridgeLogs
     * const bridgeLog = await prisma.bridgeLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BridgeLogCreateManyArgs>(args?: SelectSubset<T, BridgeLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BridgeLogs and returns the data saved in the database.
     * @param {BridgeLogCreateManyAndReturnArgs} args - Arguments to create many BridgeLogs.
     * @example
     * // Create many BridgeLogs
     * const bridgeLog = await prisma.bridgeLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BridgeLogs and only return the `id`
     * const bridgeLogWithIdOnly = await prisma.bridgeLog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BridgeLogCreateManyAndReturnArgs>(args?: SelectSubset<T, BridgeLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a BridgeLog.
     * @param {BridgeLogDeleteArgs} args - Arguments to delete one BridgeLog.
     * @example
     * // Delete one BridgeLog
     * const BridgeLog = await prisma.bridgeLog.delete({
     *   where: {
     *     // ... filter to delete one BridgeLog
     *   }
     * })
     * 
     */
    delete<T extends BridgeLogDeleteArgs>(args: SelectSubset<T, BridgeLogDeleteArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one BridgeLog.
     * @param {BridgeLogUpdateArgs} args - Arguments to update one BridgeLog.
     * @example
     * // Update one BridgeLog
     * const bridgeLog = await prisma.bridgeLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BridgeLogUpdateArgs>(args: SelectSubset<T, BridgeLogUpdateArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more BridgeLogs.
     * @param {BridgeLogDeleteManyArgs} args - Arguments to filter BridgeLogs to delete.
     * @example
     * // Delete a few BridgeLogs
     * const { count } = await prisma.bridgeLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BridgeLogDeleteManyArgs>(args?: SelectSubset<T, BridgeLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BridgeLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BridgeLogs
     * const bridgeLog = await prisma.bridgeLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BridgeLogUpdateManyArgs>(args: SelectSubset<T, BridgeLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BridgeLog.
     * @param {BridgeLogUpsertArgs} args - Arguments to update or create a BridgeLog.
     * @example
     * // Update or create a BridgeLog
     * const bridgeLog = await prisma.bridgeLog.upsert({
     *   create: {
     *     // ... data to create a BridgeLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BridgeLog we want to update
     *   }
     * })
     */
    upsert<T extends BridgeLogUpsertArgs>(args: SelectSubset<T, BridgeLogUpsertArgs<ExtArgs>>): Prisma__BridgeLogClient<$Result.GetResult<Prisma.$BridgeLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of BridgeLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogCountArgs} args - Arguments to filter BridgeLogs to count.
     * @example
     * // Count the number of BridgeLogs
     * const count = await prisma.bridgeLog.count({
     *   where: {
     *     // ... the filter for the BridgeLogs we want to count
     *   }
     * })
    **/
    count<T extends BridgeLogCountArgs>(
      args?: Subset<T, BridgeLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BridgeLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BridgeLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BridgeLogAggregateArgs>(args: Subset<T, BridgeLogAggregateArgs>): Prisma.PrismaPromise<GetBridgeLogAggregateType<T>>

    /**
     * Group by BridgeLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BridgeLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BridgeLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BridgeLogGroupByArgs['orderBy'] }
        : { orderBy?: BridgeLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BridgeLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBridgeLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BridgeLog model
   */
  readonly fields: BridgeLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BridgeLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BridgeLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BridgeLog model
   */ 
  interface BridgeLogFieldRefs {
    readonly id: FieldRef<"BridgeLog", 'String'>
    readonly bridge: FieldRef<"BridgeLog", 'String'>
    readonly eventType: FieldRef<"BridgeLog", 'String'>
    readonly sourceChain: FieldRef<"BridgeLog", 'String'>
    readonly targetChain: FieldRef<"BridgeLog", 'String'>
    readonly sourceAsset: FieldRef<"BridgeLog", 'String'>
    readonly targetAsset: FieldRef<"BridgeLog", 'String'>
    readonly amount: FieldRef<"BridgeLog", 'String'>
    readonly sender: FieldRef<"BridgeLog", 'String'>
    readonly recipient: FieldRef<"BridgeLog", 'String'>
    readonly txHash: FieldRef<"BridgeLog", 'String'>
    readonly status: FieldRef<"BridgeLog", 'String'>
    readonly payload: FieldRef<"BridgeLog", 'String'>
    readonly landedAt: FieldRef<"BridgeLog", 'DateTime'>
    readonly createdAt: FieldRef<"BridgeLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BridgeLog findUnique
   */
  export type BridgeLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter, which BridgeLog to fetch.
     */
    where: BridgeLogWhereUniqueInput
  }

  /**
   * BridgeLog findUniqueOrThrow
   */
  export type BridgeLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter, which BridgeLog to fetch.
     */
    where: BridgeLogWhereUniqueInput
  }

  /**
   * BridgeLog findFirst
   */
  export type BridgeLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter, which BridgeLog to fetch.
     */
    where?: BridgeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BridgeLogs to fetch.
     */
    orderBy?: BridgeLogOrderByWithRelationInput | BridgeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BridgeLogs.
     */
    cursor?: BridgeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BridgeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BridgeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BridgeLogs.
     */
    distinct?: BridgeLogScalarFieldEnum | BridgeLogScalarFieldEnum[]
  }

  /**
   * BridgeLog findFirstOrThrow
   */
  export type BridgeLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter, which BridgeLog to fetch.
     */
    where?: BridgeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BridgeLogs to fetch.
     */
    orderBy?: BridgeLogOrderByWithRelationInput | BridgeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BridgeLogs.
     */
    cursor?: BridgeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BridgeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BridgeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BridgeLogs.
     */
    distinct?: BridgeLogScalarFieldEnum | BridgeLogScalarFieldEnum[]
  }

  /**
   * BridgeLog findMany
   */
  export type BridgeLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter, which BridgeLogs to fetch.
     */
    where?: BridgeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BridgeLogs to fetch.
     */
    orderBy?: BridgeLogOrderByWithRelationInput | BridgeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BridgeLogs.
     */
    cursor?: BridgeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BridgeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BridgeLogs.
     */
    skip?: number
    distinct?: BridgeLogScalarFieldEnum | BridgeLogScalarFieldEnum[]
  }

  /**
   * BridgeLog create
   */
  export type BridgeLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * The data needed to create a BridgeLog.
     */
    data: XOR<BridgeLogCreateInput, BridgeLogUncheckedCreateInput>
  }

  /**
   * BridgeLog createMany
   */
  export type BridgeLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BridgeLogs.
     */
    data: BridgeLogCreateManyInput | BridgeLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BridgeLog createManyAndReturn
   */
  export type BridgeLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many BridgeLogs.
     */
    data: BridgeLogCreateManyInput | BridgeLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BridgeLog update
   */
  export type BridgeLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * The data needed to update a BridgeLog.
     */
    data: XOR<BridgeLogUpdateInput, BridgeLogUncheckedUpdateInput>
    /**
     * Choose, which BridgeLog to update.
     */
    where: BridgeLogWhereUniqueInput
  }

  /**
   * BridgeLog updateMany
   */
  export type BridgeLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BridgeLogs.
     */
    data: XOR<BridgeLogUpdateManyMutationInput, BridgeLogUncheckedUpdateManyInput>
    /**
     * Filter which BridgeLogs to update
     */
    where?: BridgeLogWhereInput
  }

  /**
   * BridgeLog upsert
   */
  export type BridgeLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * The filter to search for the BridgeLog to update in case it exists.
     */
    where: BridgeLogWhereUniqueInput
    /**
     * In case the BridgeLog found by the `where` argument doesn't exist, create a new BridgeLog with this data.
     */
    create: XOR<BridgeLogCreateInput, BridgeLogUncheckedCreateInput>
    /**
     * In case the BridgeLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BridgeLogUpdateInput, BridgeLogUncheckedUpdateInput>
  }

  /**
   * BridgeLog delete
   */
  export type BridgeLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
    /**
     * Filter which BridgeLog to delete.
     */
    where: BridgeLogWhereUniqueInput
  }

  /**
   * BridgeLog deleteMany
   */
  export type BridgeLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BridgeLogs to delete
     */
    where?: BridgeLogWhereInput
  }

  /**
   * BridgeLog without action
   */
  export type BridgeLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BridgeLog
     */
    select?: BridgeLogSelect<ExtArgs> | null
  }


  /**
   * Model Proposal
   */

  export type AggregateProposal = {
    _count: ProposalCountAggregateOutputType | null
    _avg: ProposalAvgAggregateOutputType | null
    _sum: ProposalSumAggregateOutputType | null
    _min: ProposalMinAggregateOutputType | null
    _max: ProposalMaxAggregateOutputType | null
  }

  export type ProposalAvgAggregateOutputType = {
    quorum: number | null
    votesFor: number | null
    votesAgainst: number | null
  }

  export type ProposalSumAggregateOutputType = {
    quorum: number | null
    votesFor: number | null
    votesAgainst: number | null
  }

  export type ProposalMinAggregateOutputType = {
    id: string | null
    creator: string | null
    description: string | null
    quorum: number | null
    votesFor: number | null
    votesAgainst: number | null
    txHash: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProposalMaxAggregateOutputType = {
    id: string | null
    creator: string | null
    description: string | null
    quorum: number | null
    votesFor: number | null
    votesAgainst: number | null
    txHash: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProposalCountAggregateOutputType = {
    id: number
    creator: number
    description: number
    quorum: number
    votesFor: number
    votesAgainst: number
    txHash: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProposalAvgAggregateInputType = {
    quorum?: true
    votesFor?: true
    votesAgainst?: true
  }

  export type ProposalSumAggregateInputType = {
    quorum?: true
    votesFor?: true
    votesAgainst?: true
  }

  export type ProposalMinAggregateInputType = {
    id?: true
    creator?: true
    description?: true
    quorum?: true
    votesFor?: true
    votesAgainst?: true
    txHash?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProposalMaxAggregateInputType = {
    id?: true
    creator?: true
    description?: true
    quorum?: true
    votesFor?: true
    votesAgainst?: true
    txHash?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProposalCountAggregateInputType = {
    id?: true
    creator?: true
    description?: true
    quorum?: true
    votesFor?: true
    votesAgainst?: true
    txHash?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProposalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Proposal to aggregate.
     */
    where?: ProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Proposals to fetch.
     */
    orderBy?: ProposalOrderByWithRelationInput | ProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Proposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Proposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Proposals
    **/
    _count?: true | ProposalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProposalAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProposalSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProposalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProposalMaxAggregateInputType
  }

  export type GetProposalAggregateType<T extends ProposalAggregateArgs> = {
        [P in keyof T & keyof AggregateProposal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProposal[P]>
      : GetScalarType<T[P], AggregateProposal[P]>
  }




  export type ProposalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProposalWhereInput
    orderBy?: ProposalOrderByWithAggregationInput | ProposalOrderByWithAggregationInput[]
    by: ProposalScalarFieldEnum[] | ProposalScalarFieldEnum
    having?: ProposalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProposalCountAggregateInputType | true
    _avg?: ProposalAvgAggregateInputType
    _sum?: ProposalSumAggregateInputType
    _min?: ProposalMinAggregateInputType
    _max?: ProposalMaxAggregateInputType
  }

  export type ProposalGroupByOutputType = {
    id: string
    creator: string
    description: string
    quorum: number
    votesFor: number
    votesAgainst: number
    txHash: string
    createdAt: Date
    updatedAt: Date
    _count: ProposalCountAggregateOutputType | null
    _avg: ProposalAvgAggregateOutputType | null
    _sum: ProposalSumAggregateOutputType | null
    _min: ProposalMinAggregateOutputType | null
    _max: ProposalMaxAggregateOutputType | null
  }

  type GetProposalGroupByPayload<T extends ProposalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProposalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProposalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProposalGroupByOutputType[P]>
            : GetScalarType<T[P], ProposalGroupByOutputType[P]>
        }
      >
    >


  export type ProposalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creator?: boolean
    description?: boolean
    quorum?: boolean
    votesFor?: boolean
    votesAgainst?: boolean
    txHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["proposal"]>

  export type ProposalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creator?: boolean
    description?: boolean
    quorum?: boolean
    votesFor?: boolean
    votesAgainst?: boolean
    txHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["proposal"]>

  export type ProposalSelectScalar = {
    id?: boolean
    creator?: boolean
    description?: boolean
    quorum?: boolean
    votesFor?: boolean
    votesAgainst?: boolean
    txHash?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ProposalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Proposal"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      creator: string
      description: string
      quorum: number
      votesFor: number
      votesAgainst: number
      txHash: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["proposal"]>
    composites: {}
  }

  type ProposalGetPayload<S extends boolean | null | undefined | ProposalDefaultArgs> = $Result.GetResult<Prisma.$ProposalPayload, S>

  type ProposalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ProposalFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ProposalCountAggregateInputType | true
    }

  export interface ProposalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Proposal'], meta: { name: 'Proposal' } }
    /**
     * Find zero or one Proposal that matches the filter.
     * @param {ProposalFindUniqueArgs} args - Arguments to find a Proposal
     * @example
     * // Get one Proposal
     * const proposal = await prisma.proposal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProposalFindUniqueArgs>(args: SelectSubset<T, ProposalFindUniqueArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Proposal that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ProposalFindUniqueOrThrowArgs} args - Arguments to find a Proposal
     * @example
     * // Get one Proposal
     * const proposal = await prisma.proposal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProposalFindUniqueOrThrowArgs>(args: SelectSubset<T, ProposalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Proposal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalFindFirstArgs} args - Arguments to find a Proposal
     * @example
     * // Get one Proposal
     * const proposal = await prisma.proposal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProposalFindFirstArgs>(args?: SelectSubset<T, ProposalFindFirstArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Proposal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalFindFirstOrThrowArgs} args - Arguments to find a Proposal
     * @example
     * // Get one Proposal
     * const proposal = await prisma.proposal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProposalFindFirstOrThrowArgs>(args?: SelectSubset<T, ProposalFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Proposals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Proposals
     * const proposals = await prisma.proposal.findMany()
     * 
     * // Get first 10 Proposals
     * const proposals = await prisma.proposal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const proposalWithIdOnly = await prisma.proposal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProposalFindManyArgs>(args?: SelectSubset<T, ProposalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Proposal.
     * @param {ProposalCreateArgs} args - Arguments to create a Proposal.
     * @example
     * // Create one Proposal
     * const Proposal = await prisma.proposal.create({
     *   data: {
     *     // ... data to create a Proposal
     *   }
     * })
     * 
     */
    create<T extends ProposalCreateArgs>(args: SelectSubset<T, ProposalCreateArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Proposals.
     * @param {ProposalCreateManyArgs} args - Arguments to create many Proposals.
     * @example
     * // Create many Proposals
     * const proposal = await prisma.proposal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProposalCreateManyArgs>(args?: SelectSubset<T, ProposalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Proposals and returns the data saved in the database.
     * @param {ProposalCreateManyAndReturnArgs} args - Arguments to create many Proposals.
     * @example
     * // Create many Proposals
     * const proposal = await prisma.proposal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Proposals and only return the `id`
     * const proposalWithIdOnly = await prisma.proposal.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProposalCreateManyAndReturnArgs>(args?: SelectSubset<T, ProposalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Proposal.
     * @param {ProposalDeleteArgs} args - Arguments to delete one Proposal.
     * @example
     * // Delete one Proposal
     * const Proposal = await prisma.proposal.delete({
     *   where: {
     *     // ... filter to delete one Proposal
     *   }
     * })
     * 
     */
    delete<T extends ProposalDeleteArgs>(args: SelectSubset<T, ProposalDeleteArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Proposal.
     * @param {ProposalUpdateArgs} args - Arguments to update one Proposal.
     * @example
     * // Update one Proposal
     * const proposal = await prisma.proposal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProposalUpdateArgs>(args: SelectSubset<T, ProposalUpdateArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Proposals.
     * @param {ProposalDeleteManyArgs} args - Arguments to filter Proposals to delete.
     * @example
     * // Delete a few Proposals
     * const { count } = await prisma.proposal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProposalDeleteManyArgs>(args?: SelectSubset<T, ProposalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Proposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Proposals
     * const proposal = await prisma.proposal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProposalUpdateManyArgs>(args: SelectSubset<T, ProposalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Proposal.
     * @param {ProposalUpsertArgs} args - Arguments to update or create a Proposal.
     * @example
     * // Update or create a Proposal
     * const proposal = await prisma.proposal.upsert({
     *   create: {
     *     // ... data to create a Proposal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Proposal we want to update
     *   }
     * })
     */
    upsert<T extends ProposalUpsertArgs>(args: SelectSubset<T, ProposalUpsertArgs<ExtArgs>>): Prisma__ProposalClient<$Result.GetResult<Prisma.$ProposalPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Proposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalCountArgs} args - Arguments to filter Proposals to count.
     * @example
     * // Count the number of Proposals
     * const count = await prisma.proposal.count({
     *   where: {
     *     // ... the filter for the Proposals we want to count
     *   }
     * })
    **/
    count<T extends ProposalCountArgs>(
      args?: Subset<T, ProposalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProposalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Proposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProposalAggregateArgs>(args: Subset<T, ProposalAggregateArgs>): Prisma.PrismaPromise<GetProposalAggregateType<T>>

    /**
     * Group by Proposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProposalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProposalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProposalGroupByArgs['orderBy'] }
        : { orderBy?: ProposalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProposalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProposalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Proposal model
   */
  readonly fields: ProposalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Proposal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProposalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Proposal model
   */ 
  interface ProposalFieldRefs {
    readonly id: FieldRef<"Proposal", 'String'>
    readonly creator: FieldRef<"Proposal", 'String'>
    readonly description: FieldRef<"Proposal", 'String'>
    readonly quorum: FieldRef<"Proposal", 'Int'>
    readonly votesFor: FieldRef<"Proposal", 'Int'>
    readonly votesAgainst: FieldRef<"Proposal", 'Int'>
    readonly txHash: FieldRef<"Proposal", 'String'>
    readonly createdAt: FieldRef<"Proposal", 'DateTime'>
    readonly updatedAt: FieldRef<"Proposal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Proposal findUnique
   */
  export type ProposalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter, which Proposal to fetch.
     */
    where: ProposalWhereUniqueInput
  }

  /**
   * Proposal findUniqueOrThrow
   */
  export type ProposalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter, which Proposal to fetch.
     */
    where: ProposalWhereUniqueInput
  }

  /**
   * Proposal findFirst
   */
  export type ProposalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter, which Proposal to fetch.
     */
    where?: ProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Proposals to fetch.
     */
    orderBy?: ProposalOrderByWithRelationInput | ProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Proposals.
     */
    cursor?: ProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Proposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Proposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Proposals.
     */
    distinct?: ProposalScalarFieldEnum | ProposalScalarFieldEnum[]
  }

  /**
   * Proposal findFirstOrThrow
   */
  export type ProposalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter, which Proposal to fetch.
     */
    where?: ProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Proposals to fetch.
     */
    orderBy?: ProposalOrderByWithRelationInput | ProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Proposals.
     */
    cursor?: ProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Proposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Proposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Proposals.
     */
    distinct?: ProposalScalarFieldEnum | ProposalScalarFieldEnum[]
  }

  /**
   * Proposal findMany
   */
  export type ProposalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter, which Proposals to fetch.
     */
    where?: ProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Proposals to fetch.
     */
    orderBy?: ProposalOrderByWithRelationInput | ProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Proposals.
     */
    cursor?: ProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Proposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Proposals.
     */
    skip?: number
    distinct?: ProposalScalarFieldEnum | ProposalScalarFieldEnum[]
  }

  /**
   * Proposal create
   */
  export type ProposalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * The data needed to create a Proposal.
     */
    data: XOR<ProposalCreateInput, ProposalUncheckedCreateInput>
  }

  /**
   * Proposal createMany
   */
  export type ProposalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Proposals.
     */
    data: ProposalCreateManyInput | ProposalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Proposal createManyAndReturn
   */
  export type ProposalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Proposals.
     */
    data: ProposalCreateManyInput | ProposalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Proposal update
   */
  export type ProposalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * The data needed to update a Proposal.
     */
    data: XOR<ProposalUpdateInput, ProposalUncheckedUpdateInput>
    /**
     * Choose, which Proposal to update.
     */
    where: ProposalWhereUniqueInput
  }

  /**
   * Proposal updateMany
   */
  export type ProposalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Proposals.
     */
    data: XOR<ProposalUpdateManyMutationInput, ProposalUncheckedUpdateManyInput>
    /**
     * Filter which Proposals to update
     */
    where?: ProposalWhereInput
  }

  /**
   * Proposal upsert
   */
  export type ProposalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * The filter to search for the Proposal to update in case it exists.
     */
    where: ProposalWhereUniqueInput
    /**
     * In case the Proposal found by the `where` argument doesn't exist, create a new Proposal with this data.
     */
    create: XOR<ProposalCreateInput, ProposalUncheckedCreateInput>
    /**
     * In case the Proposal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProposalUpdateInput, ProposalUncheckedUpdateInput>
  }

  /**
   * Proposal delete
   */
  export type ProposalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
    /**
     * Filter which Proposal to delete.
     */
    where: ProposalWhereUniqueInput
  }

  /**
   * Proposal deleteMany
   */
  export type ProposalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Proposals to delete
     */
    where?: ProposalWhereInput
  }

  /**
   * Proposal without action
   */
  export type ProposalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Proposal
     */
    select?: ProposalSelect<ExtArgs> | null
  }


  /**
   * Model ApiKey
   */

  export type AggregateApiKey = {
    _count: ApiKeyCountAggregateOutputType | null
    _avg: ApiKeyAvgAggregateOutputType | null
    _sum: ApiKeySumAggregateOutputType | null
    _min: ApiKeyMinAggregateOutputType | null
    _max: ApiKeyMaxAggregateOutputType | null
  }

  export type ApiKeyAvgAggregateOutputType = {
    rateLimit: number | null
  }

  export type ApiKeySumAggregateOutputType = {
    rateLimit: number | null
  }

  export type ApiKeyMinAggregateOutputType = {
    id: string | null
    keyHash: string | null
    name: string | null
    owner: string | null
    rateLimit: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    lastUsedAt: Date | null
  }

  export type ApiKeyMaxAggregateOutputType = {
    id: string | null
    keyHash: string | null
    name: string | null
    owner: string | null
    rateLimit: number | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    lastUsedAt: Date | null
  }

  export type ApiKeyCountAggregateOutputType = {
    id: number
    keyHash: number
    name: number
    owner: number
    rateLimit: number
    isActive: number
    createdAt: number
    updatedAt: number
    lastUsedAt: number
    _all: number
  }


  export type ApiKeyAvgAggregateInputType = {
    rateLimit?: true
  }

  export type ApiKeySumAggregateInputType = {
    rateLimit?: true
  }

  export type ApiKeyMinAggregateInputType = {
    id?: true
    keyHash?: true
    name?: true
    owner?: true
    rateLimit?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    lastUsedAt?: true
  }

  export type ApiKeyMaxAggregateInputType = {
    id?: true
    keyHash?: true
    name?: true
    owner?: true
    rateLimit?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    lastUsedAt?: true
  }

  export type ApiKeyCountAggregateInputType = {
    id?: true
    keyHash?: true
    name?: true
    owner?: true
    rateLimit?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    lastUsedAt?: true
    _all?: true
  }

  export type ApiKeyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiKey to aggregate.
     */
    where?: ApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiKeys to fetch.
     */
    orderBy?: ApiKeyOrderByWithRelationInput | ApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ApiKeys
    **/
    _count?: true | ApiKeyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ApiKeyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ApiKeySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApiKeyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApiKeyMaxAggregateInputType
  }

  export type GetApiKeyAggregateType<T extends ApiKeyAggregateArgs> = {
        [P in keyof T & keyof AggregateApiKey]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApiKey[P]>
      : GetScalarType<T[P], AggregateApiKey[P]>
  }




  export type ApiKeyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ApiKeyWhereInput
    orderBy?: ApiKeyOrderByWithAggregationInput | ApiKeyOrderByWithAggregationInput[]
    by: ApiKeyScalarFieldEnum[] | ApiKeyScalarFieldEnum
    having?: ApiKeyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApiKeyCountAggregateInputType | true
    _avg?: ApiKeyAvgAggregateInputType
    _sum?: ApiKeySumAggregateInputType
    _min?: ApiKeyMinAggregateInputType
    _max?: ApiKeyMaxAggregateInputType
  }

  export type ApiKeyGroupByOutputType = {
    id: string
    keyHash: string
    name: string
    owner: string
    rateLimit: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    lastUsedAt: Date | null
    _count: ApiKeyCountAggregateOutputType | null
    _avg: ApiKeyAvgAggregateOutputType | null
    _sum: ApiKeySumAggregateOutputType | null
    _min: ApiKeyMinAggregateOutputType | null
    _max: ApiKeyMaxAggregateOutputType | null
  }

  type GetApiKeyGroupByPayload<T extends ApiKeyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApiKeyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApiKeyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApiKeyGroupByOutputType[P]>
            : GetScalarType<T[P], ApiKeyGroupByOutputType[P]>
        }
      >
    >


  export type ApiKeySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    keyHash?: boolean
    name?: boolean
    owner?: boolean
    rateLimit?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastUsedAt?: boolean
  }, ExtArgs["result"]["apiKey"]>

  export type ApiKeySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    keyHash?: boolean
    name?: boolean
    owner?: boolean
    rateLimit?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastUsedAt?: boolean
  }, ExtArgs["result"]["apiKey"]>

  export type ApiKeySelectScalar = {
    id?: boolean
    keyHash?: boolean
    name?: boolean
    owner?: boolean
    rateLimit?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastUsedAt?: boolean
  }


  export type $ApiKeyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ApiKey"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      keyHash: string
      name: string
      owner: string
      rateLimit: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      lastUsedAt: Date | null
    }, ExtArgs["result"]["apiKey"]>
    composites: {}
  }

  type ApiKeyGetPayload<S extends boolean | null | undefined | ApiKeyDefaultArgs> = $Result.GetResult<Prisma.$ApiKeyPayload, S>

  type ApiKeyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ApiKeyFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ApiKeyCountAggregateInputType | true
    }

  export interface ApiKeyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ApiKey'], meta: { name: 'ApiKey' } }
    /**
     * Find zero or one ApiKey that matches the filter.
     * @param {ApiKeyFindUniqueArgs} args - Arguments to find a ApiKey
     * @example
     * // Get one ApiKey
     * const apiKey = await prisma.apiKey.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ApiKeyFindUniqueArgs>(args: SelectSubset<T, ApiKeyFindUniqueArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ApiKey that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ApiKeyFindUniqueOrThrowArgs} args - Arguments to find a ApiKey
     * @example
     * // Get one ApiKey
     * const apiKey = await prisma.apiKey.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ApiKeyFindUniqueOrThrowArgs>(args: SelectSubset<T, ApiKeyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ApiKey that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyFindFirstArgs} args - Arguments to find a ApiKey
     * @example
     * // Get one ApiKey
     * const apiKey = await prisma.apiKey.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ApiKeyFindFirstArgs>(args?: SelectSubset<T, ApiKeyFindFirstArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ApiKey that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyFindFirstOrThrowArgs} args - Arguments to find a ApiKey
     * @example
     * // Get one ApiKey
     * const apiKey = await prisma.apiKey.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ApiKeyFindFirstOrThrowArgs>(args?: SelectSubset<T, ApiKeyFindFirstOrThrowArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ApiKeys that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ApiKeys
     * const apiKeys = await prisma.apiKey.findMany()
     * 
     * // Get first 10 ApiKeys
     * const apiKeys = await prisma.apiKey.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const apiKeyWithIdOnly = await prisma.apiKey.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ApiKeyFindManyArgs>(args?: SelectSubset<T, ApiKeyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ApiKey.
     * @param {ApiKeyCreateArgs} args - Arguments to create a ApiKey.
     * @example
     * // Create one ApiKey
     * const ApiKey = await prisma.apiKey.create({
     *   data: {
     *     // ... data to create a ApiKey
     *   }
     * })
     * 
     */
    create<T extends ApiKeyCreateArgs>(args: SelectSubset<T, ApiKeyCreateArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ApiKeys.
     * @param {ApiKeyCreateManyArgs} args - Arguments to create many ApiKeys.
     * @example
     * // Create many ApiKeys
     * const apiKey = await prisma.apiKey.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ApiKeyCreateManyArgs>(args?: SelectSubset<T, ApiKeyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ApiKeys and returns the data saved in the database.
     * @param {ApiKeyCreateManyAndReturnArgs} args - Arguments to create many ApiKeys.
     * @example
     * // Create many ApiKeys
     * const apiKey = await prisma.apiKey.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ApiKeys and only return the `id`
     * const apiKeyWithIdOnly = await prisma.apiKey.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ApiKeyCreateManyAndReturnArgs>(args?: SelectSubset<T, ApiKeyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ApiKey.
     * @param {ApiKeyDeleteArgs} args - Arguments to delete one ApiKey.
     * @example
     * // Delete one ApiKey
     * const ApiKey = await prisma.apiKey.delete({
     *   where: {
     *     // ... filter to delete one ApiKey
     *   }
     * })
     * 
     */
    delete<T extends ApiKeyDeleteArgs>(args: SelectSubset<T, ApiKeyDeleteArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ApiKey.
     * @param {ApiKeyUpdateArgs} args - Arguments to update one ApiKey.
     * @example
     * // Update one ApiKey
     * const apiKey = await prisma.apiKey.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ApiKeyUpdateArgs>(args: SelectSubset<T, ApiKeyUpdateArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ApiKeys.
     * @param {ApiKeyDeleteManyArgs} args - Arguments to filter ApiKeys to delete.
     * @example
     * // Delete a few ApiKeys
     * const { count } = await prisma.apiKey.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ApiKeyDeleteManyArgs>(args?: SelectSubset<T, ApiKeyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ApiKeys
     * const apiKey = await prisma.apiKey.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ApiKeyUpdateManyArgs>(args: SelectSubset<T, ApiKeyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ApiKey.
     * @param {ApiKeyUpsertArgs} args - Arguments to update or create a ApiKey.
     * @example
     * // Update or create a ApiKey
     * const apiKey = await prisma.apiKey.upsert({
     *   create: {
     *     // ... data to create a ApiKey
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ApiKey we want to update
     *   }
     * })
     */
    upsert<T extends ApiKeyUpsertArgs>(args: SelectSubset<T, ApiKeyUpsertArgs<ExtArgs>>): Prisma__ApiKeyClient<$Result.GetResult<Prisma.$ApiKeyPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyCountArgs} args - Arguments to filter ApiKeys to count.
     * @example
     * // Count the number of ApiKeys
     * const count = await prisma.apiKey.count({
     *   where: {
     *     // ... the filter for the ApiKeys we want to count
     *   }
     * })
    **/
    count<T extends ApiKeyCountArgs>(
      args?: Subset<T, ApiKeyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApiKeyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApiKeyAggregateArgs>(args: Subset<T, ApiKeyAggregateArgs>): Prisma.PrismaPromise<GetApiKeyAggregateType<T>>

    /**
     * Group by ApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiKeyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ApiKeyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ApiKeyGroupByArgs['orderBy'] }
        : { orderBy?: ApiKeyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ApiKeyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApiKeyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ApiKey model
   */
  readonly fields: ApiKeyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ApiKey.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ApiKeyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ApiKey model
   */ 
  interface ApiKeyFieldRefs {
    readonly id: FieldRef<"ApiKey", 'String'>
    readonly keyHash: FieldRef<"ApiKey", 'String'>
    readonly name: FieldRef<"ApiKey", 'String'>
    readonly owner: FieldRef<"ApiKey", 'String'>
    readonly rateLimit: FieldRef<"ApiKey", 'Int'>
    readonly isActive: FieldRef<"ApiKey", 'Boolean'>
    readonly createdAt: FieldRef<"ApiKey", 'DateTime'>
    readonly updatedAt: FieldRef<"ApiKey", 'DateTime'>
    readonly lastUsedAt: FieldRef<"ApiKey", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ApiKey findUnique
   */
  export type ApiKeyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter, which ApiKey to fetch.
     */
    where: ApiKeyWhereUniqueInput
  }

  /**
   * ApiKey findUniqueOrThrow
   */
  export type ApiKeyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter, which ApiKey to fetch.
     */
    where: ApiKeyWhereUniqueInput
  }

  /**
   * ApiKey findFirst
   */
  export type ApiKeyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter, which ApiKey to fetch.
     */
    where?: ApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiKeys to fetch.
     */
    orderBy?: ApiKeyOrderByWithRelationInput | ApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiKeys.
     */
    cursor?: ApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiKeys.
     */
    distinct?: ApiKeyScalarFieldEnum | ApiKeyScalarFieldEnum[]
  }

  /**
   * ApiKey findFirstOrThrow
   */
  export type ApiKeyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter, which ApiKey to fetch.
     */
    where?: ApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiKeys to fetch.
     */
    orderBy?: ApiKeyOrderByWithRelationInput | ApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiKeys.
     */
    cursor?: ApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiKeys.
     */
    distinct?: ApiKeyScalarFieldEnum | ApiKeyScalarFieldEnum[]
  }

  /**
   * ApiKey findMany
   */
  export type ApiKeyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter, which ApiKeys to fetch.
     */
    where?: ApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiKeys to fetch.
     */
    orderBy?: ApiKeyOrderByWithRelationInput | ApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ApiKeys.
     */
    cursor?: ApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiKeys.
     */
    skip?: number
    distinct?: ApiKeyScalarFieldEnum | ApiKeyScalarFieldEnum[]
  }

  /**
   * ApiKey create
   */
  export type ApiKeyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * The data needed to create a ApiKey.
     */
    data: XOR<ApiKeyCreateInput, ApiKeyUncheckedCreateInput>
  }

  /**
   * ApiKey createMany
   */
  export type ApiKeyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ApiKeys.
     */
    data: ApiKeyCreateManyInput | ApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiKey createManyAndReturn
   */
  export type ApiKeyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ApiKeys.
     */
    data: ApiKeyCreateManyInput | ApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiKey update
   */
  export type ApiKeyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * The data needed to update a ApiKey.
     */
    data: XOR<ApiKeyUpdateInput, ApiKeyUncheckedUpdateInput>
    /**
     * Choose, which ApiKey to update.
     */
    where: ApiKeyWhereUniqueInput
  }

  /**
   * ApiKey updateMany
   */
  export type ApiKeyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ApiKeys.
     */
    data: XOR<ApiKeyUpdateManyMutationInput, ApiKeyUncheckedUpdateManyInput>
    /**
     * Filter which ApiKeys to update
     */
    where?: ApiKeyWhereInput
  }

  /**
   * ApiKey upsert
   */
  export type ApiKeyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * The filter to search for the ApiKey to update in case it exists.
     */
    where: ApiKeyWhereUniqueInput
    /**
     * In case the ApiKey found by the `where` argument doesn't exist, create a new ApiKey with this data.
     */
    create: XOR<ApiKeyCreateInput, ApiKeyUncheckedCreateInput>
    /**
     * In case the ApiKey was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ApiKeyUpdateInput, ApiKeyUncheckedUpdateInput>
  }

  /**
   * ApiKey delete
   */
  export type ApiKeyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
    /**
     * Filter which ApiKey to delete.
     */
    where: ApiKeyWhereUniqueInput
  }

  /**
   * ApiKey deleteMany
   */
  export type ApiKeyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiKeys to delete
     */
    where?: ApiKeyWhereInput
  }

  /**
   * ApiKey without action
   */
  export type ApiKeyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiKey
     */
    select?: ApiKeySelect<ExtArgs> | null
  }


  /**
   * Model LedgerHash
   */

  export type AggregateLedgerHash = {
    _count: LedgerHashCountAggregateOutputType | null
    _avg: LedgerHashAvgAggregateOutputType | null
    _sum: LedgerHashSumAggregateOutputType | null
    _min: LedgerHashMinAggregateOutputType | null
    _max: LedgerHashMaxAggregateOutputType | null
  }

  export type LedgerHashAvgAggregateOutputType = {
    sequence: number | null
  }

  export type LedgerHashSumAggregateOutputType = {
    sequence: number | null
  }

  export type LedgerHashMinAggregateOutputType = {
    sequence: number | null
    hash: string | null
    createdAt: Date | null
  }

  export type LedgerHashMaxAggregateOutputType = {
    sequence: number | null
    hash: string | null
    createdAt: Date | null
  }

  export type LedgerHashCountAggregateOutputType = {
    sequence: number
    hash: number
    createdAt: number
    _all: number
  }


  export type LedgerHashAvgAggregateInputType = {
    sequence?: true
  }

  export type LedgerHashSumAggregateInputType = {
    sequence?: true
  }

  export type LedgerHashMinAggregateInputType = {
    sequence?: true
    hash?: true
    createdAt?: true
  }

  export type LedgerHashMaxAggregateInputType = {
    sequence?: true
    hash?: true
    createdAt?: true
  }

  export type LedgerHashCountAggregateInputType = {
    sequence?: true
    hash?: true
    createdAt?: true
    _all?: true
  }

  export type LedgerHashAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LedgerHash to aggregate.
     */
    where?: LedgerHashWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LedgerHashes to fetch.
     */
    orderBy?: LedgerHashOrderByWithRelationInput | LedgerHashOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LedgerHashWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LedgerHashes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LedgerHashes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LedgerHashes
    **/
    _count?: true | LedgerHashCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LedgerHashAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LedgerHashSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LedgerHashMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LedgerHashMaxAggregateInputType
  }

  export type GetLedgerHashAggregateType<T extends LedgerHashAggregateArgs> = {
        [P in keyof T & keyof AggregateLedgerHash]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLedgerHash[P]>
      : GetScalarType<T[P], AggregateLedgerHash[P]>
  }




  export type LedgerHashGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LedgerHashWhereInput
    orderBy?: LedgerHashOrderByWithAggregationInput | LedgerHashOrderByWithAggregationInput[]
    by: LedgerHashScalarFieldEnum[] | LedgerHashScalarFieldEnum
    having?: LedgerHashScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LedgerHashCountAggregateInputType | true
    _avg?: LedgerHashAvgAggregateInputType
    _sum?: LedgerHashSumAggregateInputType
    _min?: LedgerHashMinAggregateInputType
    _max?: LedgerHashMaxAggregateInputType
  }

  export type LedgerHashGroupByOutputType = {
    sequence: number
    hash: string
    createdAt: Date
    _count: LedgerHashCountAggregateOutputType | null
    _avg: LedgerHashAvgAggregateOutputType | null
    _sum: LedgerHashSumAggregateOutputType | null
    _min: LedgerHashMinAggregateOutputType | null
    _max: LedgerHashMaxAggregateOutputType | null
  }

  type GetLedgerHashGroupByPayload<T extends LedgerHashGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LedgerHashGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LedgerHashGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LedgerHashGroupByOutputType[P]>
            : GetScalarType<T[P], LedgerHashGroupByOutputType[P]>
        }
      >
    >


  export type LedgerHashSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sequence?: boolean
    hash?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["ledgerHash"]>

  export type LedgerHashSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sequence?: boolean
    hash?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["ledgerHash"]>

  export type LedgerHashSelectScalar = {
    sequence?: boolean
    hash?: boolean
    createdAt?: boolean
  }


  export type $LedgerHashPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LedgerHash"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      sequence: number
      hash: string
      createdAt: Date
    }, ExtArgs["result"]["ledgerHash"]>
    composites: {}
  }

  type LedgerHashGetPayload<S extends boolean | null | undefined | LedgerHashDefaultArgs> = $Result.GetResult<Prisma.$LedgerHashPayload, S>

  type LedgerHashCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LedgerHashFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LedgerHashCountAggregateInputType | true
    }

  export interface LedgerHashDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LedgerHash'], meta: { name: 'LedgerHash' } }
    /**
     * Find zero or one LedgerHash that matches the filter.
     * @param {LedgerHashFindUniqueArgs} args - Arguments to find a LedgerHash
     * @example
     * // Get one LedgerHash
     * const ledgerHash = await prisma.ledgerHash.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LedgerHashFindUniqueArgs>(args: SelectSubset<T, LedgerHashFindUniqueArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LedgerHash that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LedgerHashFindUniqueOrThrowArgs} args - Arguments to find a LedgerHash
     * @example
     * // Get one LedgerHash
     * const ledgerHash = await prisma.ledgerHash.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LedgerHashFindUniqueOrThrowArgs>(args: SelectSubset<T, LedgerHashFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LedgerHash that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashFindFirstArgs} args - Arguments to find a LedgerHash
     * @example
     * // Get one LedgerHash
     * const ledgerHash = await prisma.ledgerHash.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LedgerHashFindFirstArgs>(args?: SelectSubset<T, LedgerHashFindFirstArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LedgerHash that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashFindFirstOrThrowArgs} args - Arguments to find a LedgerHash
     * @example
     * // Get one LedgerHash
     * const ledgerHash = await prisma.ledgerHash.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LedgerHashFindFirstOrThrowArgs>(args?: SelectSubset<T, LedgerHashFindFirstOrThrowArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LedgerHashes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LedgerHashes
     * const ledgerHashes = await prisma.ledgerHash.findMany()
     * 
     * // Get first 10 LedgerHashes
     * const ledgerHashes = await prisma.ledgerHash.findMany({ take: 10 })
     * 
     * // Only select the `sequence`
     * const ledgerHashWithSequenceOnly = await prisma.ledgerHash.findMany({ select: { sequence: true } })
     * 
     */
    findMany<T extends LedgerHashFindManyArgs>(args?: SelectSubset<T, LedgerHashFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LedgerHash.
     * @param {LedgerHashCreateArgs} args - Arguments to create a LedgerHash.
     * @example
     * // Create one LedgerHash
     * const LedgerHash = await prisma.ledgerHash.create({
     *   data: {
     *     // ... data to create a LedgerHash
     *   }
     * })
     * 
     */
    create<T extends LedgerHashCreateArgs>(args: SelectSubset<T, LedgerHashCreateArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LedgerHashes.
     * @param {LedgerHashCreateManyArgs} args - Arguments to create many LedgerHashes.
     * @example
     * // Create many LedgerHashes
     * const ledgerHash = await prisma.ledgerHash.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LedgerHashCreateManyArgs>(args?: SelectSubset<T, LedgerHashCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LedgerHashes and returns the data saved in the database.
     * @param {LedgerHashCreateManyAndReturnArgs} args - Arguments to create many LedgerHashes.
     * @example
     * // Create many LedgerHashes
     * const ledgerHash = await prisma.ledgerHash.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LedgerHashes and only return the `sequence`
     * const ledgerHashWithSequenceOnly = await prisma.ledgerHash.createManyAndReturn({ 
     *   select: { sequence: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LedgerHashCreateManyAndReturnArgs>(args?: SelectSubset<T, LedgerHashCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LedgerHash.
     * @param {LedgerHashDeleteArgs} args - Arguments to delete one LedgerHash.
     * @example
     * // Delete one LedgerHash
     * const LedgerHash = await prisma.ledgerHash.delete({
     *   where: {
     *     // ... filter to delete one LedgerHash
     *   }
     * })
     * 
     */
    delete<T extends LedgerHashDeleteArgs>(args: SelectSubset<T, LedgerHashDeleteArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LedgerHash.
     * @param {LedgerHashUpdateArgs} args - Arguments to update one LedgerHash.
     * @example
     * // Update one LedgerHash
     * const ledgerHash = await prisma.ledgerHash.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LedgerHashUpdateArgs>(args: SelectSubset<T, LedgerHashUpdateArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LedgerHashes.
     * @param {LedgerHashDeleteManyArgs} args - Arguments to filter LedgerHashes to delete.
     * @example
     * // Delete a few LedgerHashes
     * const { count } = await prisma.ledgerHash.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LedgerHashDeleteManyArgs>(args?: SelectSubset<T, LedgerHashDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LedgerHashes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LedgerHashes
     * const ledgerHash = await prisma.ledgerHash.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LedgerHashUpdateManyArgs>(args: SelectSubset<T, LedgerHashUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LedgerHash.
     * @param {LedgerHashUpsertArgs} args - Arguments to update or create a LedgerHash.
     * @example
     * // Update or create a LedgerHash
     * const ledgerHash = await prisma.ledgerHash.upsert({
     *   create: {
     *     // ... data to create a LedgerHash
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LedgerHash we want to update
     *   }
     * })
     */
    upsert<T extends LedgerHashUpsertArgs>(args: SelectSubset<T, LedgerHashUpsertArgs<ExtArgs>>): Prisma__LedgerHashClient<$Result.GetResult<Prisma.$LedgerHashPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LedgerHashes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashCountArgs} args - Arguments to filter LedgerHashes to count.
     * @example
     * // Count the number of LedgerHashes
     * const count = await prisma.ledgerHash.count({
     *   where: {
     *     // ... the filter for the LedgerHashes we want to count
     *   }
     * })
    **/
    count<T extends LedgerHashCountArgs>(
      args?: Subset<T, LedgerHashCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LedgerHashCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LedgerHash.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LedgerHashAggregateArgs>(args: Subset<T, LedgerHashAggregateArgs>): Prisma.PrismaPromise<GetLedgerHashAggregateType<T>>

    /**
     * Group by LedgerHash.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LedgerHashGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LedgerHashGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LedgerHashGroupByArgs['orderBy'] }
        : { orderBy?: LedgerHashGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LedgerHashGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLedgerHashGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LedgerHash model
   */
  readonly fields: LedgerHashFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LedgerHash.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LedgerHashClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LedgerHash model
   */ 
  interface LedgerHashFieldRefs {
    readonly sequence: FieldRef<"LedgerHash", 'Int'>
    readonly hash: FieldRef<"LedgerHash", 'String'>
    readonly createdAt: FieldRef<"LedgerHash", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LedgerHash findUnique
   */
  export type LedgerHashFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter, which LedgerHash to fetch.
     */
    where: LedgerHashWhereUniqueInput
  }

  /**
   * LedgerHash findUniqueOrThrow
   */
  export type LedgerHashFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter, which LedgerHash to fetch.
     */
    where: LedgerHashWhereUniqueInput
  }

  /**
   * LedgerHash findFirst
   */
  export type LedgerHashFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter, which LedgerHash to fetch.
     */
    where?: LedgerHashWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LedgerHashes to fetch.
     */
    orderBy?: LedgerHashOrderByWithRelationInput | LedgerHashOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LedgerHashes.
     */
    cursor?: LedgerHashWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LedgerHashes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LedgerHashes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LedgerHashes.
     */
    distinct?: LedgerHashScalarFieldEnum | LedgerHashScalarFieldEnum[]
  }

  /**
   * LedgerHash findFirstOrThrow
   */
  export type LedgerHashFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter, which LedgerHash to fetch.
     */
    where?: LedgerHashWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LedgerHashes to fetch.
     */
    orderBy?: LedgerHashOrderByWithRelationInput | LedgerHashOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LedgerHashes.
     */
    cursor?: LedgerHashWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LedgerHashes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LedgerHashes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LedgerHashes.
     */
    distinct?: LedgerHashScalarFieldEnum | LedgerHashScalarFieldEnum[]
  }

  /**
   * LedgerHash findMany
   */
  export type LedgerHashFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter, which LedgerHashes to fetch.
     */
    where?: LedgerHashWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LedgerHashes to fetch.
     */
    orderBy?: LedgerHashOrderByWithRelationInput | LedgerHashOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LedgerHashes.
     */
    cursor?: LedgerHashWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LedgerHashes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LedgerHashes.
     */
    skip?: number
    distinct?: LedgerHashScalarFieldEnum | LedgerHashScalarFieldEnum[]
  }

  /**
   * LedgerHash create
   */
  export type LedgerHashCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * The data needed to create a LedgerHash.
     */
    data: XOR<LedgerHashCreateInput, LedgerHashUncheckedCreateInput>
  }

  /**
   * LedgerHash createMany
   */
  export type LedgerHashCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LedgerHashes.
     */
    data: LedgerHashCreateManyInput | LedgerHashCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LedgerHash createManyAndReturn
   */
  export type LedgerHashCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LedgerHashes.
     */
    data: LedgerHashCreateManyInput | LedgerHashCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LedgerHash update
   */
  export type LedgerHashUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * The data needed to update a LedgerHash.
     */
    data: XOR<LedgerHashUpdateInput, LedgerHashUncheckedUpdateInput>
    /**
     * Choose, which LedgerHash to update.
     */
    where: LedgerHashWhereUniqueInput
  }

  /**
   * LedgerHash updateMany
   */
  export type LedgerHashUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LedgerHashes.
     */
    data: XOR<LedgerHashUpdateManyMutationInput, LedgerHashUncheckedUpdateManyInput>
    /**
     * Filter which LedgerHashes to update
     */
    where?: LedgerHashWhereInput
  }

  /**
   * LedgerHash upsert
   */
  export type LedgerHashUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * The filter to search for the LedgerHash to update in case it exists.
     */
    where: LedgerHashWhereUniqueInput
    /**
     * In case the LedgerHash found by the `where` argument doesn't exist, create a new LedgerHash with this data.
     */
    create: XOR<LedgerHashCreateInput, LedgerHashUncheckedCreateInput>
    /**
     * In case the LedgerHash was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LedgerHashUpdateInput, LedgerHashUncheckedUpdateInput>
  }

  /**
   * LedgerHash delete
   */
  export type LedgerHashDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
    /**
     * Filter which LedgerHash to delete.
     */
    where: LedgerHashWhereUniqueInput
  }

  /**
   * LedgerHash deleteMany
   */
  export type LedgerHashDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LedgerHashes to delete
     */
    where?: LedgerHashWhereInput
  }

  /**
   * LedgerHash without action
   */
  export type LedgerHashDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LedgerHash
     */
    select?: LedgerHashSelect<ExtArgs> | null
  }


  /**
   * Model NotificationSubscription
   */

  export type AggregateNotificationSubscription = {
    _count: NotificationSubscriptionCountAggregateOutputType | null
    _min: NotificationSubscriptionMinAggregateOutputType | null
    _max: NotificationSubscriptionMaxAggregateOutputType | null
  }

  export type NotificationSubscriptionMinAggregateOutputType = {
    id: string | null
    stellarAddress: string | null
    platform: $Enums.NotificationPlatform | null
    webhookUrl: string | null
    chatId: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationSubscriptionMaxAggregateOutputType = {
    id: string | null
    stellarAddress: string | null
    platform: $Enums.NotificationPlatform | null
    webhookUrl: string | null
    chatId: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationSubscriptionCountAggregateOutputType = {
    id: number
    stellarAddress: number
    platform: number
    webhookUrl: number
    chatId: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type NotificationSubscriptionMinAggregateInputType = {
    id?: true
    stellarAddress?: true
    platform?: true
    webhookUrl?: true
    chatId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationSubscriptionMaxAggregateInputType = {
    id?: true
    stellarAddress?: true
    platform?: true
    webhookUrl?: true
    chatId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationSubscriptionCountAggregateInputType = {
    id?: true
    stellarAddress?: true
    platform?: true
    webhookUrl?: true
    chatId?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type NotificationSubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationSubscription to aggregate.
     */
    where?: NotificationSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSubscriptions to fetch.
     */
    orderBy?: NotificationSubscriptionOrderByWithRelationInput | NotificationSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NotificationSubscriptions
    **/
    _count?: true | NotificationSubscriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationSubscriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationSubscriptionMaxAggregateInputType
  }

  export type GetNotificationSubscriptionAggregateType<T extends NotificationSubscriptionAggregateArgs> = {
        [P in keyof T & keyof AggregateNotificationSubscription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotificationSubscription[P]>
      : GetScalarType<T[P], AggregateNotificationSubscription[P]>
  }




  export type NotificationSubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationSubscriptionWhereInput
    orderBy?: NotificationSubscriptionOrderByWithAggregationInput | NotificationSubscriptionOrderByWithAggregationInput[]
    by: NotificationSubscriptionScalarFieldEnum[] | NotificationSubscriptionScalarFieldEnum
    having?: NotificationSubscriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationSubscriptionCountAggregateInputType | true
    _min?: NotificationSubscriptionMinAggregateInputType
    _max?: NotificationSubscriptionMaxAggregateInputType
  }

  export type NotificationSubscriptionGroupByOutputType = {
    id: string
    stellarAddress: string
    platform: $Enums.NotificationPlatform
    webhookUrl: string | null
    chatId: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: NotificationSubscriptionCountAggregateOutputType | null
    _min: NotificationSubscriptionMinAggregateOutputType | null
    _max: NotificationSubscriptionMaxAggregateOutputType | null
  }

  type GetNotificationSubscriptionGroupByPayload<T extends NotificationSubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationSubscriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationSubscriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationSubscriptionGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationSubscriptionGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    stellarAddress?: boolean
    platform?: boolean
    webhookUrl?: boolean
    chatId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["notificationSubscription"]>

  export type NotificationSubscriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    stellarAddress?: boolean
    platform?: boolean
    webhookUrl?: boolean
    chatId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["notificationSubscription"]>

  export type NotificationSubscriptionSelectScalar = {
    id?: boolean
    stellarAddress?: boolean
    platform?: boolean
    webhookUrl?: boolean
    chatId?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $NotificationSubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NotificationSubscription"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      stellarAddress: string
      platform: $Enums.NotificationPlatform
      webhookUrl: string | null
      chatId: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["notificationSubscription"]>
    composites: {}
  }

  type NotificationSubscriptionGetPayload<S extends boolean | null | undefined | NotificationSubscriptionDefaultArgs> = $Result.GetResult<Prisma.$NotificationSubscriptionPayload, S>

  type NotificationSubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationSubscriptionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationSubscriptionCountAggregateInputType | true
    }

  export interface NotificationSubscriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NotificationSubscription'], meta: { name: 'NotificationSubscription' } }
    /**
     * Find zero or one NotificationSubscription that matches the filter.
     * @param {NotificationSubscriptionFindUniqueArgs} args - Arguments to find a NotificationSubscription
     * @example
     * // Get one NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationSubscriptionFindUniqueArgs>(args: SelectSubset<T, NotificationSubscriptionFindUniqueArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one NotificationSubscription that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {NotificationSubscriptionFindUniqueOrThrowArgs} args - Arguments to find a NotificationSubscription
     * @example
     * // Get one NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationSubscriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationSubscriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first NotificationSubscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionFindFirstArgs} args - Arguments to find a NotificationSubscription
     * @example
     * // Get one NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationSubscriptionFindFirstArgs>(args?: SelectSubset<T, NotificationSubscriptionFindFirstArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first NotificationSubscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionFindFirstOrThrowArgs} args - Arguments to find a NotificationSubscription
     * @example
     * // Get one NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationSubscriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationSubscriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more NotificationSubscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotificationSubscriptions
     * const notificationSubscriptions = await prisma.notificationSubscription.findMany()
     * 
     * // Get first 10 NotificationSubscriptions
     * const notificationSubscriptions = await prisma.notificationSubscription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationSubscriptionWithIdOnly = await prisma.notificationSubscription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationSubscriptionFindManyArgs>(args?: SelectSubset<T, NotificationSubscriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a NotificationSubscription.
     * @param {NotificationSubscriptionCreateArgs} args - Arguments to create a NotificationSubscription.
     * @example
     * // Create one NotificationSubscription
     * const NotificationSubscription = await prisma.notificationSubscription.create({
     *   data: {
     *     // ... data to create a NotificationSubscription
     *   }
     * })
     * 
     */
    create<T extends NotificationSubscriptionCreateArgs>(args: SelectSubset<T, NotificationSubscriptionCreateArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many NotificationSubscriptions.
     * @param {NotificationSubscriptionCreateManyArgs} args - Arguments to create many NotificationSubscriptions.
     * @example
     * // Create many NotificationSubscriptions
     * const notificationSubscription = await prisma.notificationSubscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationSubscriptionCreateManyArgs>(args?: SelectSubset<T, NotificationSubscriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NotificationSubscriptions and returns the data saved in the database.
     * @param {NotificationSubscriptionCreateManyAndReturnArgs} args - Arguments to create many NotificationSubscriptions.
     * @example
     * // Create many NotificationSubscriptions
     * const notificationSubscription = await prisma.notificationSubscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NotificationSubscriptions and only return the `id`
     * const notificationSubscriptionWithIdOnly = await prisma.notificationSubscription.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationSubscriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationSubscriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a NotificationSubscription.
     * @param {NotificationSubscriptionDeleteArgs} args - Arguments to delete one NotificationSubscription.
     * @example
     * // Delete one NotificationSubscription
     * const NotificationSubscription = await prisma.notificationSubscription.delete({
     *   where: {
     *     // ... filter to delete one NotificationSubscription
     *   }
     * })
     * 
     */
    delete<T extends NotificationSubscriptionDeleteArgs>(args: SelectSubset<T, NotificationSubscriptionDeleteArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one NotificationSubscription.
     * @param {NotificationSubscriptionUpdateArgs} args - Arguments to update one NotificationSubscription.
     * @example
     * // Update one NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationSubscriptionUpdateArgs>(args: SelectSubset<T, NotificationSubscriptionUpdateArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more NotificationSubscriptions.
     * @param {NotificationSubscriptionDeleteManyArgs} args - Arguments to filter NotificationSubscriptions to delete.
     * @example
     * // Delete a few NotificationSubscriptions
     * const { count } = await prisma.notificationSubscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationSubscriptionDeleteManyArgs>(args?: SelectSubset<T, NotificationSubscriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationSubscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotificationSubscriptions
     * const notificationSubscription = await prisma.notificationSubscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationSubscriptionUpdateManyArgs>(args: SelectSubset<T, NotificationSubscriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one NotificationSubscription.
     * @param {NotificationSubscriptionUpsertArgs} args - Arguments to update or create a NotificationSubscription.
     * @example
     * // Update or create a NotificationSubscription
     * const notificationSubscription = await prisma.notificationSubscription.upsert({
     *   create: {
     *     // ... data to create a NotificationSubscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotificationSubscription we want to update
     *   }
     * })
     */
    upsert<T extends NotificationSubscriptionUpsertArgs>(args: SelectSubset<T, NotificationSubscriptionUpsertArgs<ExtArgs>>): Prisma__NotificationSubscriptionClient<$Result.GetResult<Prisma.$NotificationSubscriptionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of NotificationSubscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionCountArgs} args - Arguments to filter NotificationSubscriptions to count.
     * @example
     * // Count the number of NotificationSubscriptions
     * const count = await prisma.notificationSubscription.count({
     *   where: {
     *     // ... the filter for the NotificationSubscriptions we want to count
     *   }
     * })
    **/
    count<T extends NotificationSubscriptionCountArgs>(
      args?: Subset<T, NotificationSubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationSubscriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NotificationSubscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationSubscriptionAggregateArgs>(args: Subset<T, NotificationSubscriptionAggregateArgs>): Prisma.PrismaPromise<GetNotificationSubscriptionAggregateType<T>>

    /**
     * Group by NotificationSubscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSubscriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationSubscriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationSubscriptionGroupByArgs['orderBy'] }
        : { orderBy?: NotificationSubscriptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationSubscriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NotificationSubscription model
   */
  readonly fields: NotificationSubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NotificationSubscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationSubscriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NotificationSubscription model
   */ 
  interface NotificationSubscriptionFieldRefs {
    readonly id: FieldRef<"NotificationSubscription", 'String'>
    readonly stellarAddress: FieldRef<"NotificationSubscription", 'String'>
    readonly platform: FieldRef<"NotificationSubscription", 'NotificationPlatform'>
    readonly webhookUrl: FieldRef<"NotificationSubscription", 'String'>
    readonly chatId: FieldRef<"NotificationSubscription", 'String'>
    readonly isActive: FieldRef<"NotificationSubscription", 'Boolean'>
    readonly createdAt: FieldRef<"NotificationSubscription", 'DateTime'>
    readonly updatedAt: FieldRef<"NotificationSubscription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * NotificationSubscription findUnique
   */
  export type NotificationSubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter, which NotificationSubscription to fetch.
     */
    where: NotificationSubscriptionWhereUniqueInput
  }

  /**
   * NotificationSubscription findUniqueOrThrow
   */
  export type NotificationSubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter, which NotificationSubscription to fetch.
     */
    where: NotificationSubscriptionWhereUniqueInput
  }

  /**
   * NotificationSubscription findFirst
   */
  export type NotificationSubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter, which NotificationSubscription to fetch.
     */
    where?: NotificationSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSubscriptions to fetch.
     */
    orderBy?: NotificationSubscriptionOrderByWithRelationInput | NotificationSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationSubscriptions.
     */
    cursor?: NotificationSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationSubscriptions.
     */
    distinct?: NotificationSubscriptionScalarFieldEnum | NotificationSubscriptionScalarFieldEnum[]
  }

  /**
   * NotificationSubscription findFirstOrThrow
   */
  export type NotificationSubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter, which NotificationSubscription to fetch.
     */
    where?: NotificationSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSubscriptions to fetch.
     */
    orderBy?: NotificationSubscriptionOrderByWithRelationInput | NotificationSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationSubscriptions.
     */
    cursor?: NotificationSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationSubscriptions.
     */
    distinct?: NotificationSubscriptionScalarFieldEnum | NotificationSubscriptionScalarFieldEnum[]
  }

  /**
   * NotificationSubscription findMany
   */
  export type NotificationSubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter, which NotificationSubscriptions to fetch.
     */
    where?: NotificationSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSubscriptions to fetch.
     */
    orderBy?: NotificationSubscriptionOrderByWithRelationInput | NotificationSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NotificationSubscriptions.
     */
    cursor?: NotificationSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSubscriptions.
     */
    skip?: number
    distinct?: NotificationSubscriptionScalarFieldEnum | NotificationSubscriptionScalarFieldEnum[]
  }

  /**
   * NotificationSubscription create
   */
  export type NotificationSubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * The data needed to create a NotificationSubscription.
     */
    data: XOR<NotificationSubscriptionCreateInput, NotificationSubscriptionUncheckedCreateInput>
  }

  /**
   * NotificationSubscription createMany
   */
  export type NotificationSubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotificationSubscriptions.
     */
    data: NotificationSubscriptionCreateManyInput | NotificationSubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NotificationSubscription createManyAndReturn
   */
  export type NotificationSubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many NotificationSubscriptions.
     */
    data: NotificationSubscriptionCreateManyInput | NotificationSubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NotificationSubscription update
   */
  export type NotificationSubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * The data needed to update a NotificationSubscription.
     */
    data: XOR<NotificationSubscriptionUpdateInput, NotificationSubscriptionUncheckedUpdateInput>
    /**
     * Choose, which NotificationSubscription to update.
     */
    where: NotificationSubscriptionWhereUniqueInput
  }

  /**
   * NotificationSubscription updateMany
   */
  export type NotificationSubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NotificationSubscriptions.
     */
    data: XOR<NotificationSubscriptionUpdateManyMutationInput, NotificationSubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which NotificationSubscriptions to update
     */
    where?: NotificationSubscriptionWhereInput
  }

  /**
   * NotificationSubscription upsert
   */
  export type NotificationSubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * The filter to search for the NotificationSubscription to update in case it exists.
     */
    where: NotificationSubscriptionWhereUniqueInput
    /**
     * In case the NotificationSubscription found by the `where` argument doesn't exist, create a new NotificationSubscription with this data.
     */
    create: XOR<NotificationSubscriptionCreateInput, NotificationSubscriptionUncheckedCreateInput>
    /**
     * In case the NotificationSubscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationSubscriptionUpdateInput, NotificationSubscriptionUncheckedUpdateInput>
  }

  /**
   * NotificationSubscription delete
   */
  export type NotificationSubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
    /**
     * Filter which NotificationSubscription to delete.
     */
    where: NotificationSubscriptionWhereUniqueInput
  }

  /**
   * NotificationSubscription deleteMany
   */
  export type NotificationSubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationSubscriptions to delete
     */
    where?: NotificationSubscriptionWhereInput
  }

  /**
   * NotificationSubscription without action
   */
  export type NotificationSubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSubscription
     */
    select?: NotificationSubscriptionSelect<ExtArgs> | null
  }


  /**
   * Model AssetConfig
   */

  export type AggregateAssetConfig = {
    _count: AssetConfigCountAggregateOutputType | null
    _avg: AssetConfigAvgAggregateOutputType | null
    _sum: AssetConfigSumAggregateOutputType | null
    _min: AssetConfigMinAggregateOutputType | null
    _max: AssetConfigMaxAggregateOutputType | null
  }

  export const StreamScalarFieldEnum: {
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
  export type AssetConfigAvgAggregateOutputType = {
    decimals: number | null
  }

  export type AssetConfigSumAggregateOutputType = {
    decimals: number | null
  }

  export type AssetConfigMinAggregateOutputType = {
    id: string | null
    assetId: string | null
    symbol: string | null
    name: string | null
    decimals: number | null
    isVerified: boolean | null
    isVisible: boolean | null
    yieldEnabled: boolean | null
    iconUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export const TokenPriceScalarFieldEnum: {
    tokenAddress: 'tokenAddress',
    symbol: 'symbol',
    decimals: 'decimals',
    priceUsd: 'priceUsd',
    updatedAt: 'updatedAt'
  };
  export type AssetConfigMaxAggregateOutputType = {
    id: string | null
    assetId: string | null
    symbol: string | null
    name: string | null
    decimals: number | null
    isVerified: boolean | null
    isVisible: boolean | null
    yieldEnabled: boolean | null
    iconUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AssetConfigCountAggregateOutputType = {
    id: number
    assetId: number
    symbol: number
    name: number
    decimals: number
    isVerified: number
    isVisible: number
    yieldEnabled: number
    iconUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AssetConfigAvgAggregateInputType = {
    decimals?: true
  }

  export type AssetConfigSumAggregateInputType = {
    decimals?: true
  }

  export type AssetConfigMinAggregateInputType = {
    id?: true
    assetId?: true
    symbol?: true
    name?: true
    decimals?: true
    isVerified?: true
    isVisible?: true
    yieldEnabled?: true
    iconUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AssetConfigMaxAggregateInputType = {
    id?: true
    assetId?: true
    symbol?: true
    name?: true
    decimals?: true
    isVerified?: true
    isVisible?: true
    yieldEnabled?: true
    iconUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AssetConfigCountAggregateInputType = {
    id?: true
    assetId?: true
    symbol?: true
    name?: true
    decimals?: true
    isVerified?: true
    isVisible?: true
    yieldEnabled?: true
    iconUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AssetConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AssetConfig to aggregate.
     */
    where?: AssetConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AssetConfigs to fetch.
     */
    orderBy?: AssetConfigOrderByWithRelationInput | AssetConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AssetConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AssetConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AssetConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AssetConfigs
    **/
    _count?: true | AssetConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AssetConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AssetConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AssetConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AssetConfigMaxAggregateInputType
  }

  export type GetAssetConfigAggregateType<T extends AssetConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateAssetConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAssetConfig[P]>
      : GetScalarType<T[P], AggregateAssetConfig[P]>
  }




  export type AssetConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AssetConfigWhereInput
    orderBy?: AssetConfigOrderByWithAggregationInput | AssetConfigOrderByWithAggregationInput[]
    by: AssetConfigScalarFieldEnum[] | AssetConfigScalarFieldEnum
    having?: AssetConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AssetConfigCountAggregateInputType | true
    _avg?: AssetConfigAvgAggregateInputType
    _sum?: AssetConfigSumAggregateInputType
    _min?: AssetConfigMinAggregateInputType
    _max?: AssetConfigMaxAggregateInputType
  }

  export type AssetConfigGroupByOutputType = {
    id: string
    assetId: string
    symbol: string
    name: string
    decimals: number
    isVerified: boolean
    isVisible: boolean
    yieldEnabled: boolean
    iconUrl: string | null
    createdAt: Date
    updatedAt: Date
    _count: AssetConfigCountAggregateOutputType | null
    _avg: AssetConfigAvgAggregateOutputType | null
    _sum: AssetConfigSumAggregateOutputType | null
    _min: AssetConfigMinAggregateOutputType | null
    _max: AssetConfigMaxAggregateOutputType | null
  }

  type GetAssetConfigGroupByPayload<T extends AssetConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AssetConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AssetConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AssetConfigGroupByOutputType[P]>
            : GetScalarType<T[P], AssetConfigGroupByOutputType[P]>
        }
      >
    >


  export type AssetConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    assetId?: boolean
    symbol?: boolean
    name?: boolean
    decimals?: boolean
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["assetConfig"]>

  export type AssetConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    assetId?: boolean
    symbol?: boolean
    name?: boolean
    decimals?: boolean
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["assetConfig"]>

  export type AssetConfigSelectScalar = {
    id?: boolean
    assetId?: boolean
    symbol?: boolean
    name?: boolean
    decimals?: boolean
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $AssetConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AssetConfig"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      assetId: string
      symbol: string
      name: string
      decimals: number
      isVerified: boolean
      isVisible: boolean
      yieldEnabled: boolean
      iconUrl: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["assetConfig"]>
    composites: {}
  }

  type AssetConfigGetPayload<S extends boolean | null | undefined | AssetConfigDefaultArgs> = $Result.GetResult<Prisma.$AssetConfigPayload, S>

  type AssetConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AssetConfigFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AssetConfigCountAggregateInputType | true
    }

  export interface AssetConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AssetConfig'], meta: { name: 'AssetConfig' } }
    /**
     * Find zero or one AssetConfig that matches the filter.
     * @param {AssetConfigFindUniqueArgs} args - Arguments to find a AssetConfig
     * @example
     * // Get one AssetConfig
     * const assetConfig = await prisma.assetConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AssetConfigFindUniqueArgs>(args: SelectSubset<T, AssetConfigFindUniqueArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AssetConfig that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AssetConfigFindUniqueOrThrowArgs} args - Arguments to find a AssetConfig
     * @example
     * // Get one AssetConfig
     * const assetConfig = await prisma.assetConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AssetConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, AssetConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AssetConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigFindFirstArgs} args - Arguments to find a AssetConfig
     * @example
     * // Get one AssetConfig
     * const assetConfig = await prisma.assetConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AssetConfigFindFirstArgs>(args?: SelectSubset<T, AssetConfigFindFirstArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AssetConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigFindFirstOrThrowArgs} args - Arguments to find a AssetConfig
     * @example
     * // Get one AssetConfig
     * const assetConfig = await prisma.assetConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AssetConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, AssetConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AssetConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AssetConfigs
     * const assetConfigs = await prisma.assetConfig.findMany()
     * 
     * // Get first 10 AssetConfigs
     * const assetConfigs = await prisma.assetConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const assetConfigWithIdOnly = await prisma.assetConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AssetConfigFindManyArgs>(args?: SelectSubset<T, AssetConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AssetConfig.
     * @param {AssetConfigCreateArgs} args - Arguments to create a AssetConfig.
     * @example
     * // Create one AssetConfig
     * const AssetConfig = await prisma.assetConfig.create({
     *   data: {
     *     // ... data to create a AssetConfig
     *   }
     * })
     * 
     */
    create<T extends AssetConfigCreateArgs>(args: SelectSubset<T, AssetConfigCreateArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AssetConfigs.
     * @param {AssetConfigCreateManyArgs} args - Arguments to create many AssetConfigs.
     * @example
     * // Create many AssetConfigs
     * const assetConfig = await prisma.assetConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AssetConfigCreateManyArgs>(args?: SelectSubset<T, AssetConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AssetConfigs and returns the data saved in the database.
     * @param {AssetConfigCreateManyAndReturnArgs} args - Arguments to create many AssetConfigs.
     * @example
     * // Create many AssetConfigs
     * const assetConfig = await prisma.assetConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AssetConfigs and only return the `id`
     * const assetConfigWithIdOnly = await prisma.assetConfig.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AssetConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, AssetConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AssetConfig.
     * @param {AssetConfigDeleteArgs} args - Arguments to delete one AssetConfig.
     * @example
     * // Delete one AssetConfig
     * const AssetConfig = await prisma.assetConfig.delete({
     *   where: {
     *     // ... filter to delete one AssetConfig
     *   }
     * })
     * 
     */
    delete<T extends AssetConfigDeleteArgs>(args: SelectSubset<T, AssetConfigDeleteArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AssetConfig.
     * @param {AssetConfigUpdateArgs} args - Arguments to update one AssetConfig.
     * @example
     * // Update one AssetConfig
     * const assetConfig = await prisma.assetConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AssetConfigUpdateArgs>(args: SelectSubset<T, AssetConfigUpdateArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AssetConfigs.
     * @param {AssetConfigDeleteManyArgs} args - Arguments to filter AssetConfigs to delete.
     * @example
     * // Delete a few AssetConfigs
     * const { count } = await prisma.assetConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AssetConfigDeleteManyArgs>(args?: SelectSubset<T, AssetConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AssetConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AssetConfigs
     * const assetConfig = await prisma.assetConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AssetConfigUpdateManyArgs>(args: SelectSubset<T, AssetConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AssetConfig.
     * @param {AssetConfigUpsertArgs} args - Arguments to update or create a AssetConfig.
     * @example
     * // Update or create a AssetConfig
     * const assetConfig = await prisma.assetConfig.upsert({
     *   create: {
     *     // ... data to create a AssetConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AssetConfig we want to update
     *   }
     * })
     */
    upsert<T extends AssetConfigUpsertArgs>(args: SelectSubset<T, AssetConfigUpsertArgs<ExtArgs>>): Prisma__AssetConfigClient<$Result.GetResult<Prisma.$AssetConfigPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AssetConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigCountArgs} args - Arguments to filter AssetConfigs to count.
     * @example
     * // Count the number of AssetConfigs
     * const count = await prisma.assetConfig.count({
     *   where: {
     *     // ... the filter for the AssetConfigs we want to count
     *   }
     * })
    **/
    count<T extends AssetConfigCountArgs>(
      args?: Subset<T, AssetConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AssetConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AssetConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AssetConfigAggregateArgs>(args: Subset<T, AssetConfigAggregateArgs>): Prisma.PrismaPromise<GetAssetConfigAggregateType<T>>

    /**
     * Group by AssetConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AssetConfigGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AssetConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AssetConfigGroupByArgs['orderBy'] }
        : { orderBy?: AssetConfigGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AssetConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAssetConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AssetConfig model
   */
  readonly fields: AssetConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AssetConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AssetConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AssetConfig model
   */ 
  interface AssetConfigFieldRefs {
    readonly id: FieldRef<"AssetConfig", 'String'>
    readonly assetId: FieldRef<"AssetConfig", 'String'>
    readonly symbol: FieldRef<"AssetConfig", 'String'>
    readonly name: FieldRef<"AssetConfig", 'String'>
    readonly decimals: FieldRef<"AssetConfig", 'Int'>
    readonly isVerified: FieldRef<"AssetConfig", 'Boolean'>
    readonly isVisible: FieldRef<"AssetConfig", 'Boolean'>
    readonly yieldEnabled: FieldRef<"AssetConfig", 'Boolean'>
    readonly iconUrl: FieldRef<"AssetConfig", 'String'>
    readonly createdAt: FieldRef<"AssetConfig", 'DateTime'>
    readonly updatedAt: FieldRef<"AssetConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AssetConfig findUnique
   */
  export type AssetConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter, which AssetConfig to fetch.
     */
    where: AssetConfigWhereUniqueInput
  }

  /**
   * AssetConfig findUniqueOrThrow
   */
  export type AssetConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter, which AssetConfig to fetch.
     */
    where: AssetConfigWhereUniqueInput
  }

  /**
   * AssetConfig findFirst
   */
  export type AssetConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter, which AssetConfig to fetch.
     */
    where?: AssetConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AssetConfigs to fetch.
     */
    orderBy?: AssetConfigOrderByWithRelationInput | AssetConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AssetConfigs.
     */
    cursor?: AssetConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AssetConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AssetConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AssetConfigs.
     */
    distinct?: AssetConfigScalarFieldEnum | AssetConfigScalarFieldEnum[]
  }

  /**
   * AssetConfig findFirstOrThrow
   */
  export type AssetConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter, which AssetConfig to fetch.
     */
    where?: AssetConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AssetConfigs to fetch.
     */
    orderBy?: AssetConfigOrderByWithRelationInput | AssetConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AssetConfigs.
     */
    cursor?: AssetConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AssetConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AssetConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AssetConfigs.
     */
    distinct?: AssetConfigScalarFieldEnum | AssetConfigScalarFieldEnum[]
  }

  /**
   * AssetConfig findMany
   */
  export type AssetConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter, which AssetConfigs to fetch.
     */
    where?: AssetConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AssetConfigs to fetch.
     */
    orderBy?: AssetConfigOrderByWithRelationInput | AssetConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AssetConfigs.
     */
    cursor?: AssetConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AssetConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AssetConfigs.
     */
    skip?: number
    distinct?: AssetConfigScalarFieldEnum | AssetConfigScalarFieldEnum[]
  }

  /**
   * AssetConfig create
   */
  export type AssetConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * The data needed to create a AssetConfig.
     */
    data: XOR<AssetConfigCreateInput, AssetConfigUncheckedCreateInput>
  }

  /**
   * AssetConfig createMany
   */
  export type AssetConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AssetConfigs.
     */
    data: AssetConfigCreateManyInput | AssetConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AssetConfig createManyAndReturn
   */
  export type AssetConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AssetConfigs.
     */
    data: AssetConfigCreateManyInput | AssetConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AssetConfig update
   */
  export type AssetConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * The data needed to update a AssetConfig.
     */
    data: XOR<AssetConfigUpdateInput, AssetConfigUncheckedUpdateInput>
    /**
     * Choose, which AssetConfig to update.
     */
    where: AssetConfigWhereUniqueInput
  }

  /**
   * AssetConfig updateMany
   */
  export type AssetConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AssetConfigs.
     */
    data: XOR<AssetConfigUpdateManyMutationInput, AssetConfigUncheckedUpdateManyInput>
    /**
     * Filter which AssetConfigs to update
     */
    where?: AssetConfigWhereInput
  }

  /**
   * AssetConfig upsert
   */
  export type AssetConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * The filter to search for the AssetConfig to update in case it exists.
     */
    where: AssetConfigWhereUniqueInput
    /**
     * In case the AssetConfig found by the `where` argument doesn't exist, create a new AssetConfig with this data.
     */
    create: XOR<AssetConfigCreateInput, AssetConfigUncheckedCreateInput>
    /**
     * In case the AssetConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AssetConfigUpdateInput, AssetConfigUncheckedUpdateInput>
  }

  /**
   * AssetConfig delete
   */
  export type AssetConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
    /**
     * Filter which AssetConfig to delete.
     */
    where: AssetConfigWhereUniqueInput
  }

  /**
   * AssetConfig deleteMany
   */
  export type AssetConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AssetConfigs to delete
     */
    where?: AssetConfigWhereInput
  }

  /**
   * AssetConfig without action
   */
  export type AssetConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AssetConfig
     */
    select?: AssetConfigSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const StreamScalarFieldEnum: {
    id: 'id',
    streamId: 'streamId',
    txHash: 'txHash',
    version: 'version',
    sender: 'sender',
    receiver: 'receiver',
    contractId: 'contractId',
    tokenAddress: 'tokenAddress',
    amount: 'amount',
    duration: 'duration',
    status: 'status',
    withdrawn: 'withdrawn',
    legacy: 'legacy',
    migrated: 'migrated',
    isPrivate: 'isPrivate',
    yieldEnabled: 'yieldEnabled',
    vaultContractId: 'vaultContractId',
    vaultShareBalance: 'vaultShareBalance',
    vaultRatioScale: 'vaultRatioScale',
    accruedInterest: 'accruedInterest',
    lastYieldAccrualAt: 'lastYieldAccrualAt',
    createdAt: 'createdAt'
  };

  export type StreamScalarFieldEnum = (typeof StreamScalarFieldEnum)[keyof typeof StreamScalarFieldEnum]


  export const ContractEventScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    contractId: 'contractId',
    txHash: 'txHash',
    eventType: 'eventType',
    eventIndex: 'eventIndex',
    ledgerSequence: 'ledgerSequence',
    ledgerClosedAt: 'ledgerClosedAt',
    topicXdr: 'topicXdr',
    valueXdr: 'valueXdr',
    decodedJson: 'decodedJson',
    createdAt: 'createdAt'
  };

  export type ContractEventScalarFieldEnum = (typeof ContractEventScalarFieldEnum)[keyof typeof ContractEventScalarFieldEnum]


  export const TokenPriceScalarFieldEnum: {
    tokenAddress: 'tokenAddress',
    symbol: 'symbol',
    decimals: 'decimals',
    priceUsd: 'priceUsd',
    updatedAt: 'updatedAt'
  };

  export type TokenPriceScalarFieldEnum = (typeof TokenPriceScalarFieldEnum)[keyof typeof TokenPriceScalarFieldEnum]


  export const WebhookScalarFieldEnum: {
    id: 'id',
    url: 'url',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WebhookScalarFieldEnum = (typeof WebhookScalarFieldEnum)[keyof typeof WebhookScalarFieldEnum]


  export const SyncStateScalarFieldEnum: {
    id: 'id',
    lastLedgerSequence: 'lastLedgerSequence'
  };

  export type SyncStateScalarFieldEnum = (typeof SyncStateScalarFieldEnum)[keyof typeof SyncStateScalarFieldEnum]


  export const EventLogScalarFieldEnum: {
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

  export type EventLogScalarFieldEnum = (typeof EventLogScalarFieldEnum)[keyof typeof EventLogScalarFieldEnum]


  export const StreamSnapshotScalarFieldEnum: {
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

  export type StreamSnapshotScalarFieldEnum = (typeof StreamSnapshotScalarFieldEnum)[keyof typeof StreamSnapshotScalarFieldEnum]


  export const StreamArchiveScalarFieldEnum: {
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

  export type StreamArchiveScalarFieldEnum = (typeof StreamArchiveScalarFieldEnum)[keyof typeof StreamArchiveScalarFieldEnum]


  export const BridgeLogScalarFieldEnum: {
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

  export type BridgeLogScalarFieldEnum = (typeof BridgeLogScalarFieldEnum)[keyof typeof BridgeLogScalarFieldEnum]


  export const ProposalScalarFieldEnum: {
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

  export type ProposalScalarFieldEnum = (typeof ProposalScalarFieldEnum)[keyof typeof ProposalScalarFieldEnum]


  export const ApiKeyScalarFieldEnum: {
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

  export type ApiKeyScalarFieldEnum = (typeof ApiKeyScalarFieldEnum)[keyof typeof ApiKeyScalarFieldEnum]


  export const LedgerHashScalarFieldEnum: {
    sequence: 'sequence',
    hash: 'hash',
    createdAt: 'createdAt'
  };

  export type LedgerHashScalarFieldEnum = (typeof LedgerHashScalarFieldEnum)[keyof typeof LedgerHashScalarFieldEnum]


  export const NotificationSubscriptionScalarFieldEnum: {
    id: 'id',
    stellarAddress: 'stellarAddress',
    platform: 'platform',
    webhookUrl: 'webhookUrl',
    chatId: 'chatId',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type NotificationSubscriptionScalarFieldEnum = (typeof NotificationSubscriptionScalarFieldEnum)[keyof typeof NotificationSubscriptionScalarFieldEnum]


  export const AssetConfigScalarFieldEnum: {
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

  export type AssetConfigScalarFieldEnum = (typeof AssetConfigScalarFieldEnum)[keyof typeof AssetConfigScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'StreamStatus'
   */
  export type EnumStreamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StreamStatus'>
    


  /**
   * Reference to a field of type 'StreamStatus[]'
   */
  export type ListEnumStreamStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StreamStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'NotificationPlatform'
   */
  export type EnumNotificationPlatformFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationPlatform'>
    


  /**
   * Reference to a field of type 'NotificationPlatform[]'
   */
  export type ListEnumNotificationPlatformFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationPlatform[]'>
    
  /**
   * Deep Input Types
   */


  export type StreamWhereInput = {
    AND?: StreamWhereInput | StreamWhereInput[]
    OR?: StreamWhereInput[]
    NOT?: StreamWhereInput | StreamWhereInput[]
    id?: StringFilter<"Stream"> | string
    streamId?: StringNullableFilter<"Stream"> | string | null
    txHash?: StringFilter<"Stream"> | string
    sender?: StringFilter<"Stream"> | string
    receiver?: StringFilter<"Stream"> | string
    tokenAddress?: StringNullableFilter<"Stream"> | string | null
    amount?: StringFilter<"Stream"> | string
    duration?: IntNullableFilter<"Stream"> | number | null
    status?: EnumStreamStatusFilter<"Stream"> | $Enums.StreamStatus
    withdrawn?: StringNullableFilter<"Stream"> | string | null
    legacy?: BoolFilter<"Stream"> | boolean
    migrated?: BoolFilter<"Stream"> | boolean
    isPrivate?: BoolFilter<"Stream"> | boolean
    createdAt?: DateTimeFilter<"Stream"> | Date | string
  }

  export type StreamOrderByWithRelationInput = {
    id?: SortOrder
    streamId?: SortOrderInput | SortOrder
    txHash?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrderInput | SortOrder
    amount?: SortOrder
    duration?: SortOrderInput | SortOrder
    status?: SortOrder
    withdrawn?: SortOrderInput | SortOrder
    legacy?: SortOrder
    migrated?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    streamId?: string
    txHash?: string
    AND?: StreamWhereInput | StreamWhereInput[]
    OR?: StreamWhereInput[]
    NOT?: StreamWhereInput | StreamWhereInput[]
    sender?: StringFilter<"Stream"> | string
    receiver?: StringFilter<"Stream"> | string
    tokenAddress?: StringNullableFilter<"Stream"> | string | null
    amount?: StringFilter<"Stream"> | string
    duration?: IntNullableFilter<"Stream"> | number | null
    status?: EnumStreamStatusFilter<"Stream"> | $Enums.StreamStatus
    withdrawn?: StringNullableFilter<"Stream"> | string | null
    legacy?: BoolFilter<"Stream"> | boolean
    migrated?: BoolFilter<"Stream"> | boolean
    isPrivate?: BoolFilter<"Stream"> | boolean
    createdAt?: DateTimeFilter<"Stream"> | Date | string
  }, "id" | "streamId" | "txHash">

  export type StreamOrderByWithAggregationInput = {
    id?: SortOrder
    streamId?: SortOrderInput | SortOrder
    txHash?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrderInput | SortOrder
    amount?: SortOrder
    duration?: SortOrderInput | SortOrder
    status?: SortOrder
    withdrawn?: SortOrderInput | SortOrder
    legacy?: SortOrder
    migrated?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    _count?: StreamCountOrderByAggregateInput
    _avg?: StreamAvgOrderByAggregateInput
    _max?: StreamMaxOrderByAggregateInput
    _min?: StreamMinOrderByAggregateInput
    _sum?: StreamSumOrderByAggregateInput
  }

  export type StreamScalarWhereWithAggregatesInput = {
    AND?: StreamScalarWhereWithAggregatesInput | StreamScalarWhereWithAggregatesInput[]
    OR?: StreamScalarWhereWithAggregatesInput[]
    NOT?: StreamScalarWhereWithAggregatesInput | StreamScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Stream"> | string
    streamId?: StringNullableWithAggregatesFilter<"Stream"> | string | null
    txHash?: StringWithAggregatesFilter<"Stream"> | string
    sender?: StringWithAggregatesFilter<"Stream"> | string
    receiver?: StringWithAggregatesFilter<"Stream"> | string
    tokenAddress?: StringNullableWithAggregatesFilter<"Stream"> | string | null
    amount?: StringWithAggregatesFilter<"Stream"> | string
    duration?: IntNullableWithAggregatesFilter<"Stream"> | number | null
    status?: EnumStreamStatusWithAggregatesFilter<"Stream"> | $Enums.StreamStatus
    withdrawn?: StringNullableWithAggregatesFilter<"Stream"> | string | null
    legacy?: BoolWithAggregatesFilter<"Stream"> | boolean
    migrated?: BoolWithAggregatesFilter<"Stream"> | boolean
    isPrivate?: BoolWithAggregatesFilter<"Stream"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Stream"> | Date | string
  }

  export type TokenPriceWhereInput = {
    AND?: TokenPriceWhereInput | TokenPriceWhereInput[]
    OR?: TokenPriceWhereInput[]
    NOT?: TokenPriceWhereInput | TokenPriceWhereInput[]
    tokenAddress?: StringFilter<"TokenPrice"> | string
    symbol?: StringFilter<"TokenPrice"> | string
    decimals?: IntFilter<"TokenPrice"> | number
    priceUsd?: FloatFilter<"TokenPrice"> | number
    updatedAt?: DateTimeFilter<"TokenPrice"> | Date | string
  }

  export type TokenPriceOrderByWithRelationInput = {
    tokenAddress?: SortOrder
    symbol?: SortOrder
    decimals?: SortOrder
    priceUsd?: SortOrder
    updatedAt?: SortOrder
  }

  export type TokenPriceWhereUniqueInput = Prisma.AtLeast<{
    tokenAddress?: string
    AND?: TokenPriceWhereInput | TokenPriceWhereInput[]
    OR?: TokenPriceWhereInput[]
    NOT?: TokenPriceWhereInput | TokenPriceWhereInput[]
    symbol?: StringFilter<"TokenPrice"> | string
    decimals?: IntFilter<"TokenPrice"> | number
    priceUsd?: FloatFilter<"TokenPrice"> | number
    updatedAt?: DateTimeFilter<"TokenPrice"> | Date | string
  }, "tokenAddress">

  export type TokenPriceOrderByWithAggregationInput = {
    tokenAddress?: SortOrder
    symbol?: SortOrder
    decimals?: SortOrder
    priceUsd?: SortOrder
    updatedAt?: SortOrder
    _count?: TokenPriceCountOrderByAggregateInput
    _avg?: TokenPriceAvgOrderByAggregateInput
    _max?: TokenPriceMaxOrderByAggregateInput
    _min?: TokenPriceMinOrderByAggregateInput
    _sum?: TokenPriceSumOrderByAggregateInput
  }

  export type TokenPriceScalarWhereWithAggregatesInput = {
    AND?: TokenPriceScalarWhereWithAggregatesInput | TokenPriceScalarWhereWithAggregatesInput[]
    OR?: TokenPriceScalarWhereWithAggregatesInput[]
    NOT?: TokenPriceScalarWhereWithAggregatesInput | TokenPriceScalarWhereWithAggregatesInput[]
    tokenAddress?: StringWithAggregatesFilter<"TokenPrice"> | string
    symbol?: StringWithAggregatesFilter<"TokenPrice"> | string
    decimals?: IntWithAggregatesFilter<"TokenPrice"> | number
    priceUsd?: FloatWithAggregatesFilter<"TokenPrice"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"TokenPrice"> | Date | string
  }

  export type WebhookWhereInput = {
    AND?: WebhookWhereInput | WebhookWhereInput[]
    OR?: WebhookWhereInput[]
    NOT?: WebhookWhereInput | WebhookWhereInput[]
    id?: StringFilter<"Webhook"> | string
    url?: StringFilter<"Webhook"> | string
    description?: StringNullableFilter<"Webhook"> | string | null
    isActive?: BoolFilter<"Webhook"> | boolean
    createdAt?: DateTimeFilter<"Webhook"> | Date | string
    updatedAt?: DateTimeFilter<"Webhook"> | Date | string
  }

  export type WebhookOrderByWithRelationInput = {
    id?: SortOrder
    url?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    url?: string
    AND?: WebhookWhereInput | WebhookWhereInput[]
    OR?: WebhookWhereInput[]
    NOT?: WebhookWhereInput | WebhookWhereInput[]
    description?: StringNullableFilter<"Webhook"> | string | null
    isActive?: BoolFilter<"Webhook"> | boolean
    createdAt?: DateTimeFilter<"Webhook"> | Date | string
    updatedAt?: DateTimeFilter<"Webhook"> | Date | string
  }, "id" | "url">

  export type WebhookOrderByWithAggregationInput = {
    id?: SortOrder
    url?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WebhookCountOrderByAggregateInput
    _max?: WebhookMaxOrderByAggregateInput
    _min?: WebhookMinOrderByAggregateInput
  }

  export type WebhookScalarWhereWithAggregatesInput = {
    AND?: WebhookScalarWhereWithAggregatesInput | WebhookScalarWhereWithAggregatesInput[]
    OR?: WebhookScalarWhereWithAggregatesInput[]
    NOT?: WebhookScalarWhereWithAggregatesInput | WebhookScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Webhook"> | string
    url?: StringWithAggregatesFilter<"Webhook"> | string
    description?: StringNullableWithAggregatesFilter<"Webhook"> | string | null
    isActive?: BoolWithAggregatesFilter<"Webhook"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Webhook"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Webhook"> | Date | string
  }

  export type SyncStateWhereInput = {
    AND?: SyncStateWhereInput | SyncStateWhereInput[]
    OR?: SyncStateWhereInput[]
    NOT?: SyncStateWhereInput | SyncStateWhereInput[]
    id?: IntFilter<"SyncState"> | number
    lastLedgerSequence?: IntFilter<"SyncState"> | number
  }

  export type SyncStateOrderByWithRelationInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type SyncStateWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SyncStateWhereInput | SyncStateWhereInput[]
    OR?: SyncStateWhereInput[]
    NOT?: SyncStateWhereInput | SyncStateWhereInput[]
    lastLedgerSequence?: IntFilter<"SyncState"> | number
  }, "id">

  export type SyncStateOrderByWithAggregationInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
    _count?: SyncStateCountOrderByAggregateInput
    _avg?: SyncStateAvgOrderByAggregateInput
    _max?: SyncStateMaxOrderByAggregateInput
    _min?: SyncStateMinOrderByAggregateInput
    _sum?: SyncStateSumOrderByAggregateInput
  }

  export type SyncStateScalarWhereWithAggregatesInput = {
    AND?: SyncStateScalarWhereWithAggregatesInput | SyncStateScalarWhereWithAggregatesInput[]
    OR?: SyncStateScalarWhereWithAggregatesInput[]
    NOT?: SyncStateScalarWhereWithAggregatesInput | SyncStateScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SyncState"> | number
    lastLedgerSequence?: IntWithAggregatesFilter<"SyncState"> | number
  }

  export type EventLogWhereInput = {
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    id?: StringFilter<"EventLog"> | string
    eventType?: StringFilter<"EventLog"> | string
    streamId?: StringFilter<"EventLog"> | string
    txHash?: StringFilter<"EventLog"> | string
    eventIndex?: IntFilter<"EventLog"> | number
    ledger?: IntFilter<"EventLog"> | number
    ledgerClosedAt?: StringFilter<"EventLog"> | string
    sender?: StringNullableFilter<"EventLog"> | string | null
    receiver?: StringNullableFilter<"EventLog"> | string | null
    amount?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    metadata?: StringNullableFilter<"EventLog"> | string | null
    createdAt?: DateTimeFilter<"EventLog"> | Date | string
  }

  export type EventLogOrderByWithRelationInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    eventIndex?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrderInput | SortOrder
    receiver?: SortOrderInput | SortOrder
    amount?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type EventLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    txHash_eventIndex?: EventLogTxHashEventIndexCompoundUniqueInput
    AND?: EventLogWhereInput | EventLogWhereInput[]
    OR?: EventLogWhereInput[]
    NOT?: EventLogWhereInput | EventLogWhereInput[]
    eventType?: StringFilter<"EventLog"> | string
    streamId?: StringFilter<"EventLog"> | string
    txHash?: StringFilter<"EventLog"> | string
    eventIndex?: IntFilter<"EventLog"> | number
    ledger?: IntFilter<"EventLog"> | number
    ledgerClosedAt?: StringFilter<"EventLog"> | string
    sender?: StringNullableFilter<"EventLog"> | string | null
    receiver?: StringNullableFilter<"EventLog"> | string | null
    amount?: BigIntNullableFilter<"EventLog"> | bigint | number | null
    metadata?: StringNullableFilter<"EventLog"> | string | null
    createdAt?: DateTimeFilter<"EventLog"> | Date | string
  }, "id" | "txHash_eventIndex">

  export type EventLogOrderByWithAggregationInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    eventIndex?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrderInput | SortOrder
    receiver?: SortOrderInput | SortOrder
    amount?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: EventLogCountOrderByAggregateInput
    _avg?: EventLogAvgOrderByAggregateInput
    _max?: EventLogMaxOrderByAggregateInput
    _min?: EventLogMinOrderByAggregateInput
    _sum?: EventLogSumOrderByAggregateInput
  }

  export type EventLogScalarWhereWithAggregatesInput = {
    AND?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    OR?: EventLogScalarWhereWithAggregatesInput[]
    NOT?: EventLogScalarWhereWithAggregatesInput | EventLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EventLog"> | string
    eventType?: StringWithAggregatesFilter<"EventLog"> | string
    streamId?: StringWithAggregatesFilter<"EventLog"> | string
    txHash?: StringWithAggregatesFilter<"EventLog"> | string
    eventIndex?: IntWithAggregatesFilter<"EventLog"> | number
    ledger?: IntWithAggregatesFilter<"EventLog"> | number
    ledgerClosedAt?: StringWithAggregatesFilter<"EventLog"> | string
    sender?: StringNullableWithAggregatesFilter<"EventLog"> | string | null
    receiver?: StringNullableWithAggregatesFilter<"EventLog"> | string | null
    amount?: BigIntNullableWithAggregatesFilter<"EventLog"> | bigint | number | null
    metadata?: StringNullableWithAggregatesFilter<"EventLog"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"EventLog"> | Date | string
  }

  export type StreamSnapshotWhereInput = {
    AND?: StreamSnapshotWhereInput | StreamSnapshotWhereInput[]
    OR?: StreamSnapshotWhereInput[]
    NOT?: StreamSnapshotWhereInput | StreamSnapshotWhereInput[]
    id?: StringFilter<"StreamSnapshot"> | string
    streamId?: StringFilter<"StreamSnapshot"> | string
    sender?: StringFilter<"StreamSnapshot"> | string
    receiver?: StringFilter<"StreamSnapshot"> | string
    tokenAddress?: StringFilter<"StreamSnapshot"> | string
    amountPerSecond?: BigIntFilter<"StreamSnapshot"> | bigint | number
    totalAmount?: BigIntFilter<"StreamSnapshot"> | bigint | number
    status?: EnumStreamStatusFilter<"StreamSnapshot"> | $Enums.StreamStatus
    snapshotMonth?: StringFilter<"StreamSnapshot"> | string
    createdAt?: DateTimeFilter<"StreamSnapshot"> | Date | string
  }

  export type StreamSnapshotOrderByWithRelationInput = {
    id?: SortOrder
    streamId?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
    status?: SortOrder
    snapshotMonth?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamSnapshotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    streamId_snapshotMonth?: StreamSnapshotStreamIdSnapshotMonthCompoundUniqueInput
    AND?: StreamSnapshotWhereInput | StreamSnapshotWhereInput[]
    OR?: StreamSnapshotWhereInput[]
    NOT?: StreamSnapshotWhereInput | StreamSnapshotWhereInput[]
    streamId?: StringFilter<"StreamSnapshot"> | string
    sender?: StringFilter<"StreamSnapshot"> | string
    receiver?: StringFilter<"StreamSnapshot"> | string
    tokenAddress?: StringFilter<"StreamSnapshot"> | string
    amountPerSecond?: BigIntFilter<"StreamSnapshot"> | bigint | number
    totalAmount?: BigIntFilter<"StreamSnapshot"> | bigint | number
    status?: EnumStreamStatusFilter<"StreamSnapshot"> | $Enums.StreamStatus
    snapshotMonth?: StringFilter<"StreamSnapshot"> | string
    createdAt?: DateTimeFilter<"StreamSnapshot"> | Date | string
  }, "id" | "streamId_snapshotMonth">

  export type StreamSnapshotOrderByWithAggregationInput = {
    id?: SortOrder
    streamId?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
    status?: SortOrder
    snapshotMonth?: SortOrder
    createdAt?: SortOrder
    _count?: StreamSnapshotCountOrderByAggregateInput
    _avg?: StreamSnapshotAvgOrderByAggregateInput
    _max?: StreamSnapshotMaxOrderByAggregateInput
    _min?: StreamSnapshotMinOrderByAggregateInput
    _sum?: StreamSnapshotSumOrderByAggregateInput
  }

  export type StreamSnapshotScalarWhereWithAggregatesInput = {
    AND?: StreamSnapshotScalarWhereWithAggregatesInput | StreamSnapshotScalarWhereWithAggregatesInput[]
    OR?: StreamSnapshotScalarWhereWithAggregatesInput[]
    NOT?: StreamSnapshotScalarWhereWithAggregatesInput | StreamSnapshotScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    streamId?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    sender?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    receiver?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    tokenAddress?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    amountPerSecond?: BigIntWithAggregatesFilter<"StreamSnapshot"> | bigint | number
    totalAmount?: BigIntWithAggregatesFilter<"StreamSnapshot"> | bigint | number
    status?: EnumStreamStatusWithAggregatesFilter<"StreamSnapshot"> | $Enums.StreamStatus
    snapshotMonth?: StringWithAggregatesFilter<"StreamSnapshot"> | string
    createdAt?: DateTimeWithAggregatesFilter<"StreamSnapshot"> | Date | string
  }

  export type StreamArchiveWhereInput = {
    AND?: StreamArchiveWhereInput | StreamArchiveWhereInput[]
    OR?: StreamArchiveWhereInput[]
    NOT?: StreamArchiveWhereInput | StreamArchiveWhereInput[]
    id?: StringFilter<"StreamArchive"> | string
    eventType?: StringFilter<"StreamArchive"> | string
    streamId?: StringFilter<"StreamArchive"> | string
    txHash?: StringFilter<"StreamArchive"> | string
    ledger?: IntFilter<"StreamArchive"> | number
    ledgerClosedAt?: StringFilter<"StreamArchive"> | string
    sender?: StringNullableFilter<"StreamArchive"> | string | null
    receiver?: StringNullableFilter<"StreamArchive"> | string | null
    amount?: BigIntNullableFilter<"StreamArchive"> | bigint | number | null
    metadata?: StringNullableFilter<"StreamArchive"> | string | null
    createdAt?: DateTimeFilter<"StreamArchive"> | Date | string
    archivedAt?: DateTimeFilter<"StreamArchive"> | Date | string
  }

  export type StreamArchiveOrderByWithRelationInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrderInput | SortOrder
    receiver?: SortOrderInput | SortOrder
    amount?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    archivedAt?: SortOrder
  }

  export type StreamArchiveWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: StreamArchiveWhereInput | StreamArchiveWhereInput[]
    OR?: StreamArchiveWhereInput[]
    NOT?: StreamArchiveWhereInput | StreamArchiveWhereInput[]
    eventType?: StringFilter<"StreamArchive"> | string
    streamId?: StringFilter<"StreamArchive"> | string
    txHash?: StringFilter<"StreamArchive"> | string
    ledger?: IntFilter<"StreamArchive"> | number
    ledgerClosedAt?: StringFilter<"StreamArchive"> | string
    sender?: StringNullableFilter<"StreamArchive"> | string | null
    receiver?: StringNullableFilter<"StreamArchive"> | string | null
    amount?: BigIntNullableFilter<"StreamArchive"> | bigint | number | null
    metadata?: StringNullableFilter<"StreamArchive"> | string | null
    createdAt?: DateTimeFilter<"StreamArchive"> | Date | string
    archivedAt?: DateTimeFilter<"StreamArchive"> | Date | string
  }, "id">

  export type StreamArchiveOrderByWithAggregationInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrderInput | SortOrder
    receiver?: SortOrderInput | SortOrder
    amount?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    archivedAt?: SortOrder
    _count?: StreamArchiveCountOrderByAggregateInput
    _avg?: StreamArchiveAvgOrderByAggregateInput
    _max?: StreamArchiveMaxOrderByAggregateInput
    _min?: StreamArchiveMinOrderByAggregateInput
    _sum?: StreamArchiveSumOrderByAggregateInput
  }

  export type StreamArchiveScalarWhereWithAggregatesInput = {
    AND?: StreamArchiveScalarWhereWithAggregatesInput | StreamArchiveScalarWhereWithAggregatesInput[]
    OR?: StreamArchiveScalarWhereWithAggregatesInput[]
    NOT?: StreamArchiveScalarWhereWithAggregatesInput | StreamArchiveScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StreamArchive"> | string
    eventType?: StringWithAggregatesFilter<"StreamArchive"> | string
    streamId?: StringWithAggregatesFilter<"StreamArchive"> | string
    txHash?: StringWithAggregatesFilter<"StreamArchive"> | string
    ledger?: IntWithAggregatesFilter<"StreamArchive"> | number
    ledgerClosedAt?: StringWithAggregatesFilter<"StreamArchive"> | string
    sender?: StringNullableWithAggregatesFilter<"StreamArchive"> | string | null
    receiver?: StringNullableWithAggregatesFilter<"StreamArchive"> | string | null
    amount?: BigIntNullableWithAggregatesFilter<"StreamArchive"> | bigint | number | null
    metadata?: StringNullableWithAggregatesFilter<"StreamArchive"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"StreamArchive"> | Date | string
    archivedAt?: DateTimeWithAggregatesFilter<"StreamArchive"> | Date | string
  }

  export type BridgeLogWhereInput = {
    AND?: BridgeLogWhereInput | BridgeLogWhereInput[]
    OR?: BridgeLogWhereInput[]
    NOT?: BridgeLogWhereInput | BridgeLogWhereInput[]
    id?: StringFilter<"BridgeLog"> | string
    bridge?: StringFilter<"BridgeLog"> | string
    eventType?: StringFilter<"BridgeLog"> | string
    sourceChain?: StringFilter<"BridgeLog"> | string
    targetChain?: StringFilter<"BridgeLog"> | string
    sourceAsset?: StringFilter<"BridgeLog"> | string
    targetAsset?: StringNullableFilter<"BridgeLog"> | string | null
    amount?: StringFilter<"BridgeLog"> | string
    sender?: StringNullableFilter<"BridgeLog"> | string | null
    recipient?: StringFilter<"BridgeLog"> | string
    txHash?: StringFilter<"BridgeLog"> | string
    status?: StringFilter<"BridgeLog"> | string
    payload?: StringNullableFilter<"BridgeLog"> | string | null
    landedAt?: DateTimeNullableFilter<"BridgeLog"> | Date | string | null
    createdAt?: DateTimeFilter<"BridgeLog"> | Date | string
  }

  export type BridgeLogOrderByWithRelationInput = {
    id?: SortOrder
    bridge?: SortOrder
    eventType?: SortOrder
    sourceChain?: SortOrder
    targetChain?: SortOrder
    sourceAsset?: SortOrder
    targetAsset?: SortOrderInput | SortOrder
    amount?: SortOrder
    sender?: SortOrderInput | SortOrder
    recipient?: SortOrder
    txHash?: SortOrder
    status?: SortOrder
    payload?: SortOrderInput | SortOrder
    landedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type BridgeLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    txHash?: string
    AND?: BridgeLogWhereInput | BridgeLogWhereInput[]
    OR?: BridgeLogWhereInput[]
    NOT?: BridgeLogWhereInput | BridgeLogWhereInput[]
    bridge?: StringFilter<"BridgeLog"> | string
    eventType?: StringFilter<"BridgeLog"> | string
    sourceChain?: StringFilter<"BridgeLog"> | string
    targetChain?: StringFilter<"BridgeLog"> | string
    sourceAsset?: StringFilter<"BridgeLog"> | string
    targetAsset?: StringNullableFilter<"BridgeLog"> | string | null
    amount?: StringFilter<"BridgeLog"> | string
    sender?: StringNullableFilter<"BridgeLog"> | string | null
    recipient?: StringFilter<"BridgeLog"> | string
    status?: StringFilter<"BridgeLog"> | string
    payload?: StringNullableFilter<"BridgeLog"> | string | null
    landedAt?: DateTimeNullableFilter<"BridgeLog"> | Date | string | null
    createdAt?: DateTimeFilter<"BridgeLog"> | Date | string
  }, "id" | "txHash">

  export type BridgeLogOrderByWithAggregationInput = {
    id?: SortOrder
    bridge?: SortOrder
    eventType?: SortOrder
    sourceChain?: SortOrder
    targetChain?: SortOrder
    sourceAsset?: SortOrder
    targetAsset?: SortOrderInput | SortOrder
    amount?: SortOrder
    sender?: SortOrderInput | SortOrder
    recipient?: SortOrder
    txHash?: SortOrder
    status?: SortOrder
    payload?: SortOrderInput | SortOrder
    landedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: BridgeLogCountOrderByAggregateInput
    _max?: BridgeLogMaxOrderByAggregateInput
    _min?: BridgeLogMinOrderByAggregateInput
  }

  export type BridgeLogScalarWhereWithAggregatesInput = {
    AND?: BridgeLogScalarWhereWithAggregatesInput | BridgeLogScalarWhereWithAggregatesInput[]
    OR?: BridgeLogScalarWhereWithAggregatesInput[]
    NOT?: BridgeLogScalarWhereWithAggregatesInput | BridgeLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BridgeLog"> | string
    bridge?: StringWithAggregatesFilter<"BridgeLog"> | string
    eventType?: StringWithAggregatesFilter<"BridgeLog"> | string
    sourceChain?: StringWithAggregatesFilter<"BridgeLog"> | string
    targetChain?: StringWithAggregatesFilter<"BridgeLog"> | string
    sourceAsset?: StringWithAggregatesFilter<"BridgeLog"> | string
    targetAsset?: StringNullableWithAggregatesFilter<"BridgeLog"> | string | null
    amount?: StringWithAggregatesFilter<"BridgeLog"> | string
    sender?: StringNullableWithAggregatesFilter<"BridgeLog"> | string | null
    recipient?: StringWithAggregatesFilter<"BridgeLog"> | string
    txHash?: StringWithAggregatesFilter<"BridgeLog"> | string
    status?: StringWithAggregatesFilter<"BridgeLog"> | string
    payload?: StringNullableWithAggregatesFilter<"BridgeLog"> | string | null
    landedAt?: DateTimeNullableWithAggregatesFilter<"BridgeLog"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"BridgeLog"> | Date | string
  }

  export type ProposalWhereInput = {
    AND?: ProposalWhereInput | ProposalWhereInput[]
    OR?: ProposalWhereInput[]
    NOT?: ProposalWhereInput | ProposalWhereInput[]
    id?: StringFilter<"Proposal"> | string
    creator?: StringFilter<"Proposal"> | string
    description?: StringFilter<"Proposal"> | string
    quorum?: IntFilter<"Proposal"> | number
    votesFor?: IntFilter<"Proposal"> | number
    votesAgainst?: IntFilter<"Proposal"> | number
    txHash?: StringFilter<"Proposal"> | string
    createdAt?: DateTimeFilter<"Proposal"> | Date | string
    updatedAt?: DateTimeFilter<"Proposal"> | Date | string
  }

  export type ProposalOrderByWithRelationInput = {
    id?: SortOrder
    creator?: SortOrder
    description?: SortOrder
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
    txHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProposalWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    txHash?: string
    AND?: ProposalWhereInput | ProposalWhereInput[]
    OR?: ProposalWhereInput[]
    NOT?: ProposalWhereInput | ProposalWhereInput[]
    creator?: StringFilter<"Proposal"> | string
    description?: StringFilter<"Proposal"> | string
    quorum?: IntFilter<"Proposal"> | number
    votesFor?: IntFilter<"Proposal"> | number
    votesAgainst?: IntFilter<"Proposal"> | number
    createdAt?: DateTimeFilter<"Proposal"> | Date | string
    updatedAt?: DateTimeFilter<"Proposal"> | Date | string
  }, "id" | "txHash">

  export type ProposalOrderByWithAggregationInput = {
    id?: SortOrder
    creator?: SortOrder
    description?: SortOrder
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
    txHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProposalCountOrderByAggregateInput
    _avg?: ProposalAvgOrderByAggregateInput
    _max?: ProposalMaxOrderByAggregateInput
    _min?: ProposalMinOrderByAggregateInput
    _sum?: ProposalSumOrderByAggregateInput
  }

  export type ProposalScalarWhereWithAggregatesInput = {
    AND?: ProposalScalarWhereWithAggregatesInput | ProposalScalarWhereWithAggregatesInput[]
    OR?: ProposalScalarWhereWithAggregatesInput[]
    NOT?: ProposalScalarWhereWithAggregatesInput | ProposalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Proposal"> | string
    creator?: StringWithAggregatesFilter<"Proposal"> | string
    description?: StringWithAggregatesFilter<"Proposal"> | string
    quorum?: IntWithAggregatesFilter<"Proposal"> | number
    votesFor?: IntWithAggregatesFilter<"Proposal"> | number
    votesAgainst?: IntWithAggregatesFilter<"Proposal"> | number
    txHash?: StringWithAggregatesFilter<"Proposal"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Proposal"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Proposal"> | Date | string
  }

  export type ApiKeyWhereInput = {
    AND?: ApiKeyWhereInput | ApiKeyWhereInput[]
    OR?: ApiKeyWhereInput[]
    NOT?: ApiKeyWhereInput | ApiKeyWhereInput[]
    id?: StringFilter<"ApiKey"> | string
    keyHash?: StringFilter<"ApiKey"> | string
    name?: StringFilter<"ApiKey"> | string
    owner?: StringFilter<"ApiKey"> | string
    rateLimit?: IntFilter<"ApiKey"> | number
    isActive?: BoolFilter<"ApiKey"> | boolean
    createdAt?: DateTimeFilter<"ApiKey"> | Date | string
    updatedAt?: DateTimeFilter<"ApiKey"> | Date | string
    lastUsedAt?: DateTimeNullableFilter<"ApiKey"> | Date | string | null
  }

  export type ApiKeyOrderByWithRelationInput = {
    id?: SortOrder
    keyHash?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    rateLimit?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
  }

  export type ApiKeyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    keyHash?: string
    AND?: ApiKeyWhereInput | ApiKeyWhereInput[]
    OR?: ApiKeyWhereInput[]
    NOT?: ApiKeyWhereInput | ApiKeyWhereInput[]
    name?: StringFilter<"ApiKey"> | string
    owner?: StringFilter<"ApiKey"> | string
    rateLimit?: IntFilter<"ApiKey"> | number
    isActive?: BoolFilter<"ApiKey"> | boolean
    createdAt?: DateTimeFilter<"ApiKey"> | Date | string
    updatedAt?: DateTimeFilter<"ApiKey"> | Date | string
    lastUsedAt?: DateTimeNullableFilter<"ApiKey"> | Date | string | null
  }, "id" | "keyHash">

  export type ApiKeyOrderByWithAggregationInput = {
    id?: SortOrder
    keyHash?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    rateLimit?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    _count?: ApiKeyCountOrderByAggregateInput
    _avg?: ApiKeyAvgOrderByAggregateInput
    _max?: ApiKeyMaxOrderByAggregateInput
    _min?: ApiKeyMinOrderByAggregateInput
    _sum?: ApiKeySumOrderByAggregateInput
  }

  export type ApiKeyScalarWhereWithAggregatesInput = {
    AND?: ApiKeyScalarWhereWithAggregatesInput | ApiKeyScalarWhereWithAggregatesInput[]
    OR?: ApiKeyScalarWhereWithAggregatesInput[]
    NOT?: ApiKeyScalarWhereWithAggregatesInput | ApiKeyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ApiKey"> | string
    keyHash?: StringWithAggregatesFilter<"ApiKey"> | string
    name?: StringWithAggregatesFilter<"ApiKey"> | string
    owner?: StringWithAggregatesFilter<"ApiKey"> | string
    rateLimit?: IntWithAggregatesFilter<"ApiKey"> | number
    isActive?: BoolWithAggregatesFilter<"ApiKey"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"ApiKey"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ApiKey"> | Date | string
    lastUsedAt?: DateTimeNullableWithAggregatesFilter<"ApiKey"> | Date | string | null
  }

  export type LedgerHashWhereInput = {
    AND?: LedgerHashWhereInput | LedgerHashWhereInput[]
    OR?: LedgerHashWhereInput[]
    NOT?: LedgerHashWhereInput | LedgerHashWhereInput[]
    sequence?: IntFilter<"LedgerHash"> | number
    hash?: StringFilter<"LedgerHash"> | string
    createdAt?: DateTimeFilter<"LedgerHash"> | Date | string
  }

  export type LedgerHashOrderByWithRelationInput = {
    sequence?: SortOrder
    hash?: SortOrder
    createdAt?: SortOrder
  }

  export type LedgerHashWhereUniqueInput = Prisma.AtLeast<{
    sequence?: number
    AND?: LedgerHashWhereInput | LedgerHashWhereInput[]
    OR?: LedgerHashWhereInput[]
    NOT?: LedgerHashWhereInput | LedgerHashWhereInput[]
    hash?: StringFilter<"LedgerHash"> | string
    createdAt?: DateTimeFilter<"LedgerHash"> | Date | string
  }, "sequence">

  export type LedgerHashOrderByWithAggregationInput = {
    sequence?: SortOrder
    hash?: SortOrder
    createdAt?: SortOrder
    _count?: LedgerHashCountOrderByAggregateInput
    _avg?: LedgerHashAvgOrderByAggregateInput
    _max?: LedgerHashMaxOrderByAggregateInput
    _min?: LedgerHashMinOrderByAggregateInput
    _sum?: LedgerHashSumOrderByAggregateInput
  }

  export type LedgerHashScalarWhereWithAggregatesInput = {
    AND?: LedgerHashScalarWhereWithAggregatesInput | LedgerHashScalarWhereWithAggregatesInput[]
    OR?: LedgerHashScalarWhereWithAggregatesInput[]
    NOT?: LedgerHashScalarWhereWithAggregatesInput | LedgerHashScalarWhereWithAggregatesInput[]
    sequence?: IntWithAggregatesFilter<"LedgerHash"> | number
    hash?: StringWithAggregatesFilter<"LedgerHash"> | string
    createdAt?: DateTimeWithAggregatesFilter<"LedgerHash"> | Date | string
  }

  export type NotificationSubscriptionWhereInput = {
    AND?: NotificationSubscriptionWhereInput | NotificationSubscriptionWhereInput[]
    OR?: NotificationSubscriptionWhereInput[]
    NOT?: NotificationSubscriptionWhereInput | NotificationSubscriptionWhereInput[]
    id?: StringFilter<"NotificationSubscription"> | string
    stellarAddress?: StringFilter<"NotificationSubscription"> | string
    platform?: EnumNotificationPlatformFilter<"NotificationSubscription"> | $Enums.NotificationPlatform
    webhookUrl?: StringNullableFilter<"NotificationSubscription"> | string | null
    chatId?: StringNullableFilter<"NotificationSubscription"> | string | null
    isActive?: BoolFilter<"NotificationSubscription"> | boolean
    createdAt?: DateTimeFilter<"NotificationSubscription"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationSubscription"> | Date | string
  }

  export type NotificationSubscriptionOrderByWithRelationInput = {
    id?: SortOrder
    stellarAddress?: SortOrder
    platform?: SortOrder
    webhookUrl?: SortOrderInput | SortOrder
    chatId?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationSubscriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    stellarAddress_platform?: NotificationSubscriptionStellarAddressPlatformCompoundUniqueInput
    AND?: NotificationSubscriptionWhereInput | NotificationSubscriptionWhereInput[]
    OR?: NotificationSubscriptionWhereInput[]
    NOT?: NotificationSubscriptionWhereInput | NotificationSubscriptionWhereInput[]
    stellarAddress?: StringFilter<"NotificationSubscription"> | string
    platform?: EnumNotificationPlatformFilter<"NotificationSubscription"> | $Enums.NotificationPlatform
    webhookUrl?: StringNullableFilter<"NotificationSubscription"> | string | null
    chatId?: StringNullableFilter<"NotificationSubscription"> | string | null
    isActive?: BoolFilter<"NotificationSubscription"> | boolean
    createdAt?: DateTimeFilter<"NotificationSubscription"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationSubscription"> | Date | string
  }, "id" | "stellarAddress_platform">

  export type NotificationSubscriptionOrderByWithAggregationInput = {
    id?: SortOrder
    stellarAddress?: SortOrder
    platform?: SortOrder
    webhookUrl?: SortOrderInput | SortOrder
    chatId?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: NotificationSubscriptionCountOrderByAggregateInput
    _max?: NotificationSubscriptionMaxOrderByAggregateInput
    _min?: NotificationSubscriptionMinOrderByAggregateInput
  }

  export type NotificationSubscriptionScalarWhereWithAggregatesInput = {
    AND?: NotificationSubscriptionScalarWhereWithAggregatesInput | NotificationSubscriptionScalarWhereWithAggregatesInput[]
    OR?: NotificationSubscriptionScalarWhereWithAggregatesInput[]
    NOT?: NotificationSubscriptionScalarWhereWithAggregatesInput | NotificationSubscriptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"NotificationSubscription"> | string
    stellarAddress?: StringWithAggregatesFilter<"NotificationSubscription"> | string
    platform?: EnumNotificationPlatformWithAggregatesFilter<"NotificationSubscription"> | $Enums.NotificationPlatform
    webhookUrl?: StringNullableWithAggregatesFilter<"NotificationSubscription"> | string | null
    chatId?: StringNullableWithAggregatesFilter<"NotificationSubscription"> | string | null
    isActive?: BoolWithAggregatesFilter<"NotificationSubscription"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"NotificationSubscription"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"NotificationSubscription"> | Date | string
  }

  export type AssetConfigWhereInput = {
    AND?: AssetConfigWhereInput | AssetConfigWhereInput[]
    OR?: AssetConfigWhereInput[]
    NOT?: AssetConfigWhereInput | AssetConfigWhereInput[]
    id?: StringFilter<"AssetConfig"> | string
    assetId?: StringFilter<"AssetConfig"> | string
    symbol?: StringFilter<"AssetConfig"> | string
    name?: StringFilter<"AssetConfig"> | string
    decimals?: IntFilter<"AssetConfig"> | number
    isVerified?: BoolFilter<"AssetConfig"> | boolean
    isVisible?: BoolFilter<"AssetConfig"> | boolean
    yieldEnabled?: BoolFilter<"AssetConfig"> | boolean
    iconUrl?: StringNullableFilter<"AssetConfig"> | string | null
    createdAt?: DateTimeFilter<"AssetConfig"> | Date | string
    updatedAt?: DateTimeFilter<"AssetConfig"> | Date | string
  }

  export type AssetConfigOrderByWithRelationInput = {
    id?: SortOrder
    assetId?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    decimals?: SortOrder
    isVerified?: SortOrder
    isVisible?: SortOrder
    yieldEnabled?: SortOrder
    iconUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AssetConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    assetId?: string
    AND?: AssetConfigWhereInput | AssetConfigWhereInput[]
    OR?: AssetConfigWhereInput[]
    NOT?: AssetConfigWhereInput | AssetConfigWhereInput[]
    symbol?: StringFilter<"AssetConfig"> | string
    name?: StringFilter<"AssetConfig"> | string
    decimals?: IntFilter<"AssetConfig"> | number
    isVerified?: BoolFilter<"AssetConfig"> | boolean
    isVisible?: BoolFilter<"AssetConfig"> | boolean
    yieldEnabled?: BoolFilter<"AssetConfig"> | boolean
    iconUrl?: StringNullableFilter<"AssetConfig"> | string | null
    createdAt?: DateTimeFilter<"AssetConfig"> | Date | string
    updatedAt?: DateTimeFilter<"AssetConfig"> | Date | string
  }, "id" | "assetId">

  export type AssetConfigOrderByWithAggregationInput = {
    id?: SortOrder
    assetId?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    decimals?: SortOrder
    isVerified?: SortOrder
    isVisible?: SortOrder
    yieldEnabled?: SortOrder
    iconUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AssetConfigCountOrderByAggregateInput
    _avg?: AssetConfigAvgOrderByAggregateInput
    _max?: AssetConfigMaxOrderByAggregateInput
    _min?: AssetConfigMinOrderByAggregateInput
    _sum?: AssetConfigSumOrderByAggregateInput
  }

  export type AssetConfigScalarWhereWithAggregatesInput = {
    AND?: AssetConfigScalarWhereWithAggregatesInput | AssetConfigScalarWhereWithAggregatesInput[]
    OR?: AssetConfigScalarWhereWithAggregatesInput[]
    NOT?: AssetConfigScalarWhereWithAggregatesInput | AssetConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AssetConfig"> | string
    assetId?: StringWithAggregatesFilter<"AssetConfig"> | string
    symbol?: StringWithAggregatesFilter<"AssetConfig"> | string
    name?: StringWithAggregatesFilter<"AssetConfig"> | string
    decimals?: IntWithAggregatesFilter<"AssetConfig"> | number
    isVerified?: BoolWithAggregatesFilter<"AssetConfig"> | boolean
    isVisible?: BoolWithAggregatesFilter<"AssetConfig"> | boolean
    yieldEnabled?: BoolWithAggregatesFilter<"AssetConfig"> | boolean
    iconUrl?: StringNullableWithAggregatesFilter<"AssetConfig"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"AssetConfig"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AssetConfig"> | Date | string
  }

  export type StreamCreateInput = {
    id?: string
    streamId?: string | null
    txHash: string
    sender: string
    receiver: string
    tokenAddress?: string | null
    amount: string
    duration?: number | null
    status?: $Enums.StreamStatus
    withdrawn?: string | null
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type StreamUncheckedCreateInput = {
    id?: string
    streamId?: string | null
    txHash: string
    sender: string
    receiver: string
    tokenAddress?: string | null
    amount: string
    duration?: number | null
    status?: $Enums.StreamStatus
    withdrawn?: string | null
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type StreamUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: NullableStringFieldUpdateOperationsInput | string | null
    txHash?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    withdrawn?: NullableStringFieldUpdateOperationsInput | string | null
    legacy?: BoolFieldUpdateOperationsInput | boolean
    migrated?: BoolFieldUpdateOperationsInput | boolean
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: NullableStringFieldUpdateOperationsInput | string | null
    txHash?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    withdrawn?: NullableStringFieldUpdateOperationsInput | string | null
    legacy?: BoolFieldUpdateOperationsInput | boolean
    migrated?: BoolFieldUpdateOperationsInput | boolean
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamCreateManyInput = {
    id?: string
    streamId?: string | null
    txHash: string
    sender: string
    receiver: string
    tokenAddress?: string | null
    amount: string
    duration?: number | null
    status?: $Enums.StreamStatus
    withdrawn?: string | null
    legacy?: boolean
    migrated?: boolean
    isPrivate?: boolean
    createdAt?: Date | string
  }

  export type StreamUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: NullableStringFieldUpdateOperationsInput | string | null
    txHash?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    withdrawn?: NullableStringFieldUpdateOperationsInput | string | null
    legacy?: BoolFieldUpdateOperationsInput | boolean
    migrated?: BoolFieldUpdateOperationsInput | boolean
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: NullableStringFieldUpdateOperationsInput | string | null
    txHash?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    withdrawn?: NullableStringFieldUpdateOperationsInput | string | null
    legacy?: BoolFieldUpdateOperationsInput | boolean
    migrated?: BoolFieldUpdateOperationsInput | boolean
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TokenPriceCreateInput = {
    tokenAddress: string
    symbol: string
    decimals?: number
    priceUsd?: number
    updatedAt?: Date | string
  }

  export type TokenPriceUncheckedCreateInput = {
    tokenAddress: string
    symbol: string
    decimals?: number
    priceUsd?: number
    updatedAt?: Date | string
  }

  export type TokenPriceUpdateInput = {
    tokenAddress?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    priceUsd?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TokenPriceUncheckedUpdateInput = {
    tokenAddress?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    priceUsd?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TokenPriceCreateManyInput = {
    tokenAddress: string
    symbol: string
    decimals?: number
    priceUsd?: number
    updatedAt?: Date | string
  }

  export type TokenPriceUpdateManyMutationInput = {
    tokenAddress?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    priceUsd?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TokenPriceUncheckedUpdateManyInput = {
    tokenAddress?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    priceUsd?: FloatFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookCreateInput = {
    id?: string
    url: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookUncheckedCreateInput = {
    id?: string
    url: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookCreateManyInput = {
    id?: string
    url: string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncStateCreateInput = {
    id?: number
    lastLedgerSequence?: number
  }

  export type SyncStateUncheckedCreateInput = {
    id?: number
    lastLedgerSequence?: number
  }

  export type SyncStateUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    lastLedgerSequence?: IntFieldUpdateOperationsInput | number
  }

  export type SyncStateUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    lastLedgerSequence?: IntFieldUpdateOperationsInput | number
  }

  export type SyncStateCreateManyInput = {
    id?: number
    lastLedgerSequence?: number
  }

  export type SyncStateUpdateManyMutationInput = {
    id?: IntFieldUpdateOperationsInput | number
    lastLedgerSequence?: IntFieldUpdateOperationsInput | number
  }

  export type SyncStateUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    lastLedgerSequence?: IntFieldUpdateOperationsInput | number
  }

  export type EventLogCreateInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    eventIndex?: number
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type EventLogUncheckedCreateInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    eventIndex?: number
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type EventLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    eventIndex?: IntFieldUpdateOperationsInput | number
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    eventIndex?: IntFieldUpdateOperationsInput | number
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventLogCreateManyInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    eventIndex?: number
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type EventLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    eventIndex?: IntFieldUpdateOperationsInput | number
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    eventIndex?: IntFieldUpdateOperationsInput | number
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamSnapshotCreateInput = {
    id?: string
    streamId: string
    sender: string
    receiver: string
    tokenAddress: string
    amountPerSecond: bigint | number
    totalAmount: bigint | number
    status: $Enums.StreamStatus
    snapshotMonth: string
    createdAt?: Date | string
  }

  export type StreamSnapshotUncheckedCreateInput = {
    id?: string
    streamId: string
    sender: string
    receiver: string
    tokenAddress: string
    amountPerSecond: bigint | number
    totalAmount: bigint | number
    status: $Enums.StreamStatus
    snapshotMonth: string
    createdAt?: Date | string
  }

  export type StreamSnapshotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: StringFieldUpdateOperationsInput | string
    amountPerSecond?: BigIntFieldUpdateOperationsInput | bigint | number
    totalAmount?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    snapshotMonth?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamSnapshotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: StringFieldUpdateOperationsInput | string
    amountPerSecond?: BigIntFieldUpdateOperationsInput | bigint | number
    totalAmount?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    snapshotMonth?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamSnapshotCreateManyInput = {
    id?: string
    streamId: string
    sender: string
    receiver: string
    tokenAddress: string
    amountPerSecond: bigint | number
    totalAmount: bigint | number
    status: $Enums.StreamStatus
    snapshotMonth: string
    createdAt?: Date | string
  }

  export type StreamSnapshotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: StringFieldUpdateOperationsInput | string
    amountPerSecond?: BigIntFieldUpdateOperationsInput | bigint | number
    totalAmount?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    snapshotMonth?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamSnapshotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    sender?: StringFieldUpdateOperationsInput | string
    receiver?: StringFieldUpdateOperationsInput | string
    tokenAddress?: StringFieldUpdateOperationsInput | string
    amountPerSecond?: BigIntFieldUpdateOperationsInput | bigint | number
    totalAmount?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: EnumStreamStatusFieldUpdateOperationsInput | $Enums.StreamStatus
    snapshotMonth?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamArchiveCreateInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt: Date | string
    archivedAt?: Date | string
  }

  export type StreamArchiveUncheckedCreateInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt: Date | string
    archivedAt?: Date | string
  }

  export type StreamArchiveUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    archivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamArchiveUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    archivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamArchiveCreateManyInput = {
    id?: string
    eventType: string
    streamId: string
    txHash: string
    ledger: number
    ledgerClosedAt: string
    sender?: string | null
    receiver?: string | null
    amount?: bigint | number | null
    metadata?: string | null
    createdAt: Date | string
    archivedAt?: Date | string
  }

  export type StreamArchiveUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    archivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StreamArchiveUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    streamId?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    ledger?: IntFieldUpdateOperationsInput | number
    ledgerClosedAt?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    receiver?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    archivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BridgeLogCreateInput = {
    id?: string
    bridge: string
    eventType: string
    sourceChain: string
    targetChain: string
    sourceAsset: string
    targetAsset?: string | null
    amount: string
    sender?: string | null
    recipient: string
    txHash: string
    status: string
    payload?: string | null
    landedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BridgeLogUncheckedCreateInput = {
    id?: string
    bridge: string
    eventType: string
    sourceChain: string
    targetChain: string
    sourceAsset: string
    targetAsset?: string | null
    amount: string
    sender?: string | null
    recipient: string
    txHash: string
    status: string
    payload?: string | null
    landedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BridgeLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bridge?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    sourceChain?: StringFieldUpdateOperationsInput | string
    targetChain?: StringFieldUpdateOperationsInput | string
    sourceAsset?: StringFieldUpdateOperationsInput | string
    targetAsset?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    recipient?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    payload?: NullableStringFieldUpdateOperationsInput | string | null
    landedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BridgeLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bridge?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    sourceChain?: StringFieldUpdateOperationsInput | string
    targetChain?: StringFieldUpdateOperationsInput | string
    sourceAsset?: StringFieldUpdateOperationsInput | string
    targetAsset?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    recipient?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    payload?: NullableStringFieldUpdateOperationsInput | string | null
    landedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BridgeLogCreateManyInput = {
    id?: string
    bridge: string
    eventType: string
    sourceChain: string
    targetChain: string
    sourceAsset: string
    targetAsset?: string | null
    amount: string
    sender?: string | null
    recipient: string
    txHash: string
    status: string
    payload?: string | null
    landedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BridgeLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bridge?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    sourceChain?: StringFieldUpdateOperationsInput | string
    targetChain?: StringFieldUpdateOperationsInput | string
    sourceAsset?: StringFieldUpdateOperationsInput | string
    targetAsset?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    recipient?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    payload?: NullableStringFieldUpdateOperationsInput | string | null
    landedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BridgeLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    bridge?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    sourceChain?: StringFieldUpdateOperationsInput | string
    targetChain?: StringFieldUpdateOperationsInput | string
    sourceAsset?: StringFieldUpdateOperationsInput | string
    targetAsset?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: StringFieldUpdateOperationsInput | string
    sender?: NullableStringFieldUpdateOperationsInput | string | null
    recipient?: StringFieldUpdateOperationsInput | string
    txHash?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    payload?: NullableStringFieldUpdateOperationsInput | string | null
    landedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProposalCreateInput = {
    id: string
    creator: string
    description: string
    quorum: number
    votesFor?: number
    votesAgainst?: number
    txHash: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProposalUncheckedCreateInput = {
    id: string
    creator: string
    description: string
    quorum: number
    votesFor?: number
    votesAgainst?: number
    txHash: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProposalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creator?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    quorum?: IntFieldUpdateOperationsInput | number
    votesFor?: IntFieldUpdateOperationsInput | number
    votesAgainst?: IntFieldUpdateOperationsInput | number
    txHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProposalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creator?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    quorum?: IntFieldUpdateOperationsInput | number
    votesFor?: IntFieldUpdateOperationsInput | number
    votesAgainst?: IntFieldUpdateOperationsInput | number
    txHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProposalCreateManyInput = {
    id: string
    creator: string
    description: string
    quorum: number
    votesFor?: number
    votesAgainst?: number
    txHash: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProposalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    creator?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    quorum?: IntFieldUpdateOperationsInput | number
    votesFor?: IntFieldUpdateOperationsInput | number
    votesAgainst?: IntFieldUpdateOperationsInput | number
    txHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProposalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    creator?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    quorum?: IntFieldUpdateOperationsInput | number
    votesFor?: IntFieldUpdateOperationsInput | number
    votesAgainst?: IntFieldUpdateOperationsInput | number
    txHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ApiKeyCreateInput = {
    id?: string
    keyHash: string
    name: string
    owner: string
    rateLimit?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    lastUsedAt?: Date | string | null
  }

  export type ApiKeyUncheckedCreateInput = {
    id?: string
    keyHash: string
    name: string
    owner: string
    rateLimit?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    lastUsedAt?: Date | string | null
  }

  export type ApiKeyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    rateLimit?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ApiKeyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    rateLimit?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ApiKeyCreateManyInput = {
    id?: string
    keyHash: string
    name: string
    owner: string
    rateLimit?: number
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    lastUsedAt?: Date | string | null
  }

  export type ApiKeyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    rateLimit?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ApiKeyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    rateLimit?: IntFieldUpdateOperationsInput | number
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type LedgerHashCreateInput = {
    sequence: number
    hash: string
    createdAt?: Date | string
  }

  export type LedgerHashUncheckedCreateInput = {
    sequence: number
    hash: string
    createdAt?: Date | string
  }

  export type LedgerHashUpdateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    hash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerHashUncheckedUpdateInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    hash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerHashCreateManyInput = {
    sequence: number
    hash: string
    createdAt?: Date | string
  }

  export type LedgerHashUpdateManyMutationInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    hash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LedgerHashUncheckedUpdateManyInput = {
    sequence?: IntFieldUpdateOperationsInput | number
    hash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSubscriptionCreateInput = {
    id?: string
    stellarAddress: string
    platform: $Enums.NotificationPlatform
    webhookUrl?: string | null
    chatId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSubscriptionUncheckedCreateInput = {
    id?: string
    stellarAddress: string
    platform: $Enums.NotificationPlatform
    webhookUrl?: string | null
    chatId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSubscriptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    stellarAddress?: StringFieldUpdateOperationsInput | string
    platform?: EnumNotificationPlatformFieldUpdateOperationsInput | $Enums.NotificationPlatform
    webhookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    chatId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSubscriptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    stellarAddress?: StringFieldUpdateOperationsInput | string
    platform?: EnumNotificationPlatformFieldUpdateOperationsInput | $Enums.NotificationPlatform
    webhookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    chatId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSubscriptionCreateManyInput = {
    id?: string
    stellarAddress: string
    platform: $Enums.NotificationPlatform
    webhookUrl?: string | null
    chatId?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSubscriptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    stellarAddress?: StringFieldUpdateOperationsInput | string
    platform?: EnumNotificationPlatformFieldUpdateOperationsInput | $Enums.NotificationPlatform
    webhookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    chatId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSubscriptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    stellarAddress?: StringFieldUpdateOperationsInput | string
    platform?: EnumNotificationPlatformFieldUpdateOperationsInput | $Enums.NotificationPlatform
    webhookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    chatId?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetConfigCreateInput = {
    id?: string
    assetId: string
    symbol: string
    name: string
    decimals?: number
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AssetConfigUncheckedCreateInput = {
    id?: string
    assetId: string
    symbol: string
    name: string
    decimals?: number
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AssetConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    assetId?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    isVisible?: BoolFieldUpdateOperationsInput | boolean
    yieldEnabled?: BoolFieldUpdateOperationsInput | boolean
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    assetId?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    isVisible?: BoolFieldUpdateOperationsInput | boolean
    yieldEnabled?: BoolFieldUpdateOperationsInput | boolean
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetConfigCreateManyInput = {
    id?: string
    assetId: string
    symbol: string
    name: string
    decimals?: number
    isVerified?: boolean
    isVisible?: boolean
    yieldEnabled?: boolean
    iconUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AssetConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    assetId?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    isVisible?: BoolFieldUpdateOperationsInput | boolean
    yieldEnabled?: BoolFieldUpdateOperationsInput | boolean
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AssetConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    assetId?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    decimals?: IntFieldUpdateOperationsInput | number
    isVerified?: BoolFieldUpdateOperationsInput | boolean
    isVisible?: BoolFieldUpdateOperationsInput | boolean
    yieldEnabled?: BoolFieldUpdateOperationsInput | boolean
    iconUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumStreamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StreamStatus | EnumStreamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStreamStatusFilter<$PrismaModel> | $Enums.StreamStatus
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type StreamCountOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amount?: SortOrder
    duration?: SortOrder
    status?: SortOrder
    withdrawn?: SortOrder
    legacy?: SortOrder
    migrated?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamAvgOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type StreamMaxOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amount?: SortOrder
    duration?: SortOrder
    status?: SortOrder
    withdrawn?: SortOrder
    legacy?: SortOrder
    migrated?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamMinOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amount?: SortOrder
    duration?: SortOrder
    status?: SortOrder
    withdrawn?: SortOrder
    legacy?: SortOrder
    migrated?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamSumOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumStreamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StreamStatus | EnumStreamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStreamStatusWithAggregatesFilter<$PrismaModel> | $Enums.StreamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStreamStatusFilter<$PrismaModel>
    _max?: NestedEnumStreamStatusFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TokenPriceCountOrderByAggregateInput = {
    tokenAddress?: SortOrder
    symbol?: SortOrder
    decimals?: SortOrder
    priceUsd?: SortOrder
    updatedAt?: SortOrder
  }

  export type TokenPriceAvgOrderByAggregateInput = {
    decimals?: SortOrder
    priceUsd?: SortOrder
  }

  export type TokenPriceMaxOrderByAggregateInput = {
    tokenAddress?: SortOrder
    symbol?: SortOrder
    decimals?: SortOrder
    priceUsd?: SortOrder
    updatedAt?: SortOrder
  }

  export type TokenPriceMinOrderByAggregateInput = {
    tokenAddress?: SortOrder
    symbol?: SortOrder
    decimals?: SortOrder
    priceUsd?: SortOrder
    updatedAt?: SortOrder
  }

  export type TokenPriceSumOrderByAggregateInput = {
    decimals?: SortOrder
    priceUsd?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type WebhookCountOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookMaxOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookMinOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SyncStateCountOrderByAggregateInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type SyncStateAvgOrderByAggregateInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type SyncStateMaxOrderByAggregateInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type SyncStateMinOrderByAggregateInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type SyncStateSumOrderByAggregateInput = {
    id?: SortOrder
    lastLedgerSequence?: SortOrder
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type EventLogTxHashEventIndexCompoundUniqueInput = {
    txHash: string
    eventIndex: number
  }

  export type EventLogCountOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    eventIndex?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type EventLogAvgOrderByAggregateInput = {
    eventIndex?: SortOrder
    ledger?: SortOrder
    amount?: SortOrder
  }

  export type EventLogMaxOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    eventIndex?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type EventLogMinOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    eventIndex?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type EventLogSumOrderByAggregateInput = {
    eventIndex?: SortOrder
    ledger?: SortOrder
    amount?: SortOrder
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type StreamSnapshotStreamIdSnapshotMonthCompoundUniqueInput = {
    streamId: string
    snapshotMonth: string
  }

  export type StreamSnapshotCountOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
    status?: SortOrder
    snapshotMonth?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamSnapshotAvgOrderByAggregateInput = {
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
  }

  export type StreamSnapshotMaxOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
    status?: SortOrder
    snapshotMonth?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamSnapshotMinOrderByAggregateInput = {
    id?: SortOrder
    streamId?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    tokenAddress?: SortOrder
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
    status?: SortOrder
    snapshotMonth?: SortOrder
    createdAt?: SortOrder
  }

  export type StreamSnapshotSumOrderByAggregateInput = {
    amountPerSecond?: SortOrder
    totalAmount?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type StreamArchiveCountOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    archivedAt?: SortOrder
  }

  export type StreamArchiveAvgOrderByAggregateInput = {
    ledger?: SortOrder
    amount?: SortOrder
  }

  export type StreamArchiveMaxOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    archivedAt?: SortOrder
  }

  export type StreamArchiveMinOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    streamId?: SortOrder
    txHash?: SortOrder
    ledger?: SortOrder
    ledgerClosedAt?: SortOrder
    sender?: SortOrder
    receiver?: SortOrder
    amount?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    archivedAt?: SortOrder
  }

  export type StreamArchiveSumOrderByAggregateInput = {
    ledger?: SortOrder
    amount?: SortOrder
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BridgeLogCountOrderByAggregateInput = {
    id?: SortOrder
    bridge?: SortOrder
    eventType?: SortOrder
    sourceChain?: SortOrder
    targetChain?: SortOrder
    sourceAsset?: SortOrder
    targetAsset?: SortOrder
    amount?: SortOrder
    sender?: SortOrder
    recipient?: SortOrder
    txHash?: SortOrder
    status?: SortOrder
    payload?: SortOrder
    landedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type BridgeLogMaxOrderByAggregateInput = {
    id?: SortOrder
    bridge?: SortOrder
    eventType?: SortOrder
    sourceChain?: SortOrder
    targetChain?: SortOrder
    sourceAsset?: SortOrder
    targetAsset?: SortOrder
    amount?: SortOrder
    sender?: SortOrder
    recipient?: SortOrder
    txHash?: SortOrder
    status?: SortOrder
    payload?: SortOrder
    landedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type BridgeLogMinOrderByAggregateInput = {
    id?: SortOrder
    bridge?: SortOrder
    eventType?: SortOrder
    sourceChain?: SortOrder
    targetChain?: SortOrder
    sourceAsset?: SortOrder
    targetAsset?: SortOrder
    amount?: SortOrder
    sender?: SortOrder
    recipient?: SortOrder
    txHash?: SortOrder
    status?: SortOrder
    payload?: SortOrder
    landedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ProposalCountOrderByAggregateInput = {
    id?: SortOrder
    creator?: SortOrder
    description?: SortOrder
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
    txHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProposalAvgOrderByAggregateInput = {
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
  }

  export type ProposalMaxOrderByAggregateInput = {
    id?: SortOrder
    creator?: SortOrder
    description?: SortOrder
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
    txHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProposalMinOrderByAggregateInput = {
    id?: SortOrder
    creator?: SortOrder
    description?: SortOrder
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
    txHash?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProposalSumOrderByAggregateInput = {
    quorum?: SortOrder
    votesFor?: SortOrder
    votesAgainst?: SortOrder
  }

  export type ApiKeyCountOrderByAggregateInput = {
    id?: SortOrder
    keyHash?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    rateLimit?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastUsedAt?: SortOrder
  }

  export type ApiKeyAvgOrderByAggregateInput = {
    rateLimit?: SortOrder
  }

  export type ApiKeyMaxOrderByAggregateInput = {
    id?: SortOrder
    keyHash?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    rateLimit?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastUsedAt?: SortOrder
  }

  export type ApiKeyMinOrderByAggregateInput = {
    id?: SortOrder
    keyHash?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    rateLimit?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastUsedAt?: SortOrder
  }

  export type ApiKeySumOrderByAggregateInput = {
    rateLimit?: SortOrder
  }

  export type LedgerHashCountOrderByAggregateInput = {
    sequence?: SortOrder
    hash?: SortOrder
    createdAt?: SortOrder
  }

  export type LedgerHashAvgOrderByAggregateInput = {
    sequence?: SortOrder
  }

  export type LedgerHashMaxOrderByAggregateInput = {
    sequence?: SortOrder
    hash?: SortOrder
    createdAt?: SortOrder
  }

  export type LedgerHashMinOrderByAggregateInput = {
    sequence?: SortOrder
    hash?: SortOrder
    createdAt?: SortOrder
  }

  export type LedgerHashSumOrderByAggregateInput = {
    sequence?: SortOrder
  }

  export type EnumNotificationPlatformFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationPlatform | EnumNotificationPlatformFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationPlatformFilter<$PrismaModel> | $Enums.NotificationPlatform
  }

  export type NotificationSubscriptionStellarAddressPlatformCompoundUniqueInput = {
    stellarAddress: string
    platform: $Enums.NotificationPlatform
  }

  export type NotificationSubscriptionCountOrderByAggregateInput = {
    id?: SortOrder
    stellarAddress?: SortOrder
    platform?: SortOrder
    webhookUrl?: SortOrder
    chatId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationSubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    stellarAddress?: SortOrder
    platform?: SortOrder
    webhookUrl?: SortOrder
    chatId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationSubscriptionMinOrderByAggregateInput = {
    id?: SortOrder
    stellarAddress?: SortOrder
    platform?: SortOrder
    webhookUrl?: SortOrder
    chatId?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumNotificationPlatformWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationPlatform | EnumNotificationPlatformFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationPlatformWithAggregatesFilter<$PrismaModel> | $Enums.NotificationPlatform
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationPlatformFilter<$PrismaModel>
    _max?: NestedEnumNotificationPlatformFilter<$PrismaModel>
  }

  export type AssetConfigCountOrderByAggregateInput = {
    id?: SortOrder
    assetId?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    decimals?: SortOrder
    isVerified?: SortOrder
    isVisible?: SortOrder
    yieldEnabled?: SortOrder
    iconUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AssetConfigAvgOrderByAggregateInput = {
    decimals?: SortOrder
  }

  export type AssetConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    assetId?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    decimals?: SortOrder
    isVerified?: SortOrder
    isVisible?: SortOrder
    yieldEnabled?: SortOrder
    iconUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AssetConfigMinOrderByAggregateInput = {
    id?: SortOrder
    assetId?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    decimals?: SortOrder
    isVerified?: SortOrder
    isVisible?: SortOrder
    yieldEnabled?: SortOrder
    iconUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AssetConfigSumOrderByAggregateInput = {
    decimals?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumStreamStatusFieldUpdateOperationsInput = {
    set?: $Enums.StreamStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EnumNotificationPlatformFieldUpdateOperationsInput = {
    set?: $Enums.NotificationPlatform
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumStreamStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.StreamStatus | EnumStreamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStreamStatusFilter<$PrismaModel> | $Enums.StreamStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumStreamStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StreamStatus | EnumStreamStatusFieldRefInput<$PrismaModel>
    in?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.StreamStatus[] | ListEnumStreamStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumStreamStatusWithAggregatesFilter<$PrismaModel> | $Enums.StreamStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStreamStatusFilter<$PrismaModel>
    _max?: NestedEnumStreamStatusFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumNotificationPlatformFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationPlatform | EnumNotificationPlatformFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationPlatformFilter<$PrismaModel> | $Enums.NotificationPlatform
  }

  export type NestedEnumNotificationPlatformWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationPlatform | EnumNotificationPlatformFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationPlatform[] | ListEnumNotificationPlatformFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationPlatformWithAggregatesFilter<$PrismaModel> | $Enums.NotificationPlatform
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationPlatformFilter<$PrismaModel>
    _max?: NestedEnumNotificationPlatformFilter<$PrismaModel>
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use StreamDefaultArgs instead
     */
    export type StreamArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StreamDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TokenPriceDefaultArgs instead
     */
    export type TokenPriceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TokenPriceDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WebhookDefaultArgs instead
     */
    export type WebhookArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WebhookDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SyncStateDefaultArgs instead
     */
    export type SyncStateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SyncStateDefaultArgs<ExtArgs>
    /**
     * @deprecated Use EventLogDefaultArgs instead
     */
    export type EventLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = EventLogDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StreamSnapshotDefaultArgs instead
     */
    export type StreamSnapshotArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StreamSnapshotDefaultArgs<ExtArgs>
    /**
     * @deprecated Use StreamArchiveDefaultArgs instead
     */
    export type StreamArchiveArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = StreamArchiveDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BridgeLogDefaultArgs instead
     */
    export type BridgeLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BridgeLogDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ProposalDefaultArgs instead
     */
    export type ProposalArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ProposalDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ApiKeyDefaultArgs instead
     */
    export type ApiKeyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ApiKeyDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LedgerHashDefaultArgs instead
     */
    export type LedgerHashArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LedgerHashDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationSubscriptionDefaultArgs instead
     */
    export type NotificationSubscriptionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationSubscriptionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AssetConfigDefaultArgs instead
     */
    export type AssetConfigArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AssetConfigDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}