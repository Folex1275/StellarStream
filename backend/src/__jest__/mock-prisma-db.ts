import type { StreamStatus } from "../generated/client/index.js";

export type MockStreamRow = {
  id: string;
  streamId: string | null;
  txHash: string;
  sender: string;
  receiver: string;
  tokenAddress: string | null;
  amount: string;
  duration: number | null;
  status: StreamStatus | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELED";
  withdrawn: string | null;
  legacy: boolean;
  migrated: boolean;
  isPrivate: boolean;
};

export type MockWebhookRow = {
  id: string;
  url: string;
  description: string | null;
  isActive: boolean;
};

export type MockEventLogRow = {
  id: string;
  eventType: string;
  streamId: string;
  txHash: string;
  eventIndex: number;
  ledger: number;
  ledgerClosedAt: string;
  sender: string | null;
  receiver: string | null;
  amount: bigint | null;
  metadata: string | null;
  parentHash: string | null;
  entryHash: string | null;
  createdAt: Date;
};

type LedgerHashRow = { sequence: number; hash: string };

/**
 * A dedicated, isolated in-memory "test database".
 *
 * We use this because the repository's current Jest setup mocks Prisma for
 * event parsing tests; this extends that approach to cover ingestion and
 * webhook triggering logic without requiring a running Postgres instance.
 */
export const mockDb = {
  streams: [] as MockStreamRow[],
  webhooks: [] as MockWebhookRow[],
  eventLogs: [] as MockEventLogRow[],
  ledgerHashes: [] as LedgerHashRow[],
  attemptedStreamCreates: 0,
  _idSeq: 1,

  reset(): void {
    this.streams = [];
    this.webhooks = [];
    this.eventLogs = [];
    this.ledgerHashes = [];
    this.attemptedStreamCreates = 0;
    this._idSeq = 1;
  },

  seedWebhook(input: { url: string; isActive?: boolean; description?: string }): void {
    this.webhooks.push({
      id: `wh_${this._idSeq++}`,
      url: input.url,
      isActive: input.isActive ?? true,
      description: input.description ?? null,
    });
  },
};

function createId(prefix: string): string {
  const next = mockDb._idSeq++;
  return `${prefix}_${next}`;
}

export function createMockPrismaClient() {
  return {
    stream: {
      create: jest.fn(async (arg: { data: any }) => {
        mockDb.attemptedStreamCreates++;
        const data = arg.data as Partial<MockStreamRow>;
        const txHash = String(data.txHash ?? "");
        if (!txHash) throw new Error("stream.create: txHash is required");

        if (mockDb.streams.some((s) => s.txHash === txHash)) {
          // Mimic Prisma unique constraint on txHash.
          throw new Error(`Unique constraint failed on txHash=${txHash}`);
        }

        const row: MockStreamRow = {
          id: createId("stream"),
          streamId: data.streamId ?? null,
          txHash,
          sender: String(data.sender ?? ""),
          receiver: String(data.receiver ?? ""),
          tokenAddress: data.tokenAddress ?? null,
          amount: String(data.amount ?? "0"),
          duration: data.duration ?? null,
          status: (data.status as any) ?? "ACTIVE",
          withdrawn: data.withdrawn ?? "0",
          legacy: Boolean(data.legacy ?? false),
          migrated: Boolean(data.migrated ?? false),
          isPrivate: Boolean(data.isPrivate ?? false),
        };

        mockDb.streams.push(row);
        return row;
      }),

      findMany: jest.fn(async (arg: { where?: any; orderBy?: any }) => {
        const where = arg.where ?? {};
        let rows = [...mockDb.streams];

        if (where.OR && Array.isArray(where.OR)) {
          rows = rows.filter((row) =>
            where.OR.some((clause: any) => {
              if (typeof clause?.sender === "string") return row.sender === clause.sender;
              if (typeof clause?.receiver === "string") return row.receiver === clause.receiver;
              return false;
            }),
          );
        }

        if (where.status) {
          rows = rows.filter((row) => row.status === where.status);
        }

        if (where.tokenAddress?.in && Array.isArray(where.tokenAddress.in)) {
          const allowed = new Set(where.tokenAddress.in.map(String));
          rows = rows.filter((row) => row.tokenAddress != null && allowed.has(row.tokenAddress));
        }

        // Best-effort orderBy { id: "desc" } support.
        if (arg.orderBy?.id === "desc") {
          rows.sort((a, b) => (b.id > a.id ? 1 : -1));
        }

        return rows;
      }),
    },

    webhook: {
      findMany: jest.fn(async (arg: { where?: any }) => {
        const where = arg.where ?? {};
        const isActive = where.isActive;
        return mockDb.webhooks.filter((w) =>
          typeof isActive === "boolean" ? w.isActive === isActive : true,
        );
      }),
    },

    eventLog: {
      upsert: jest.fn(async (arg: any) => {
        const eventIndex: number = arg.where?.txHash_eventIndex?.eventIndex ?? 0;
        const txHash: string = String(arg.where?.txHash_eventIndex?.txHash ?? "");

        const existing = mockDb.eventLogs.find((e) => e.txHash === txHash && e.eventIndex === eventIndex);
        const incoming = arg.create as Partial<MockEventLogRow>;

        if (existing) {
          existing.eventType = String(incoming.eventType ?? existing.eventType);
          existing.streamId = String(incoming.streamId ?? existing.streamId);
          existing.ledger = Number(incoming.ledger ?? existing.ledger);
          existing.ledgerClosedAt = String(incoming.ledgerClosedAt ?? existing.ledgerClosedAt);
          existing.sender = incoming.sender ?? null;
          existing.receiver = incoming.receiver ?? null;
          existing.amount = (incoming.amount ?? null) as any;
          existing.metadata = incoming.metadata ?? null;
          existing.parentHash = incoming.parentHash ?? null;
          existing.entryHash = incoming.entryHash ?? null;
          return existing;
        }

        const row: MockEventLogRow = {
          id: createId("event"),
          eventType: String(incoming.eventType ?? ""),
          streamId: String(incoming.streamId ?? ""),
          txHash,
          eventIndex,
          ledger: Number(incoming.ledger ?? 0),
          ledgerClosedAt: String(incoming.ledgerClosedAt ?? ""),
          sender: incoming.sender ?? null,
          receiver: incoming.receiver ?? null,
          amount: (incoming.amount ?? null) as any,
          metadata: incoming.metadata ?? null,
          parentHash: incoming.parentHash ?? null,
          entryHash: incoming.entryHash ?? null,
          createdAt: incoming.createdAt ?? new Date(),
        };
        mockDb.eventLogs.push(row);
        return row;
      }),

      findFirst: jest.fn(async (arg: any) => {
        const rows = [...mockDb.eventLogs];
        if (arg?.orderBy?.createdAt === "desc") {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (arg?.orderBy?.createdAt === "asc") {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        const first = rows[0];
        if (!first) return null;

        if (arg?.select) {
          return Object.fromEntries(
            Object.entries(arg.select)
              .filter(([, value]) => value)
              .map(([key]) => [key, (first as Record<string, unknown>)[key]]),
          );
        }

        return first;
      }),

      findMany: jest.fn(async (_arg: any) => {
        return mockDb.eventLogs;
      }),
    },

    ledgerHash: {
      upsert: jest.fn(async (arg: any) => {
        const sequence = Number(arg.where?.sequence ?? arg.create?.sequence ?? 0);
        const hash = String(arg.update?.hash ?? arg.create?.hash ?? "");
        const existing = mockDb.ledgerHashes.find((h) => h.sequence === sequence);
        if (existing) {
          existing.hash = hash;
          return existing;
        }
        const row: LedgerHashRow = { sequence, hash };
        mockDb.ledgerHashes.push(row);
        return row;
      }),

      findMany: jest.fn(async (_arg: any) => {
        return mockDb.ledgerHashes.map((h) => ({ sequence: h.sequence, hash: h.hash }));
      }),
    },
  };
}

/**
 * A smaller prisma surface used by API routes (via `src/lib/db`).
 */
export function createMockLibPrisma() {
  return {
    stream: {
      findMany: jest.fn(async (arg: any) => {
        const where = arg.where ?? {};
        let rows = [...mockDb.streams];

        if (where.OR && Array.isArray(where.OR)) {
          rows = rows.filter((row) =>
            where.OR.some((clause: any) => {
              if (typeof clause?.sender === "string") return row.sender === clause.sender;
              if (typeof clause?.receiver === "string") return row.receiver === clause.receiver;
              return false;
            }),
          );
        }

        if (where.status) {
          rows = rows.filter((row) => row.status === where.status);
        }

        if (where.tokenAddress?.in && Array.isArray(where.tokenAddress.in)) {
          const allowed = new Set(where.tokenAddress.in.map(String));
          rows = rows.filter((row) => row.tokenAddress != null && allowed.has(row.tokenAddress));
        }

        if (arg.orderBy?.id === "desc") {
          rows.sort((a, b) => (b.id > a.id ? 1 : -1));
        }

        return rows;
      }),
    },
    eventLog: {
      upsert: jest.fn(async (arg: any) => {
        const eventIndex: number = arg.where?.txHash_eventIndex?.eventIndex ?? 0;
        const txHash: string = String(arg.where?.txHash_eventIndex?.txHash ?? "");
        const existing = mockDb.eventLogs.find((event) => event.txHash === txHash && event.eventIndex === eventIndex);
        const incoming = (existing ? arg.update : arg.create) as Partial<MockEventLogRow>;

        if (existing) {
          existing.eventType = String(incoming.eventType ?? existing.eventType);
          existing.streamId = String(incoming.streamId ?? existing.streamId);
          existing.ledger = Number(incoming.ledger ?? existing.ledger);
          existing.ledgerClosedAt = String(incoming.ledgerClosedAt ?? existing.ledgerClosedAt);
          existing.sender = incoming.sender ?? null;
          existing.receiver = incoming.receiver ?? null;
          existing.amount = (incoming.amount ?? null) as any;
          existing.metadata = incoming.metadata ?? null;
          existing.parentHash = incoming.parentHash ?? null;
          existing.entryHash = incoming.entryHash ?? null;
          return existing;
        }

        const row: MockEventLogRow = {
          id: createId("event"),
          eventType: String(incoming.eventType ?? ""),
          streamId: String(incoming.streamId ?? ""),
          txHash,
          eventIndex,
          ledger: Number(incoming.ledger ?? 0),
          ledgerClosedAt: String(incoming.ledgerClosedAt ?? ""),
          sender: incoming.sender ?? null,
          receiver: incoming.receiver ?? null,
          amount: (incoming.amount ?? null) as any,
          metadata: incoming.metadata ?? null,
          parentHash: incoming.parentHash ?? null,
          entryHash: incoming.entryHash ?? null,
          createdAt: incoming.createdAt ?? new Date(),
        };

        mockDb.eventLogs.push(row);
        return row;
      }),
      findFirst: jest.fn(async (arg: any) => {
        const rows = [...mockDb.eventLogs];
        if (arg?.orderBy?.createdAt === "desc") {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (arg?.orderBy?.createdAt === "asc") {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        const first = rows[0];
        if (!first) return null;

        if (arg?.select) {
          return Object.fromEntries(
            Object.entries(arg.select)
              .filter(([, value]) => value)
              .map(([key]) => [key, (first as Record<string, unknown>)[key]]),
          );
        }

        return first;
      }),
      findMany: jest.fn(async (arg: any) => {
        let rows = [...mockDb.eventLogs];

        if (arg?.where?.streamId) {
          rows = rows.filter((row) => row.streamId === arg.where.streamId);
        }

        if (arg?.orderBy?.createdAt === "desc") {
          rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (arg?.orderBy?.createdAt === "asc") {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        if (typeof arg?.take === "number") {
          rows = rows.slice(0, arg.take);
        }

        return rows;
      }),
    },
  };
}
