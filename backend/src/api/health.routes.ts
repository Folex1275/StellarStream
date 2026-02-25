import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client/index.js';
import { Horizon } from '@stellar/stellar-sdk';
import { getConfig } from '../config.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/health/sync', async (_req: Request, res: Response) => {
  try {
    const config = getConfig();
    const server = new Horizon.Server(config.rpcUrl);
    
    const [ledgerResponse, syncState] = await Promise.all([
      server.ledgers().order('desc').limit(1).call(),
      prisma.syncState.findUnique({ where: { id: 1 } })
    ]);

    const currentNetworkLedger = ledgerResponse.records[0]?.sequence ?? 0;
    const indexedLedger = syncState?.lastLedgerSequence ?? 0;
    const difference = currentNetworkLedger - indexedLedger;

    res.json({
      current_network_ledger: currentNetworkLedger,
      indexed_ledger: indexedLedger,
      difference
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

export default router;
