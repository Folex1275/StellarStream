import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { BatchMetadataService } from "../services/batch-metadata.service.js";

// ═══════════════════════════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════════════════════════

const TEST_DIR = path.join(import.meta.dirname ?? process.cwd(), "__test_data__");
const TEST_DB_PATH = path.join(TEST_DIR, "stream-lifecycle-db.json");

/**
 * Sample stream data used across all tests.
 */
function sampleDb() {
    return {
        streams: {
            "stream-001": {
                stream_id: "stream-001",
                tx_hash_created: "tx-aaa",
                sender: "GALICE",
                receiver: "GBOB",
                original_total_amount: "1000000",
                streamed_amount: "250000",
                status: "ACTIVE",
                created_at: "2025-01-01T00:00:00Z",
                closed_at: null,
                updated_at: "2025-06-15T12:00:00Z",
                last_ledger: 100,
            },
            "stream-002": {
                stream_id: "stream-002",
                tx_hash_created: "tx-bbb",
                sender: "GCHARLIE",
                receiver: "GDAVE",
                original_total_amount: "5000000",
                streamed_amount: "5000000",
                status: "COMPLETED",
                created_at: "2025-02-01T00:00:00Z",
                closed_at: "2025-05-01T00:00:00Z",
                updated_at: "2025-05-01T00:00:00Z",
                last_ledger: 200,
            },
            "stream-003": {
                stream_id: "stream-003",
                tx_hash_created: "tx-ccc",
                sender: "GEVE",
                receiver: "GFRANK",
                original_total_amount: "2000000",
                streamed_amount: "800000",
                status: "CANCELED",
                created_at: "2025-03-01T00:00:00Z",
                closed_at: "2025-04-01T00:00:00Z",
                updated_at: "2025-04-01T00:00:00Z",
                last_ledger: 150,
            },
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// Service-level tests
// ═══════════════════════════════════════════════════════════════

describe("BatchMetadataService", () => {
    before(async () => {
        await mkdir(TEST_DIR, { recursive: true });
        await writeFile(TEST_DB_PATH, JSON.stringify(sampleDb(), null, 2), "utf-8");
    });

    after(async () => {
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    it("should return metadata for all valid stream IDs", async () => {
        const service = new BatchMetadataService(TEST_DB_PATH);
        const res = await service.getStreamMetadataBatch([
            "stream-001",
            "stream-002",
            "stream-003",
        ]);

        assert.equal(res.results.length, 3);
        assert.equal(res.errors.length, 0);
        assert.equal(res.results[0].stream_id, "stream-001");
        assert.equal(res.results[0].status, "ACTIVE");
        assert.equal(res.results[1].stream_id, "stream-002");
        assert.equal(res.results[1].status, "COMPLETED");
        assert.equal(res.results[2].stream_id, "stream-003");
        assert.equal(res.results[2].status, "CANCELED");
    });

    it("should return errors for missing stream IDs", async () => {
        const service = new BatchMetadataService(TEST_DB_PATH);
        const res = await service.getStreamMetadataBatch([
            "nonexistent-1",
            "nonexistent-2",
        ]);

        assert.equal(res.results.length, 0);
        assert.equal(res.errors.length, 2);
        assert.equal(res.errors[0].stream_id, "nonexistent-1");
        assert.equal(res.errors[0].error, "Stream not found");
    });

    it("should handle mixed found and not-found IDs", async () => {
        const service = new BatchMetadataService(TEST_DB_PATH);
        const res = await service.getStreamMetadataBatch([
            "stream-001",
            "nonexistent",
            "stream-003",
        ]);

        assert.equal(res.results.length, 2);
        assert.equal(res.errors.length, 1);
        assert.equal(res.results[0].stream_id, "stream-001");
        assert.equal(res.results[1].stream_id, "stream-003");
        assert.equal(res.errors[0].stream_id, "nonexistent");
    });

    it("should return all fields in the result", async () => {
        const service = new BatchMetadataService(TEST_DB_PATH);
        const res = await service.getStreamMetadataBatch(["stream-001"]);

        const result = res.results[0];
        assert.equal(result.stream_id, "stream-001");
        assert.equal(result.sender, "GALICE");
        assert.equal(result.receiver, "GBOB");
        assert.equal(result.original_total_amount, "1000000");
        assert.equal(result.streamed_amount, "250000");
        assert.equal(result.status, "ACTIVE");
        assert.equal(result.created_at, "2025-01-01T00:00:00Z");
        assert.equal(result.closed_at, null);
    });

    it("should return empty results when DB does not exist", async () => {
        const service = new BatchMetadataService("/tmp/nonexistent-db.json");
        const res = await service.getStreamMetadataBatch(["stream-001"]);

        assert.equal(res.results.length, 0);
        assert.equal(res.errors.length, 1);
    });

    it("should handle a large batch (50+ IDs)", async () => {
        const service = new BatchMetadataService(TEST_DB_PATH);
        const ids = Array.from({ length: 60 }, (_, i) =>
            i < 3 ? `stream-00${i + 1}` : `fake-${i}`,
        );
        const res = await service.getStreamMetadataBatch(ids);

        assert.equal(res.results.length, 3);
        assert.equal(res.errors.length, 57);
    });
});

// ═══════════════════════════════════════════════════════════════
// HTTP-level integration tests
// ═══════════════════════════════════════════════════════════════

/**
 * Helper to make HTTP requests to the test server.
 */
function postJson(
    port: number,
    urlPath: string,
    body: unknown,
): Promise<{ statusCode: number; data: Record<string, unknown> }> {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
            {
                hostname: "127.0.0.1",
                port,
                path: urlPath,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                },
            },
            (res) => {
                let raw = "";
                res.on("data", (chunk: Buffer) => {
                    raw += chunk.toString();
                });
                res.on("end", () => {
                    try {
                        resolve({
                            statusCode: res.statusCode ?? 500,
                            data: JSON.parse(raw) as Record<string, unknown>,
                        });
                    } catch {
                        reject(new Error(`Failed to parse response: ${raw}`));
                    }
                });
            },
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

describe("POST /api/v1/streams/metadata/batch (integration)", () => {
    let server: http.Server;
    let port: number;

    before(async () => {
        // Write test DB
        await mkdir(TEST_DIR, { recursive: true });
        await writeFile(TEST_DB_PATH, JSON.stringify(sampleDb(), null, 2), "utf-8");

        // Set up a test Express server with a BatchMetadataService pointing at the test DB
        const express = (await import("express")).default;
        const { createBatchRoutes } = await import("../api/routes.js");

        const testService = new BatchMetadataService(TEST_DB_PATH);
        const app = express();
        app.use(express.json());
        app.use(createBatchRoutes(testService));

        await new Promise<void>((resolve) => {
            server = app.listen(0, "127.0.0.1", () => {
                const addr = server.address();
                port = typeof addr === "object" && addr !== null ? addr.port : 0;
                resolve();
            });
        });
    });

    after(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    it("should return 400 when streamIds is missing", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            {},
        );
        assert.equal(statusCode, 400);
        assert.ok(
            (data.error as string).includes("must be an array"),
            `Unexpected error: ${data.error}`,
        );
    });

    it("should return 400 when streamIds is not an array", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: "not-an-array" },
        );
        assert.equal(statusCode, 400);
        assert.ok((data.error as string).includes("must be an array"));
    });

    it("should return 400 when streamIds is empty", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: [] },
        );
        assert.equal(statusCode, 400);
        assert.ok((data.error as string).includes("must not be empty"));
    });

    it("should return 400 when batch size exceeds maximum", async () => {
        const oversized = Array.from({ length: 201 }, (_, i) => `id-${i}`);
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: oversized },
        );
        assert.equal(statusCode, 400);
        assert.ok((data.error as string).includes("exceeds the maximum"));
    });

    it("should return 400 when streamIds contains non-string values", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: [123, null, "valid-id"] },
        );
        assert.equal(statusCode, 400);
        assert.ok((data.error as string).includes("non-empty strings"));
    });

    it("should return 200 with results for valid request", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: ["stream-001", "stream-002"] },
        );
        assert.equal(statusCode, 200);
        const results = data.results as Array<Record<string, unknown>>;
        assert.equal(results.length, 2);
        assert.equal(results[0].stream_id, "stream-001");
        assert.equal(results[1].stream_id, "stream-002");
    });

    it("should return partial results for mixed valid/invalid IDs", async () => {
        const { statusCode, data } = await postJson(
            port,
            "/api/v1/streams/metadata/batch",
            { streamIds: ["stream-001", "ghost-id"] },
        );
        assert.equal(statusCode, 200);
        const results = data.results as Array<Record<string, unknown>>;
        const errors = data.errors as Array<Record<string, unknown>>;
        assert.equal(results.length, 1);
        assert.equal(errors.length, 1);
        assert.equal(results[0].stream_id, "stream-001");
        assert.equal(errors[0].stream_id, "ghost-id");
    });
});
