import { SorobanRpc, scValToNative } from "@stellar/stellar-sdk";
import { config } from "./config";
import { isMegaStream, stroopsToXlm } from "./filter";
import { notifyMegaStream, MegaStreamEvent } from "./discord";

const rpc = new SorobanRpc.Server(config.sorobanRpcUrl);

// Tracks the latest ledger sequence we've already processed
let lastProcessedLedger = 0;

/**
 * Fetches contract events from the Soroban RPC for the "create" topic,
 * filters for Mega Streams, and fires Discord notifications.
 */
export async function pollForMegaStreams(): Promise<void> {
  try {
    const latestLedger = await rpc.getLatestLedger();
    const currentLedger = latestLedger.sequence;

    if (lastProcessedLedger === 0) {
      // On first run, start from the current ledger to avoid replaying history
      lastProcessedLedger = currentLedger - 1;
      console.log(`[Indexer] Starting from ledger ${lastProcessedLedger}`);
      return;
    }

    if (currentLedger <= lastProcessedLedger) return;

    const startLedger = lastProcessedLedger + 1;

    const response = await rpc.getEvents({
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [config.contractAddress],
          topics: [
            // Matches the (symbol_short!("create"), sender) topic pair
            ["*", "*"],
          ],
        },
      ],
      limit: 100,
    });

    for (const event of response.events) {
      await handleEvent(event);
    }

    lastProcessedLedger = currentLedger;
  } catch (err) {
    console.error("[Indexer] Poll error:", err);
  }
}

async function handleEvent(event: SorobanRpc.Api.EventResponse): Promise<void> {
  try {
    // The first topic is the event name symbol
    const topicVal = event.topic[0];
    if (!topicVal) return;

    const topicNative = scValToNative(topicVal);
    if (topicNative !== "create") return;

    // event.value holds the StreamCreatedEvent struct as an ScVal map
    const eventData = scValToNative(event.value) as Record<string, unknown>;

    const totalAmount = BigInt(String(eventData["total_amount"] ?? "0"));

    if (!isMegaStream(totalAmount)) return;

    const megaEvent: MegaStreamEvent = {
      streamId: String(eventData["stream_id"] ?? "unknown"),
      sender: String(eventData["sender"] ?? ""),
      receiver: String(eventData["receiver"] ?? ""),
      token: String(eventData["token"] ?? ""),
      totalAmount,
      totalAmountXlm: stroopsToXlm(totalAmount),
      startTime: Number(eventData["start_time"] ?? 0),
      endTime: Number(eventData["end_time"] ?? 0),
      txHash: event.txHash,
    };

    await notifyMegaStream(megaEvent);
  } catch (err) {
    console.error("[Indexer] Failed to process event:", err);
  }
}
