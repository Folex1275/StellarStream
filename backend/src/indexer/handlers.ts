import { withTransaction } from './db';

type StreamWithdrawnEvent = {
  // possible shapes supported
  stream_id?: string | number;
  streamId?: string | number;
  amount_withdrawn?: string | number;
  amountWithdrawn?: string | number;
  args?: Record<string, any>;
};

function extractStreamId(ev: StreamWithdrawnEvent): string {
  if (ev.stream_id != null) return String(ev.stream_id);
  if (ev.streamId != null) return String(ev.streamId);
  if (ev.args && ev.args.stream_id != null) return String(ev.args.stream_id);
  if (ev.args && ev.args.streamId != null) return String(ev.args.streamId);
  throw new Error('stream_id not found on StreamWithdrawn event');
}

function extractAmount(ev: StreamWithdrawnEvent): string {
  if (ev.amount_withdrawn != null) return String(ev.amount_withdrawn);
  if (ev.amountWithdrawn != null) return String(ev.amountWithdrawn);
  if (ev.args && ev.args.amount_withdrawn != null) return String(ev.args.amount_withdrawn);
  if (ev.args && ev.args.amountWithdrawn != null) return String(ev.args.amountWithdrawn);
  throw new Error('amount_withdrawn not found on StreamWithdrawn event');
}

/**
 * Handle a StreamWithdrawn event from the contract.
 * Parses stream id and amount, and increments the `withdrawn` column transactionally.
 */
export async function handleStreamWithdrawn(event: StreamWithdrawnEvent): Promise<void> {
  const streamId = extractStreamId(event);
  const amountStr = extractAmount(event);

  // Normalize amount to integer string (assumes smallest unit, e.g., wei-like)
  // Accepts numeric string or number. Use BigInt for safety.
  let amountBI: bigint;
  try {
    amountBI = BigInt(amountStr);
  } catch (err) {
    throw new Error(`Invalid amount_withdrawn value: ${String(amountStr)}`);
  }

  await withTransaction(async (client) => {
    const sel = await client.query('SELECT withdrawn FROM streams WHERE id = $1 FOR UPDATE', [streamId]);
    if (sel.rowCount === 0) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    const existing = sel.rows[0].withdrawn ?? '0';
    // existing may be number, string, or bigint coming from DB driver; convert to string first
    const existingStr = typeof existing === 'bigint' ? existing.toString() : String(existing);
    let existingBI: bigint;
    try {
      existingBI = BigInt(existingStr);
    } catch (err) {
      throw new Error(`Invalid withdrawn value in DB for stream ${streamId}: ${existingStr}`);
    }

    const newWithdrawnBI = existingBI + amountBI;
    // Store as string to avoid precision issues; Postgres numeric/text accepts it.
    const newWithdrawnStr = newWithdrawnBI.toString();

    await client.query('UPDATE streams SET withdrawn = $1 WHERE id = $2', [newWithdrawnStr, streamId]);
  });
}
