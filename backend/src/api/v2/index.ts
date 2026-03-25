import { Router } from "express";
import { responseWrapper } from "../../middleware/responseWrapper.js";

import streamsRouter from "./streams.routes.js";
import statsRouter from "./stats.routes.js";

const router = Router();

// Apply standard JSON response wrapper to all V2 endpoints
router.use(responseWrapper);

router.use("/streams", streamsRouter);
router.use("/stats", statsRouter);

export default router;
