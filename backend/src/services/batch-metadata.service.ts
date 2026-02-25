import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Metadata returned for a single stream in a batch query.
 */
export interface StreamMetadataResult {
  stream_id: string;
  status: string;
  sender: string;
  receiver: string;
  original_total_amount: string;
  streamed_amount: string;
  created_at: string;
  closed_at: string | null;
}

/**
 * Error entry for a stream that could not be found or processed.
 */
export interface StreamMetadataError {
  stream_id: string;
  error: string;
}

/**
 * Combined batch response.
 */
export interface BatchMetadataResponse {
  results: StreamMetadataResult[];
  errors: StreamMetadataError[];
}

interface StreamLifecycleRecord {
  stream_id: string;
  tx_hash_created: string;
  sender: string;
  receiver: string;
  original_total_amount: string;
  streamed_amount: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  last_ledger: number;
}

interface StreamLifecycleDatabase {
  streams: Partial<Record<string, StreamLifecycleRecord>>;
}

const DEFAULT_DB_RELATIVE_PATH = path.join("data", "stream-lifecycle-db.json");

/**
 * Service for retrieving stream metadata in bulk.
 *
 * Reads from the same JSON-file database used by StreamLifecycleService,
 * loading the file once per batch call to avoid repeated I/O.
 */
export class BatchMetadataService {
  private readonly dbPath: string;

  constructor(
    dbPath: string = path.join(process.cwd(), DEFAULT_DB_RELATIVE_PATH),
  ) {
    this.dbPath = dbPath;
  }

  /**
   * Look up metadata for an array of stream IDs.
   *
   * Loads the JSON DB once, then maps each requested ID to either
   * a result or an error entry. This keeps I/O constant regardless
   * of batch size.
   */
  async getStreamMetadataBatch(
    streamIds: string[],
  ): Promise<BatchMetadataResponse> {
    const db = await this.loadDb();

    const results: StreamMetadataResult[] = [];
    const errors: StreamMetadataError[] = [];

    for (const id of streamIds) {
      const record = db.streams[id];

      if (record) {
        results.push({
          stream_id: record.stream_id,
          status: record.status,
          sender: record.sender,
          receiver: record.receiver,
          original_total_amount: record.original_total_amount,
          streamed_amount: record.streamed_amount,
          created_at: record.created_at,
          closed_at: record.closed_at,
        });
      } else {
        errors.push({
          stream_id: id,
          error: "Stream not found",
        });
      }
    }

    return { results, errors };
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
        streams: (
          parsed as {
            streams: Partial<Record<string, StreamLifecycleRecord>>;
          }
        ).streams,
      };
    } catch {
      return { streams: {} };
    }
  }
}
