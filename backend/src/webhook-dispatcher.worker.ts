import { WebhookDispatcherService } from "./services/webhook-dispatcher.service.js";
import { logger } from "./logger.js";

const webhookService = new WebhookDispatcherService();

/**
 * Background worker to process webhook deliveries with retry logic
 * Runs every 10 seconds
 */
export async function startWebhookWorker(): Promise<void> {
  logger.info("Starting webhook dispatcher worker");

  setInterval(async () => {
    try {
      await webhookService.processDeliveries();
    } catch (error) {
      logger.error("Error in webhook dispatcher worker", error);
    }
  }, 10000); // Process every 10 seconds
}
