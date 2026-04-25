import { Router } from "express";
import { responseWrapper } from "../../middleware/responseWrapper.js";
import { orgPolicyMiddleware } from "../../middleware/orgPolicy.js";
import { draftRateLimitMiddleware } from "../../middleware/draftRateLimit.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { idempotencyMiddleware } from "../../middleware/idempotency.js";
import disbursementFileRouter from "./disbursement-file.routes.js";
import publicVerifyPaymentRouter from "./public-verify-payment.routes.js";
import safeVaultRouter from "./safe-vault.routes.js";
import historyRouter from "./history.routes.js";
import invoiceReportRouter from "./invoice-report.routes.js";
import verifyListRouter from "./verify-list.routes.js";
import exportRouter from "./export.routes.js";
import splitAnalyzeRouter from "./split-analyze.routes.js";
import splitExpandRouter from "./split-expand.routes.js";
import webhooksRouter from "./webhooks.routes.js";
import feeBumpRouter from "./fee-bump.routes.js";
import draftVersionsRouter from "./draft-versions.routes.js";
import assetPriceRouter from "./asset-price.routes.js";
import backfillRouter from "./backfill.routes.js";
import validateSplitRouter from "./validate-split.routes.js";
import proofOfPaymentRouter from "./proof-of-payment.routes.js";
import orgGasStatusRouter from "./org-gas-status.routes.js";
import notificationChannelsRouter from "./notification-channels.routes.js";
import assetMapperRouter from "./asset-mapper.routes.js";
import templateRouter from "./template.routes.js";

const router = Router();

router.use(responseWrapper);
router.use(publicVerifyPaymentRouter);
// All V3 endpoints require a valid API key.
router.use(requireAuth);

// #848 — per-org rate limit on all V3 split-draft endpoints
router.use("/process-disbursement-file", draftRateLimitMiddleware);

// #844 — organisation policy validation on split submissions
router.use("/process-disbursement-file", orgPolicyMiddleware);

// #650 — idempotency key required for split submissions
router.use("/process-disbursement-file", idempotencyMiddleware);

router.use(disbursementFileRouter);
router.use(safeVaultRouter);
router.use(historyRouter);
router.use(invoiceReportRouter);
router.use(verifyListRouter);
router.use(exportRouter);
router.use(splitAnalyzeRouter);
router.use(splitExpandRouter);
router.use(webhooksRouter);
router.use(feeBumpRouter);
router.use(draftVersionsRouter);
router.use(assetPriceRouter);
router.use(backfillRouter);
router.use(validateSplitRouter);
router.use(proofOfPaymentRouter);
router.use(orgGasStatusRouter);
router.use(notificationChannelsRouter);
router.use("/assets", assetMapperRouter);
router.use(templateRouter);

export default router;
