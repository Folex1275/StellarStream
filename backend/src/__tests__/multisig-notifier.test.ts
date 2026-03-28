/**
 * Unit tests for MultisigNotifierService
 * Mocks prisma and fetch — no real DB or network calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockSubFindMany = vi.fn();

vi.mock("../../lib/db.js", () => ({
  prisma: {
    autopilotSchedule: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
    notificationSubscription: {
      findMany: mockSubFindMany,
    },
  },
}));

vi.mock("../../logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ── Import after mocks ────────────────────────────────────────────────────────

import { MultisigNotifierService } from "../../services/multisig-notifier.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date("2026-01-01T10:00:00Z");
const IN_12H = new Date(NOW.getTime() + 12 * 60 * 60 * 1000);
const IN_25H = new Date(NOW.getTime() + 25 * 60 * 60 * 1000);

function makeSchedule(overrides: object = {}) {
  return {
    id: "sched-1",
    name: "Payroll",
    releaseTime: IN_12H,
    signers: ["GABC123", "GDEF456"],
    notifiedAt: null,
    isActive: true,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MultisigNotifierService.notifyPendingSigners", () => {
  let service: MultisigNotifierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MultisigNotifierService();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("does nothing when no schedules are in the 24-hour window", async () => {
    mockFindMany.mockResolvedValue([]);
    await service.notifyPendingSigners();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends Discord notification via registered subscription", async () => {
    mockFindMany.mockResolvedValue([makeSchedule()]);
    mockSubFindMany.mockResolvedValue([
      { platform: "discord", webhookUrl: "https://discord.com/api/webhooks/test", chatId: null },
    ]);

    await service.notifyPendingSigners();

    // fetch called once per signer (2 signers × 1 subscription each = 2 calls)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe("https://discord.com/api/webhooks/test");
  });

  it("marks schedule as notified after dispatching", async () => {
    mockFindMany.mockResolvedValue([makeSchedule()]);
    mockSubFindMany.mockResolvedValue([]);
    process.env.MULTISIG_ALERT_DISCORD_WEBHOOK = "";

    await service.notifyPendingSigners();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sched-1" },
        data: expect.objectContaining({ notifiedAt: expect.any(Date) }),
      })
    );
  });

  it("uses fallback Discord webhook when no subscription exists", async () => {
    process.env.MULTISIG_ALERT_DISCORD_WEBHOOK = "https://discord.com/api/webhooks/fallback";
    mockFindMany.mockResolvedValue([makeSchedule({ signers: ["GABC123"] })]);
    mockSubFindMany.mockResolvedValue([]);

    await service.notifyPendingSigners();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/fallback",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("still marks notifiedAt even when a Discord call fails", async () => {
    mockFindMany.mockResolvedValue([makeSchedule({ signers: ["GABC123"] })]);
    mockSubFindMany.mockResolvedValue([
      { platform: "discord", webhookUrl: "https://discord.com/api/webhooks/bad", chatId: null },
    ]);
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" });

    await service.notifyPendingSigners();

    // notifiedAt must still be set — we don't retry on the next tick
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notifiedAt: expect.any(Date) }) })
    );
  });

  it("skips schedules with no signers", async () => {
    mockFindMany.mockResolvedValue([makeSchedule({ signers: [] })]);

    await service.notifyPendingSigners();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
