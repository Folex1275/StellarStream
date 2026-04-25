# Redis Transaction Queue

## Overview

This document describes the Redis-backed transaction queue implemented
in `StellarStream`. It prevents Stellar sequence number collisions during
high-concurrency splits by serializing all outgoing transactions through
a BullMQ queue processed one at a time.

---

## The Problem

On Stellar, every account has a sequence number that increments with
each transaction. If two split requests are submitted simultaneously,
both read the same sequence number and one fails with a sequence number
collision error. This causes failed transactions and poor user experience
under high load.

## The Solution

All `split_funds` requests are added to a Redis-backed BullMQ queue.
A dedicated worker processes them one by one with `concurrency: 1`,
ensuring only one transaction is submitted to Stellar at a time.

---

## How It Works
```
Split request arrives
        │
        ▼
POST /splits/enqueue
        │
        ▼
Job added to Redis queue (status: pending)
        │
        ▼
SplitWorker picks up job (concurrency: 1)
        │
        ▼
Stellar transaction submitted
        │
        ▼
Job marked as completed
        │
        ▼
GET /splits/status/:jobId → { status: "completed" }
```

---

## API Endpoints

### `POST /splits/enqueue`
Adds a split request to the pending queue.

**Request body:**
```json
{
  "streamId": "stream-123",
  "sender": "GABC...",
  "receiver": "GDEF...",
  "amount": "1000000",
  "asset": "native"
}
```

**Response (202):**
```json
{
  "jobId": "split-stream-123-1234567890",
  "status": "pending",
  "message": "Split request queued for processing"
}
```

### `GET /splits/status/:jobId`
Returns the current status of a queued split job.

**Response:**
```json
{
  "status": "completed",
  "result": { "success": true, "streamId": "stream-123" },
  "error": null
}
```

Possible status values: `waiting`, `active`, `completed`, `failed`, `delayed`

---

## Implementation

**File:** `src/lib/splitQueue.ts`

### `splitQueue`
BullMQ queue instance connected to Redis. Configured with:
- 3 retry attempts on failure
- Exponential backoff starting at 1 second
- Keeps last 100 completed and 200 failed jobs

### `enqueueSplit(data)`
Adds a split job to the queue. Returns the job ID.

### `getSplitJobStatus(jobId)`
Returns the current status, result, and error of a job.

**File:** `src/workers/splitWorker.ts`

### `createSplitWorker()`
Creates and starts a BullMQ worker with `concurrency: 1`.
This is the critical setting that prevents sequence number collisions.

---

## Security Assumptions

- The queue is backed by Redis — if Redis is down, splits will fail
  gracefully with a 500 error rather than submitting bad transactions
- `concurrency: 1` must never be increased without implementing a
  sequence number management strategy
- Jobs are retried up to 3 times with exponential backoff — transient
  Stellar network errors are handled automatically
- Failed jobs are kept for 200 entries for debugging purposes

---

## Abuse and Failure Paths

| Scenario | Behaviour |
|----------|-----------|
| Missing required fields | Returns 400 with error message |
| Redis is down | Returns 500, job not queued |
| Stellar transaction fails | Job retried up to 3 times |
| Job not found | Returns 404 |
| Worker crashes | BullMQ auto-restarts, jobs remain in queue |

---

## Test Coverage

**File:** `src/__jest__/splitQueue.test.ts`

| Test | What it verifies |
|------|-----------------|
| adds a split job to the queue | enqueueSplit calls queue.add correctly |
| returns the job ID after enqueuing | Job ID returned to caller |
| returns job status when job exists | getSplitJobStatus reads from queue |
| returns null when job does not exist | Handles missing jobs gracefully |
| returns error reason when job has failed | Failed job error exposed |
| returns completed status with result | Completed job result exposed |

---

## Related Files

- `src/lib/splitQueue.ts` — queue definition and helper functions
- `src/workers/splitWorker.ts` — worker that processes jobs
- `src/lib/redis.ts` — Redis connection
- `src/index.ts` — route and worker registration
- `src/__jest__/splitQueue.test.ts` — test suite

