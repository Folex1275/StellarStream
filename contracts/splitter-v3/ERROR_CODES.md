# V3 Splitter — Error Code Reference

> Issue #840: Human-readable descriptions moved here from `errors.rs` to keep
> non-critical strings out of the compiled WASM binary.

| Code | Variant                        | Description                                                  |
|------|--------------------------------|--------------------------------------------------------------|
| 1    | `AlreadyInitialized`           | `initialize` was called more than once.                      |
| 2    | `NotAdmin`                     | Caller is not the single owner set at initialization.        |
| 3    | `RecipientNotVerified`         | A recipient failed the strict-mode verification check.       |
| 4    | `NoVerifiedRecipients`         | Non-strict split: none of the recipients are verified.       |
| 5    | `InvalidSplit`                 | Recipient `share_bps` values do not sum to exactly 10 000.   |
| 6    | `Overflow`                     | An arithmetic operation would overflow `i128` / `u32`.       |
| 7    | `NotAuthorizedAdmin`           | Caller is not in the 3-address quorum admin list.            |
| 8    | `AlreadyApproved`              | Caller already voted on this proposal.                       |
| 9    | `ProposalNotFound`             | No proposal exists with the given `proposal_id`.             |
| 10   | `AlreadyExecuted`              | The proposal has already been executed.                      |
| 11   | `QuorumNotReached`             | Fewer than 2 approvals — cannot execute yet.                 |
| 12   | `SplitNotFound`                | No scheduled split exists with the given `split_id`.         |
| 13   | `NotSplitSender`               | Caller is not the original sender of the scheduled split.    |
| 14   | `SplitAlreadyCancelled`        | The scheduled split was already cancelled.                   |
| 15   | `SplitAlreadyExecuted`         | The scheduled split was already executed.                    |
| 16   | `SplitNotYetDue`               | `cancel_split`: `release_time` has already passed.           |
| 17   | `NothingToClaim`               | `claim_share`: caller's claimable balance is zero.           |
| 18   | `CouncilNotSet`                | Council keys were not stored at initialization.              |
| 19   | `InsufficientCouncilSignatures`| Fewer than 5 unique valid council signatures provided.       |
| 20   | `DuplicateCouncilSigner`       | The same council key appears more than once in the list.     |
| 21   | `InvalidCouncilSigner`         | A signer is not in the stored 7-key council list.            |
| 22   | `NotYetReleased`               | `execute_split`: `release_time` has not been reached yet.    |
| 23   | `EmptyRecipients`              | The recipients vector passed to `split_funds` is empty.      |
| 24   | `InvalidBpsSum`                | `split_percentage`: `bps` values do not sum to 10 000.       |
