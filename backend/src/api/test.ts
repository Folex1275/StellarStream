import { Router, Request, Response } from 'express';
import { StreamLifecycleService } from '../services/stream-lifecycle-service.js';
import { toBigIntOrNull } from '../services/stream-lifecycle-service.js';
import { sanitizeUnknown } from '../security/sanitize.js';

const router = Router();
const streamService = new StreamLifecycleService();

router.post('/test-stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const { streamId, sender, receiver, amount } = sanitizeUnknown(req.body);
    
    if (!streamId || !sender || !receiver || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await streamService.upsertCreatedStream({
      streamId: String(streamId),
      txHash: `test-tx-${Date.now()}`,
      sender: String(sender),
      receiver: String(receiver),
      totalAmount: toBigIntOrNull(String(amount)) ?? 0n,
      createdAtIso: new Date().toISOString(),
      ledger: 12345
    });

    res.json({ success: true, message: 'Test stream created and WebSocket events emitted' });
  } catch (error) {
    console.error('Test stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-withdrawal', async (req: Request, res: Response): Promise<void> => {
  try {
    const { streamId, amount } = sanitizeUnknown(req.body);
    
    if (!streamId || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await streamService.registerWithdrawal({
      streamId: String(streamId),
      amount: toBigIntOrNull(String(amount)) ?? 0n,
      ledger: 12346
    });

    res.json({ success: true, message: 'Test withdrawal created and balance update emitted' });
  } catch (error) {
    console.error('Test withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-cancellation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { streamId, toReceiver, toSender } = sanitizeUnknown(req.body);
    
    if (!streamId || !toReceiver || !toSender) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const summary = await streamService.cancelStream({
      streamId: String(streamId),
      toReceiver: toBigIntOrNull(String(toReceiver)) ?? 0n,
      toSender: toBigIntOrNull(String(toSender)) ?? 0n,
      closedAtIso: new Date().toISOString(),
      ledger: 12347
    });

    res.json({ success: true, summary, message: 'Test cancellation created and events emitted' });
  } catch (error) {
    console.error('Test cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
