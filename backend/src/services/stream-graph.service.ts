import { BatchMetadataService } from "./batch-metadata.service.js";
import type { PrismaClient } from "../generated/client/client.js";

const NUM_POINTS = 20;

export interface StreamGraphDataPoint {
  time: number;
  unlocked: string;
  label?: string;
}

export interface StreamGraphResult {
  dataPoints: StreamGraphDataPoint[];
  projectedYield: null;
}

/**
 * Returns graph data for a stream, or null if the stream is not found.
 * Uses lifecycle metadata for start/total and Prisma for rate when stream is active.
 */
export async function getStreamGraph(
  streamId: string,
  batchService: BatchMetadataService,
  prisma: PrismaClient,
): Promise<StreamGraphResult | null> {
  const { results, errors } = await batchService.getStreamMetadataBatch([
    streamId,
  ]);
  const errorEntry = errors.find((e) => e.stream_id === streamId);
  const meta = results.find((r) => r.stream_id === streamId);
  if (errorEntry || !meta) {
    return null;
  }

  const totalAmount = BigInt(meta.original_total_amount);
  const startMs = new Date(meta.created_at).getTime();
  let endMs: number;

  if (meta.closed_at) {
    endMs = new Date(meta.closed_at).getTime();
  } else {
    const stream = await prisma.stream.findFirst({
      where: { streamId: streamId },
      select: { duration: true },
    });
    if (stream && stream.duration > 0) {
      endMs = startMs + stream.duration * 1000;
    } else {
      endMs = Date.now();
    }
  }

  if (endMs <= startMs) {
    endMs = startMs + 1;
  }

  const dataPoints: StreamGraphDataPoint[] = [];
  const durationMs = endMs - startMs;

  for (let i = 0; i < NUM_POINTS; i++) {
    const timeMs = startMs + (durationMs * i) / (NUM_POINTS - 1);
    const progress = i / (NUM_POINTS - 1);
    const unlocked = (totalAmount * BigInt(Math.round(progress * 1e9))) / BigInt(1e9);
    dataPoints.push({
      time: timeMs,
      unlocked: unlocked.toString(),
      label: formatLabel(timeMs - startMs),
    });
  }

  return {
    dataPoints,
    projectedYield: null,
  };
}

function formatLabel(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
