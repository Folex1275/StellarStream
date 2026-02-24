// Stellar blockchain indexer
// Monitors and indexes payment stream transactions from Stellar network

import { handleStreamWithdrawn } from './handlers';

// Example: wire up to whatever event source you have.
// This file exports the handler so the rest of the app can call it when events arrive.

export { handleStreamWithdrawn };

// Example usage (pseudo):
// eventSource.on('StreamWithdrawn', async (ev) => {
//   try { await handleStreamWithdrawn(ev); } catch (err) { console.error(err); }
// });
