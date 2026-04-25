import { Router, Request, Response } from "express";
import { z } from "zod";
import { NotificationChannelsService } from "../../services/notification-channels.service.js";
import validateRequest from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { logger } from "../../logger.js";

const router = Router();
const notificationService = new NotificationChannelsService();

const registerChannelSchema = z.object({
  orgAddress: z.string().min(1, "orgAddress is required"),
  platform: z.enum(["discord", "slack"]),
  webhookUrl: z.string().url("Invalid webhook URL"),
});

const orgAddressSchema = z.object({
  orgAddress: z.string().min(1, "orgAddress is required"),
});

/**
 * POST /api/v3/notification-channels
 *
 * Register a new Discord/Slack webhook for an organization.
 */
router.post(
  "/",
  validateRequest({ body: registerChannelSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { orgAddress, platform, webhookUrl } = req.body;

    try {
      const channel = await notificationService.registerChannel(orgAddress, platform, webhookUrl);

      res.status(201).json({
        success: true,
        data: channel,
      });
    } catch (error) {
      logger.error("Failed to register notification channel:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register notification channel",
      });
    }
  })
);

/**
 * GET /api/v3/notification-channels/:orgAddress
 *
 * Get all active notification channels for an organization.
 */
router.get(
  "/:orgAddress",
  validateRequest({ params: orgAddressSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { orgAddress } = req.params;

    try {
      const channels = await notificationService.getChannels(orgAddress);

      res.json({
        success: true,
        data: channels,
      });
    } catch (error) {
      logger.error("Failed to fetch notification channels:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch notification channels",
      });
    }
  })
);

export default router;
