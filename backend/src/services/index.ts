// Business logic and service layer
// Handles stream calculations and data processing

export {
  StreamLifecycleService,
  toBigIntOrNull,
  toObjectOrNull,
} from "./stream-lifecycle-service.js";

export {
  fetchTokenPrices,
  updateTokenPrices,
  getTokenPrice,
  calculateUsdValue,
  startPriceUpdateJob,
  stopPriceUpdateJob,
} from "./price-feed.service.js";
