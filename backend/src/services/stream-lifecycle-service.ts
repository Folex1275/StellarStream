import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type IndexedStreamStatus = "ACTIVE" | "CANCELED" | "COMPLETED" | "PAUSED";

export interface LeaderboardEntry {
  address: string;
  totalVolume: string; // string to preserve BigInt precision
}

interface StreamLifecycleRecord {
  stream_id: string;
  tx_hash_created: string;
  sender: string;
  receiver: string;
  original_total_amount: string;
  streamed_amount: string;
  status: IndexedStreamStatus;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  last_ledger: number;
}

interface StreamLifecycleDatabase {
  streams: Partial<Record<string, StreamLifecycleRecord>>;
}

interface CreateStreamInput {
  streamId: string;
  txHash: string;
  sender: string;
  receiver: string;
  totalAmount: bigint;
  createdAtIso: string;
  ledger: number;
}

interface WithdrawalInput {
  streamId: string;
  amount: bigint;
  ledger: number;
}

interface CancelInput {
  streamId: string;
  toReceiver: bigint;
  toSender: bigint;
  closedAtIso: string;
  ledger: number;
}

interface CancellationSummary {
  streamId: string;
  originalTotalAmount: bigint;
  finalStreamedAmount: bigint;
  remainingUnstreamedAmount: bigint;
  closedAtIso: string;
}

const DEFAULT_DB_RELATIVE_PATH = path.join("data", "stream-lifecycle-db.json");

export class StreamLifecycleService {
  private readonly dbPath: string;

  constructor(dbPath: string = path.join(process.cwd(), DEFAULT_DB_RELATIVE_PATH)) {
    this.dbPath = dbPath;
  }

  async upsertCreatedStream(input: CreateStreamInput): Promise<void> {
    const db = await this.loadDb();
    const existing = db.streams[input.streamId];
    const nowIso = new Date().toISOString();

    db.streams[input.streamId] = {
      stream_id: input.streamId,
      tx_hash_created: input.txHash,
      sender: input.sender,
      receiver: input.receiver,
      original_total_amount: input.totalAmount.toString(),
      streamed_amount: existing?.streamed_amount ?? "0",
      status: existing?.status === "CANCELED" ? existing.status : "ACTIVE",
      created_at: existing?.created_at ?? input.createdAtIso,
      closed_at: existing?.closed_at ?? null,
      updated_at: nowIso,
      last_ledger: input.ledger,
    };

    await this.saveDb(db);
  }

  async registerWithdrawal(input: WithdrawalInput): Promise<void> {
    const db = await this.loadDb();
    const existing = db.streams[input.streamId];
    if (!existing) {
      return;
    }

    const streamedAmount = this.toBigInt(existing.streamed_amount) + input.amount;
    existing.streamed_amount = streamedAmount.toString();
    existing.updated_at = new Date().toISOString();
    existing.last_ledger = input.ledger;

    await this.saveDb(db);
  }

  async cancelStream(input: CancelInput): Promise<CancellationSummary> {
    const db = await this.loadDb();
    const existing = db.streams[input.streamId];
    const nowIso = new Date().toISOString();

    const inferredOriginalTotal = input.toReceiver + input.toSender;
    const originalTotalAmount = existing
      ? this.toBigInt(existing.original_total_amount)
      : inferredOriginalTotal;

    const finalStreamedAmount = originalTotalAmount - input.toSender;
    const record: StreamLifecycleRecord = {
      stream_id: input.streamId,
      tx_hash_created: existing?.tx_hash_created ?? "unknown",
      sender: existing?.sender ?? "unknown",
      receiver: existing?.receiver ?? "unknown",
      original_total_amount: originalTotalAmount.toString(),
      streamed_amount: finalStreamedAmount.toString(),
      status: "CANCELED",
      created_at: existing?.created_at ?? input.closedAtIso,
      closed_at: input.closedAtIso,
      updated_at: nowIso,
      last_ledger: input.ledger,
    };

    db.streams[input.streamId] = record;
    await this.saveDb(db);

    return {
      streamId: input.streamId,
      originalTotalAmount,
      finalStreamedAmount,
      remainingUnstreamedAmount: input.toSender,
      closedAtIso: input.closedAtIso,
    };
  }

  private async loadDb(): Promise<StreamLifecycleDatabase> {
    try {
      const raw = await readFile(this.dbPath, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("streams" in parsed) ||
        typeof (parsed as { streams?: unknown }).streams !== "object" ||
        (parsed as { streams?: unknown }).streams === null
      ) {
        return { streams: {} };
      }
      return {
        streams: (parsed as { streams: Partial<Record<string, StreamLifecycleRecord>> }).streams,
      };
    } catch {
      return { streams: {} };
    }
  }

  async getLeaderboard(limit = 10): Promise<{
    topStreamers: LeaderboardEntry[];
    topReceivers: LeaderboardEntry[];
  }> {
    const db = await this.loadDb();
    const streams = Object.values(db.streams).filter(
      (s): s is StreamLifecycleRecord => s !== undefined
    );

    const senderVolume = new Map<string, bigint>();
    const receiverVolume = new Map<string, bigint>();

    for (const stream of streams) {
      if (stream.sender && stream.sender !== "unknown") {
        const prev = senderVolume.get(stream.sender) ?? 0n;
        senderVolume.set(stream.sender, prev + this.toBigInt(stream.original_total_amount));
      }
      if (stream.receiver && stream.receiver !== "unknown") {
        const prev = receiverVolume.get(stream.receiver) ?? 0n;
        receiverVolume.set(stream.receiver, prev + this.toBigInt(stream.original_total_amount));
      }
    }

    const toSortedEntries = (map: Map<string, bigint>): LeaderboardEntry[] =>
      [...map.entries()]
        .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
        .slice(0, limit)
        .map(([address, totalVolume]) => ({ address, totalVolume: totalVolume.toString() }));

    return {
      topStreamers: toSortedEntries(senderVolume),
      topReceivers: toSortedEntries(receiverVolume),
    };
  }

  private async saveDb(db: StreamLifecycleDatabase): Promise<void> {
    const dir = path.dirname(this.dbPath);
    await mkdir(dir, { recursive: true });
    await writeFile(this.dbPath, JSON.stringify(db, null, 2), "utf-8");
  }

  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
}

export function toBigIntOrNull(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function toObjectOrNull(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
