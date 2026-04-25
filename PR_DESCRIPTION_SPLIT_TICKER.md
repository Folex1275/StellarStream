# feat: SplitExecuted Live Ticker (Social Proof)

## What
Adds a real-time public feed that shows V3 splits as they happen on-chain — giving visitors and users live "social proof" that the protocol is active.

## Changes

**`frontend/components/split-live-ticker.tsx`** (new)
Real-time ticker UI. Renders anonymized split events with framer-motion enter animations. Shows sender, recipient count, amount, and token. A live/offline dot reflects WebSocket connection state.

**`frontend/lib/hooks/use-split-feed.ts`** (new)
WebSocket hook. Joins the `split-feed` room on connect, listens for `SPLIT_EXECUTED` events, anonymizes sender addresses to `G...ABCD` format, and caps the feed at 20 entries.

**`backend/src/services/websocket.service.ts`** (modified)
- Added `SplitExecutedPayload` type
- Added `join-split-feed` socket handler
- Added `emitSplitExecuted()` method — call this from the ingestor when a V3 `execute_split` event is detected on-chain

## Usage
```tsx
<SplitLiveTicker />
```
Ingestor side:
```ts
wsService.emitSplitExecuted({ splitId, sender, amount, token, recipientCount, timestamp });
```

## Notes
- Addresses are anonymized on the frontend before render — raw addresses never appear in the public feed
- No new dependencies — uses the existing `socket.io-client` and `framer-motion` already in `package.json`
