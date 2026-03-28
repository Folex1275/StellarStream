import cron from "node-cron";
import { PriceService } from "./services/price.service.js";
import { TvlAggregatorService } from "./services/tvl-aggregator.service.js";
import { AssetMetadataService } from "./services/asset-metadata.service.js";
import { AutopilotService } from "./services/autopilot.service.js";
import { archiveOldDisbursements } from "./services/disbursement-archive.service.js";
import { LedgerConsistencyChecker } from "./services/ledger-consistency.service.js";
import { logger } from "./logger.js";

const priceService = new PriceService();
const tvlService = new TvlAggregatorService();
const assetService = new AssetMetadataService();
const autopilotService = new AutopilotService();

/**
 * Update prices every 5 minutes (300 seconds)
 */
export function schedulePriceUpdates() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Starting scheduled price update");
      await priceService.updateAllPrices();
      logger.info("Price update completed");
    } catch (error) {
      logger.error("Failed to update prices in scheduled task", error);
    }
  });

  logger.info("Price update scheduler started (every 5 minutes)");
}

/**
 * Update global stats every 10 minutes
 */
export function scheduleGlobalStatsUpdate() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      logger.info("Starting scheduled global stats aggregation");
      await tvlService.aggregateStats();
      logger.info("Global stats aggregation completed");
    } catch (error) {
      logger.error("Failed to aggregate stats in scheduled task", error);
    }
  });

  logger.info("Global stats scheduler started (every 10 minutes)");
}

/**
 * Save daily TVL snapshot at midnight UTC
 */
export function scheduleDailyTvlSnapshot() {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("Starting daily TVL snapshot");
      await tvlService.saveDailySnapshot();
      logger.info("Daily TVL snapshot completed");
    } catch (error) {
      logger.error("Failed to save daily TVL snapshot", error);
    }
  });

  logger.info("Daily TVL snapshot scheduler started (midnight UTC)");
}

/**
 * Discover new asset metadata every 6 hours
 */
export function scheduleAssetDiscovery() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      logger.info("Starting scheduled asset discovery");
      await assetService.discoverNewAssets();
      logger.info("Asset discovery completed");
    } catch (error) {
      logger.error("Failed to discover new assets in scheduled task", error);
    }
  });

  logger.info("Asset discovery scheduler started (every 6 hours)");
}

/**
 * Initialize all scheduled tasks
 */
export function initializeSchedulers() {
  schedulePriceUpdates();
  scheduleGlobalStatsUpdate();
  scheduleDailyTvlSnapshot();
  scheduleAssetDiscovery();
  scheduleAutopilot();
  scheduleDisbursementArchive();
  scheduleLedgerConsistencyCheck();
}

/**
 * Autopilot: scan for due periodic split schedules every hour.
 */
export function scheduleAutopilot() {
  cron.schedule("0 * * * *", async () => {
    try {
      logger.info("[Autopilot] Starting hourly schedule scan");
      await autopilotService.runDueSchedules();
      logger.info("[Autopilot] Hourly schedule scan completed");
    } catch (error) {
      logger.error("[Autopilot] Hourly scan failed", error);
    }
  });

  logger.info("Autopilot scheduler started (every hour)");
}

/**
 * Disbursement Archive (#845): move EventLog rows older than 1 year to cold storage.
 * Runs on the 1st of every month at 02:00 UTC.
 */
export function scheduleDisbursementArchive() {
  cron.schedule("0 2 1 * *", async () => {
    try {
      logger.info("[DisbursementArchive] Starting monthly archive job");
      await archiveOldDisbursements();
      logger.info("[DisbursementArchive] Monthly archive job completed");
    } catch (error) {
      logger.error("[DisbursementArchive] Monthly archive job failed", error);
    }
  });

  logger.info("Disbursement archive scheduler started (1st of each month, 02:00 UTC)");
}

/**
 * Ledger Consistency Checker (#849): verify DB entries against the Stellar ledger.
 * Runs every 6 hours.
 */
export function scheduleLedgerConsistencyCheck() {
  const checker = new LedgerConsistencyChecker();

  cron.schedule("0 */6 * * *", async () => {
    try {
      logger.info("[LedgerConsistency] Starting consistency audit");
      await checker.run();
      logger.info("[LedgerConsistency] Consistency audit completed");
    } catch (error) {
      logger.error("[LedgerConsistency] Consistency audit failed", error);
    }
  });

  logger.info("Ledger consistency checker started (every 6 hours)");
}
