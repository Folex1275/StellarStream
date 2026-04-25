import { enqueueSplit, getSplitJobStatus, splitQueue, SplitJobData } from "../lib/splitQueue.js";

// Mock bullmq
jest.mock("bullmq", () => {
  const mockJob = {
    id: "test-job-id",
    data: {},
    returnvalue: null,
    failedReason: undefined,
    getState: jest.fn().mockResolvedValue("waiting"),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getJob: jest.fn().mockResolvedValue(mockJob),
    on: jest.fn(),
  };

  return {
    Queue: jest.fn().mockImplementation(() => mockQueue),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
    })),
  };
});

// Mock redis
jest.mock("../lib/redis.js", () => ({
  redis: {},
}));

// Mock logger
jest.mock("../logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("SplitQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("enqueueSplit", () => {
    it("adds a split job to the queue", async () => {
      const data: SplitJobData = {
        streamId: "stream-1",
        sender: "GABC",
        receiver: "GDEF",
        amount: "1000000",
        asset: "native",
        requestedAt: new Date().toISOString(),
      };

      const jobId = await enqueueSplit(data);

      expect(jobId).toBe("test-job-id");
      expect(splitQueue.add).toHaveBeenCalledWith(
        "split_funds",
        data,
        expect.objectContaining({
          jobId: expect.stringContaining("split-stream-1"),
        })
      );
    });

    it("returns the job ID after enqueuing", async () => {
      const data: SplitJobData = {
        streamId: "stream-2",
        sender: "GABC",
        receiver: "GDEF",
        amount: "500000",
        asset: "native",
        requestedAt: new Date().toISOString(),
      };

      const jobId = await enqueueSplit(data);

      expect(typeof jobId).toBe("string");
      expect(jobId).toBe("test-job-id");
    });
  });

  describe("getSplitJobStatus", () => {
    it("returns job status when job exists", async () => {
      const status = await getSplitJobStatus("test-job-id");

      expect(status).not.toBeNull();
      expect(status?.status).toBe("waiting");
    });

    it("returns null when job does not exist", async () => {
      (splitQueue.getJob as jest.Mock).mockResolvedValueOnce(null);

      const status = await getSplitJobStatus("nonexistent-job");

      expect(status).toBeNull();
    });

    it("returns error reason when job has failed", async () => {
      const failedJob = {
        id: "failed-job-id",
        returnvalue: null,
        failedReason: "Transaction failed",
        getState: jest.fn().mockResolvedValue("failed"),
      };

      (splitQueue.getJob as jest.Mock).mockResolvedValueOnce(failedJob);

      const status = await getSplitJobStatus("failed-job-id");

      expect(status?.status).toBe("failed");
      expect(status?.error).toBe("Transaction failed");
    });

    it("returns completed status with result", async () => {
      const completedJob = {
        id: "completed-job-id",
        returnvalue: { success: true, streamId: "stream-1" },
        failedReason: undefined,
        getState: jest.fn().mockResolvedValue("completed"),
      };

      (splitQueue.getJob as jest.Mock).mockResolvedValueOnce(completedJob);

      const status = await getSplitJobStatus("completed-job-id");

      expect(status?.status).toBe("completed");
      expect(status?.result).toEqual({ success: true, streamId: "stream-1" });
    });
  });
});