import { Queue } from "bullmq";
import { redis } from "./redis.js";
import { logger } from "../logger.js";

/**
 * @notice Job data shape for a split_funds request
 * @dev All fields required to submit a Stellar transaction
 */
export interface SplitJobData {
  streamId: string;
  sender: string;
  receiver: string;
  amount: string;
  asset: string;
  txHash?: string;
  requestedAt: string;
}

/**
 * @notice BullMQ queue for serializing outgoing split_funds transactions
 * @dev Prevents Stellar sequence number collisions by processing one at a time
 */
export const splitQueue = new Queue<SplitJobData>("split_funds", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

splitQueue.on("error", (err) => {
  logger.error("[SplitQueue] Queue error", { error: err.message });
});

/**
 * @notice Add a split_funds job to the pending queue
 * @dev Call this instead of submitting transactions directly
 */
export async function enqueueSplit(data: SplitJobData): Promise<string> {
  const job = await splitQueue.add("split_funds", data, {
    jobId: `split-${data.streamId}-${Date.now()}`,
  });

  logger.info("[SplitQueue] Job enqueued", {
    jobId: job.id,
    streamId: data.streamId,
  });

  return job.id!;
}

/**
 * @notice Get the current status of a split job
 */
export async function getSplitJobStatus(jobId: string): Promise<{
  status: string;
  result?: unknown;
  error?: string;
} | null> {
  const job = await splitQueue.getJob(jobId);

  if (!job) return null;

  const state = await job.getState();

  return {
    status: state,
    result: job.returnvalue,
    error: job.failedReason,
  };
}

