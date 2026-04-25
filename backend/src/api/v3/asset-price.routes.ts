import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { assetPriceOracleService } from '../../services/asset-price-oracle.service.js';

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const pricesQuerySchema = z.object({
  assets: z.string().transform((s) => s.split(',')),
});

// ── GET /api/v3/prices
// Get current prices for assets. Cached for 60 seconds.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/prices', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = pricesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const { assets } = parsed.data;
    const prices = await assetPriceOracleService.fetchPrices(assets);

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      prices,
      count: prices.length,
      timestamp: Date.now(),
      cacheExpiry: Date.now() + 60000,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// ── GET /api/v3/prices/:asset
// Get price for a single asset.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/prices/:asset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { asset } = req.params;

    if (!asset || asset.length === 0) {
      res.status(400).json({ error: 'Invalid asset' });
      return;
    }

    const price = await assetPriceOracleService.getPrice(asset);

    if (!price) {
      res.status(404).json({ error: 'Price not found for asset', asset });
      return;
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      price,
      timestamp: Date.now(),
      cacheExpiry: Date.now() + 60000,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// ── POST /api/v3/prices/refresh
// Manually refresh price cache for assets.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/prices/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      res.status(400).json({ error: 'Invalid assets array' });
      return;
    }

    // Clear cache for specified assets
    for (const asset of assets) {
      await assetPriceOracleService.clearCache(asset);
    }

    // Fetch fresh prices
    const prices = await assetPriceOracleService.fetchPrices(assets);

    res.json({
      message: 'Prices refreshed',
      prices,
      count: prices.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh prices' });
  }
});

// ── GET /api/v3/prices/cache/stats
// Get cache statistics.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/prices/cache/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await assetPriceOracleService.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

export default router;
