/**
 * Frontend replica of the backend hash-chain logic.
 * Uses the Web Crypto API for SHA-256 so verification can happen
 * entirely in the browser (no server round-trip required).
 */

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

export interface AuditLogEntry extends AuditHashInput {
    id: string;
    parentHash: string | null;
    entryHash: string | null;
    createdAt: string;
}

export interface LinkVerificationResult {
    entry: AuditLogEntry;
    position: number;
    expectedHash: string;
    isValid: boolean;
}

export interface ChainVerificationResult {
    links: LinkVerificationResult[];
    totalEntries: number;
    verifiedCount: number;
    brokenCount: number;
    isIntact: boolean;
    verifiedAt: string;
}

/**
 * Canonicalise an AuditHashInput into a deterministic JSON string.
 * Key order **must** match the backend exactly.
 */
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

/**
 * Compute the SHA-256 hex digest of canonical(input) + parentHash.
 */
export async function computeEntryHash(
    input: AuditHashInput,
    parentHash: string | null
): Promise<string> {
    const canonical = canonicalize(input);
    const payload = canonical + (parentHash ?? "");
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Verify the integrity of a sequence of audit-log entries.
 * Entries are expected in **chronological** order (oldest first).
 */
export async function verifyAuditChain(
    entries: AuditLogEntry[]
): Promise<ChainVerificationResult> {
    const links: LinkVerificationResult[] = [];
    let previousHash: string | null = null;
    let verifiedCount = 0;
    let brokenCount = 0;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        // Skip entries that have no stored hash (legacy / pre-chain rows)
        if (!entry.entryHash) {
            links.push({
                entry,
                position: i,
                expectedHash: "",
                isValid: true, // neutral — nothing to verify
            });
            continue;
        }

        const input: AuditHashInput = {
            eventType: entry.eventType,
            streamId: entry.streamId,
            txHash: entry.txHash,
            eventIndex: entry.eventIndex,
            ledger: entry.ledger,
            ledgerClosedAt: entry.ledgerClosedAt,
            sender: entry.sender,
            receiver: entry.receiver,
            amount: entry.amount,
            metadata: entry.metadata,
        };

        const expectedHash = await computeEntryHash(input, previousHash);
        const isValid = expectedHash === entry.entryHash;

        if (isValid) {
            verifiedCount++;
        } else {
            brokenCount++;
        }

        links.push({
            entry,
            position: i,
            expectedHash,
            isValid,
        });

        previousHash = entry.entryHash;
    }

    return {
        links,
        totalEntries: entries.length,
        verifiedCount,
        brokenCount,
        isIntact: brokenCount === 0,
        verifiedAt: new Date().toISOString(),
    };
}

