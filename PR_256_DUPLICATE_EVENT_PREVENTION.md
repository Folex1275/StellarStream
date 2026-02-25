# Pull request: Duplicate event prevention (idempotency) #256

## Open this link to create the PR

**Fork (your repo):**  
https://github.com/Junman140/StellarStream/compare/main...feature/eventlog-dedup

**Or from upstream:** Open https://github.com/Folex1275/StellarStream, then use "Compare & pull request" if GitHub shows your branch.

---

## Suggested PR title

`fix(backend): Duplicate event prevention (idempotency) #256`

## Suggested PR description

### Summary

Implements duplicate event prevention (idempotency) for issue #256 so that if an event is fetched twice (e.g. RPC retry), it is not saved to the DB twice.

### Changes

- **EventLog**: Use Stellar `event_id` as the unique constraint (schema already had `EventLog.eventId` @id). Insert into `event_log` at the start of `processEvent` before any business logic.
- **Try/catch**: Wrap `prisma.eventLog.create` in try/catch; on Prisma P2002 (unique constraint violation), log at debug and return early so the event is skipped. Other errors are rethrown.
- **Order**: EventLog insert runs before `extractEventType` / `logger.event` / `handleEventByType` so duplicate events do no downstream work.
- **Schema**: Removed `url` from `datasource` in `backend/prisma/schema.prisma` for Prisma 7 compatibility (URL is in `prisma.config.ts`).
- **Stream create/withdrawn**: Optional P2002 handling so duplicate Stream writes are skipped if the same event is replayed.

### Tasks (issue #256)

- [x] Use the unique event_id provided by Stellar as a unique constraint in the EventLog table
- [x] Wrap the database save logic in a try/catch to ignore "Unique Constraint" errors

Closes #256
