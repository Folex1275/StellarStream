/**
 * Event parsing and transformation utilities
 */

import { SorobanRpc, xdr } from "@stellar/stellar-sdk";
import { ParsedContractEvent } from "./types";
import { logger } from "./logger";

/**
 * Parse raw Stellar event into structured format
 */
export function parseContractEvent(
  event: SorobanRpc.Api.EventResponse
): ParsedContractEvent | null {
  try {
    return {
      id: event.id,
      type: event.type,
      ledger: event.ledger,
      ledgerClosedAt: event.ledgerClosedAt,
      contractId: event.contractId?.toString() ?? "unknown",
      topics: event.topic.map((topic) => topic.toXDR("base64")),
      value: parseScVal(event.value),
      txHash: event.id ?? "unknown",
      inSuccessfulContractCall: event.inSuccessfulContractCall,
    };
  } catch (error) {
    logger.error("Failed to parse contract event", error, { eventId: event.id });
    return null;
  }
}

/**
 * Parse Soroban ScVal to JavaScript value
 */
function parseScVal(scVal: xdr.ScVal): unknown {
  try {
    const type = scVal.switch();

    switch (type.name) {
      case "scvBool":
        return scVal.b();

      case "scvVoid":
      case "scvLedgerKeyContractInstance":
        return null;

      case "scvU32":
        return scVal.u32();

      case "scvI32":
        return scVal.i32();

      case "scvU64":
        return scVal.u64().toString();

      case "scvI64":
        return scVal.i64().toString();

      case "scvU128": {
        const parts = scVal.u128();
        return (BigInt(parts.hi().toString()) << 64n) | BigInt(parts.lo().toString());
      }

      case "scvI128": {
        const parts = scVal.i128();
        return (BigInt(parts.hi().toString()) << 64n) | BigInt(parts.lo().toString());
      }

      case "scvU256":
      case "scvI256":
        return scVal.toXDR("base64");

      case "scvBytes":
        return Buffer.from(scVal.bytes()).toString("hex");

      case "scvString":
        return scVal.str().toString();

      case "scvSymbol":
        return scVal.sym().toString();

      case "scvVec": {
        const vec = scVal.vec();
        return vec ? vec.map((item) => parseScVal(item)) : [];
      }

      case "scvMap": {
        const map = scVal.map();
        if (!map) return {};
        const result: Record<string, unknown> = {};
        map.forEach((entry) => {
          const key = parseScVal(entry.key());
          const val = parseScVal(entry.val());
          result[String(key)] = val;
        });
        return result;
      }

      case "scvAddress":
        return (scVal.address() as unknown as { toString: () => string }).toString();

      case "scvContractInstance":
        return "ContractInstance";

      default:
        return scVal.toXDR("base64");
    }
  } catch (error) {
    logger.warn("Failed to parse ScVal, returning raw XDR", { error });
    return scVal.toXDR("base64");
  }
}

/**
 * Extract event type from topics (first topic is usually the event name)
 */
export function extractEventType(topics: string[]): string {
  if (topics.length === 0) return "unknown";

  try {
    const firstTopic = xdr.ScVal.fromXDR(topics[0], "base64");
    const parsed = parseScVal(firstTopic);
    return String(parsed);
  } catch {
    return "unknown";
  }
}
