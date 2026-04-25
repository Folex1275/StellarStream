import { createHash } from "crypto";

export interface AuditHashInput {
  eventType: string;
  streamId: string;
  txHash: string;
  eventIndex: number;
  ledger: number;
  ledgerClosedAt: string;
  sender: string | null;
  receiver: string | null;
  amount: string | null;
  metadata: string | null;
}

function canonicalize(input: AuditHashInput): string {
  return JSON.stringify({
    amount: input.amount,
    eventIndex: input.eventIndex,
    eventType: input.eventType,
    ledger: input.ledger,
    ledgerClosedAt: input.ledgerClosedAt,
    metadata: input.metadata,
    receiver: input.receiver,
    sender: input.sender,
    streamId: input.streamId,
    txHash: input.txHash,
  });
}

export function computeEntryHash(input: AuditHashInput, parentHash: string | null): string {
  const canonical = canonicalize(input);
  const payload = canonical + (parentHash ?? "");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
