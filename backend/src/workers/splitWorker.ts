import { Worker, Job } from "bullmq";
import { redis } from "../lib/redis.js";
import { logger } from "../logger.js";
import { SplitJobData } from "../lib/splitQueue.js";

/**
 * @notice Processes split_funds jobs one at a time
 * @dev Concurrency is set to 1 to prevent Stellar sequence number collisions.
 * Only one transaction is submitted to the network at a time.
 */
export function createSplitWorker(): Worker<SplitJobData> {
  const worker = new Worker<SplitJobData>(
    "split_funds",
    async (job: Job<SplitJobData>) => {
      const { streamId, sender, receiver, amount, asset } = job.data;

      logger.info("[SplitWorker] Processing split job", {
        jobId: job.id,
        streamId,
        sender,
        receiver,
        amount,
        asset,
      });

      try {
        /**
         * @dev This is where the actual Stellar transaction submission happens.
         * Replace this placeholder with the real Stellar SDK call when
         * integrating with the contract layer.
         *
         * Example:
         *   await stellarService.submitSplitTransaction({
         *     sender, receiver, amount, asset
         *   });
         */

        // Simulate processing time for now
        await new Promise((resolve) => setTimeout(resolve, 100));

        logger.info("[SplitWorker] Split job completed", {
          jobId: job.id,
          streamId,
        });

        return {
          success: true,
          streamId,
          processedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        logger.error("[SplitWorker] Split job failed", {
          jobId: job.id,
          streamId,
          error: error.message,
        });
        throw error;
      }
    },
    {
      connection: redis,
      /**
       * @notice Concurrency MUST stay at 1
       * @dev This is the critical setting that prevents sequence number
       * collisions on Stellar. Never increase this value without implementing
       * a sequence number management strategy.
       */
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    logger.info("[SplitWorker] Job completed", { jobId: job.id });
  });

  worker.on("failed", (job, error) => {
    logger.error("[SplitWorker] Job failed", {
      jobId: job?.id,
      error: error.message,
    });
  });

  worker.on("error", (error) => {
    logger.error("[SplitWorker] Worker error", { error: error.message });
  });

  logger.info("[SplitWorker] Worker started — concurrency: 1");

  return worker;
}

