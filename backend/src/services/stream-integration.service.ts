import { PrismaClient } from "../generated/client/index.js";
import { WebhookDispatcherService } from "./webhook-dispatcher.service.js";
import { DustFilterService } from "./dust-filter.service.js";
import { AffiliateService } from "./affiliate.service.js";
import { logger } from "../logger.js";

const prisma = new PrismaClient();
const webhookService = new WebhookDispatcherService();
const dustFilterService = new DustFilterService();
const affiliateService = new AffiliateService();

export interface StreamCreatedEvent {
  txHash: string;
  streamId: string | null;
  sender: string;
  receiver: string;
  amount: string;
  contractId: string;
  tokenAddress?: string;
  affiliateId?: string;
}

/**
 * Centralized integration point for stream creation events
 * Handles: webhooks, dust filtering, affiliate tracking
 */
export async function onStreamCreated(event: StreamCreatedEvent): Promise<void> {
  try {
    // Check if stream is dust
    const isDust = event.tokenAddress
      ? await dustFilterService.isDustStream(event.amount, event.tokenAddress)
      : false;

    // Update stream with dust flag
    if (isDust) {
      await (prisma as any).stream.update({
        where: { txHash: event.txHash },
        data: { isDust: true },
      });
      logger.debug(`Stream marked as dust: ${event.txHash}`);
    }

    // Track affiliate earnings
    if (event.affiliateId) {
      const streamRecord = await (prisma as any).stream.findUnique({
        where: { txHash: event.txHash },
      });
      if (streamRecord) {
        await affiliateService.trackStreamCreation(
          streamRecord.id,
          event.amount,
          event.affiliateId
        );
      }
    }

    // Dispatch webhook
    await webhookService.dispatch({
      eventType: "stream_created",
      streamId: event.streamId || null,
      txHash: event.txHash,
      sender: event.sender,
      receiver: event.receiver,
      amount: event.amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in stream creation integration", error);
  }
}

/**
 * Handle stream withdrawal events
 */
export async function onStreamWithdrawn(
  streamId: string,
  amount: string,
  receiver: string
): Promise<void> {
  try {
    await webhookService.dispatch({
      eventType: "stream_withdrawn",
      streamId,
      txHash: "", // Will be populated by webhook service
      sender: "",
      receiver,
      amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in stream withdrawal integration", error);
  }
}

/**
 * Handle stream cancellation events
 */
export async function onStreamCanceled(
  streamId: string,
  sender: string,
  receiver: string,
  amount: string
): Promise<void> {
  try {
    await webhookService.dispatch({
      eventType: "stream_canceled",
      streamId,
      txHash: "",
      sender,
      receiver,
      amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in stream cancellation integration", error);
  }
}
