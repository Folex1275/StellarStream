# StellarStream-DAO Constitution

**Version:** 1.0.0
**Status:** Draft
**Repository:** Folex1275/StellarStream
**Labels:** [Docs] [Governance] [Medium]

---

## Preamble

This Constitution governs the StellarStream Protocol — a decentralized infrastructure for streaming-based value transfer. It establishes the rules for protocol updates, fee adjustments, and the conduct of all participants within the Multi-Admin Quorum. All Validators, Admins, and token holders are bound by these provisions upon participation in any governance action.

---

## Article I — Definitions

| Term | Definition |
|---|---|
| **Protocol** | The on-chain smart-contract system and off-chain infrastructure comprising StellarStream. |
| **Proposal** | A formally submitted intent to alter any Protocol parameter, code, fee schedule, or governance rule. |
| **Multi-Admin Quorum (MAQ)** | The set of elected Admin key-holders authorized to ratify or veto Proposals that pass community vote. |
| **Validator** | A node operator who attests to transaction validity and participates in governance signaling. |
| **Admin** | A MAQ member holding elevated execution rights to deploy ratified changes on-chain. |
| **Voting Power (VP)** | The weighted influence of a participant, derived from staked STRM tokens at snapshot time. |
| **Timelock** | A mandatory delay between ratification and on-chain execution of a change. |

---

## Article II — Proposal Lifecycle

Every change to the Protocol, fee schedule, or governance rules must pass through the following stages in order. Skipping or bypassing any stage — except under Article V (Emergency Decommissioning) — is invalid.

### Stage 0 — Ideation (off-chain)
- Any community member may post a **Stellar Improvement Proposal (SIP)** in the designated governance forum.
- The SIP must include: motivation, specification, risk analysis, and rollback plan.
- A minimum **discussion period of 7 days** is required before advancing.
- The author may revise the SIP based on community feedback during this window.

### Stage 1 — Formal Submission (on-chain)
- After the discussion period, the author (or a sponsor holding ≥ 10,000 VP) submits the SIP on-chain.
- Submission requires a **proposal bond** of 500 STRM, returned upon passage or slashed upon rejection with < 10 % participation.
- The Proposal receives a unique `SIP-XXXX` identifier and enters the **Pending** state.

### Stage 2 — Review Window
- Duration: **3 days** for minor parameter changes; **7 days** for protocol-level upgrades; **14 days** for constitutional amendments.
- The MAQ performs a technical feasibility and security review.
- MAQ may issue a `REVIEW_HOLD` (maximum once per Proposal, extending the window by 7 days) if material risks are identified.
- Community members may submit formal objections on-chain during this period.

### Stage 3 — Voting
- Voting opens immediately after the Review Window closes (unless a `REVIEW_HOLD` is active).
- Snapshot of VP is taken at the block in which voting opens; no VP changes during the vote affect the outcome.
- **Voting period:** 5 days for all Proposal categories.
- Votes are cast as `YES`, `NO`, or `ABSTAIN`.
- VP delegated to another address before snapshot counts toward the delegate's total.

### Stage 4 — Ratification
- A Proposal advances to **Ratified** if it meets the thresholds defined in Article III.
- A Proposal that fails thresholds moves to **Rejected**; the bond is burned proportionally to the shortfall.
- Ratified Proposals are queued in the **Timelock** (see Article III §4).

### Stage 5 — Execution
- After the Timelock expires, any Admin (or an authorized keeper bot) may call the execution transaction.
- Execution must occur within **7 days** of Timelock expiry; otherwise the Proposal expires and must be resubmitted.
- On successful execution, the Proposal state is set to **Enacted** and the proposal bond is refunded.

### Stage 6 — Post-Execution Review
- Within **30 days** of enactment, the MAQ publishes a post-mortem or impact report.
- Any measurable deviation from the Proposal's stated outcomes triggers a mandatory follow-up SIP.

```
[Ideation] → [Pending] → [Under Review] → [Voting] → [Ratified/Rejected] → [Timelocked] → [Enacted/Expired]
                                                                                    ↑
                                                               Emergency path bypasses to here (Article V)
```

---

## Article III — Voting Weight and Thresholds

### §1 — Voting Power Calculation

```
VP(address) = staked_STRM(address) + Σ delegated_STRM(address)
```

- Only STRM staked in the **StellarStream Governance Vault** counts toward VP.
- Liquid (unstaked) STRM confers no VP.
- Stake locked for ≥ 180 days receives a **1.5× multiplier**.
- Validator nodes receive an additional **flat bonus of 500 VP** per active node, capped at 5 nodes per entity.

### §2 — Quorum Requirements

Quorum is the minimum fraction of **total circulating staked VP** that must participate (YES + NO + ABSTAIN) for a vote to be valid.

| Proposal Category | Quorum |
|---|---|
| Fee parameter adjustment (< 5 % change) | 10 % |
| Fee parameter adjustment (≥ 5 % change) | 20 % |
| Protocol upgrade (non-breaking) | 25 % |
| Protocol upgrade (breaking / migration) | 35 % |
| Constitutional amendment | 50 % |
| MAQ membership change | 40 % |

If quorum is not reached, the Proposal automatically moves to **Rejected** and may be resubmitted after 14 days.

### §3 — Approval Thresholds

Approval is measured as `YES / (YES + NO)` (excluding ABSTAIN).

| Proposal Category | Approval Threshold |
|---|---|
| Fee parameter adjustment (< 5 % change) | 51 % |
| Fee parameter adjustment (≥ 5 % change) | 60 % |
| Protocol upgrade (non-breaking) | 60 % |
| Protocol upgrade (breaking / migration) | 67 % |
| Constitutional amendment | 75 % |
| MAQ membership change | 67 % |

### §4 — Timelock Durations

| Proposal Category | Timelock |
|---|---|
| Fee parameter adjustment | 24 hours |
| Protocol upgrade (non-breaking) | 48 hours |
| Protocol upgrade (breaking / migration) | 7 days |
| Constitutional amendment | 14 days |
| MAQ membership change | 72 hours |

### §5 — MAQ Veto

The Multi-Admin Quorum may issue a **Quorum Veto** on any Ratified Proposal before Timelock expiry if:
- A supermajority of ≥ **two-thirds of current MAQ members** vote to veto, AND
- The veto cites a specific security, legal, or technical basis.

A vetoed Proposal returns to Stage 2 (Review Window) with a mandatory 14-day hold. A second veto on the same Proposal is not permitted; the Proposal must be materially amended and resubmitted as a new SIP.

---

## Article IV — Code of Conduct for Validators and Admins

### §1 — General Obligations (All Participants)

All Validators and Admins must:

1. Act in the best interest of the StellarStream Protocol and its users.
2. Disclose any financial interest, conflict of interest, or affiliation with parties affected by a Proposal before casting a governance vote or executing a MAQ action.
3. Maintain operational security standards for key management (hardware security modules or equivalent).
4. Respond to MAQ coordination requests within **48 hours** during normal operations and **4 hours** during declared emergencies.
5. Refrain from coordinating votes with other parties in exchange for compensation outside of publicly disclosed agreements.

### §2 — Validator-Specific Rules

| Rule | Requirement |
|---|---|
| **Uptime** | Maintain ≥ 99 % availability averaged over any 30-day rolling window. |
| **Software versioning** | Run a supported Protocol version within **72 hours** of a mandatory upgrade's enactment. |
| **Slashing compliance** | Accept and not contest slashing events adjudicated by the MAQ following the published slashing schedule. |
| **Governance participation** | Vote on or formally abstain from at least **80 %** of all Proposals in any calendar quarter. Falling below this threshold for two consecutive quarters triggers a **Validator Warning**. |
| **Node identity** | Operate nodes only under registered, on-chain identities; sock-puppet nodes constitute a punishable offense. |
| **Reporting** | Disclose any detected protocol anomaly, exploit, or vulnerability to the MAQ security channel within **2 hours** of discovery; public disclosure must wait until a patch is deployed or the MAQ grants clearance. |

### §3 — Admin-Specific Rules

| Rule | Requirement |
|---|---|
| **Key custody** | Private keys authorizing on-chain execution must be held in a hardware wallet or MPC setup; software-only custody is prohibited. |
| **Multi-sig threshold** | No on-chain action may be executed with fewer than the MAQ's current M-of-N threshold (minimum 3-of-5). |
| **Independent verification** | Each Admin must independently verify the bytecode or calldata of any transaction before signing, regardless of peer pressure or time constraints. |
| **Abstention from self-dealing** | Admins must recuse from MAQ votes on Proposals that directly benefit entities they hold equity or token positions in exceeding 1 % of circulating supply. |
| **Succession planning** | Each Admin must maintain an encrypted emergency key-recovery package with a designated, verified successor on record with the MAQ. |
| **Term limits** | Admin terms are **12 months**, renewable once consecutively. After two consecutive terms, a minimum 6-month cooling-off period applies before re-election. |

### §4 — Disciplinary Actions

Violations are classified by severity:

| Level | Examples | Consequence |
|---|---|---|
| **Warning** | Missing governance participation threshold, delayed response | Formal notice logged on-chain; remediation plan required within 7 days. |
| **Suspension** | Repeated warnings, minor key-custody breach | Role suspended for 30 days; VP frozen; MAQ vote required to reinstate. |
| **Removal** | Coordinated manipulation, self-dealing, critical security negligence | Permanent removal from role; stake slashed per published schedule; on-chain ban from future MAQ election for 24 months. |

Disciplinary proceedings require a MAQ majority vote and a **3-day notice period** during which the accused may submit a defense. Emergency removal (Article V) bypasses the notice period.

---

## Article V — Emergency Decommissioning Procedures

### §1 — Declaration of Emergency

An emergency exists when any of the following conditions are detected:

- Active exploitation of a critical Protocol vulnerability resulting in or threatening direct loss of user funds.
- Compromise of ≥ 1 Admin key or Validator node with evidence of malicious use.
- External legal injunction or regulatory order requiring immediate Protocol suspension.
- Consensus failure rendering the network unable to finalize transactions for > 2 hours.

An emergency may be declared by:
- Any **2 MAQ Admins** acting jointly, OR
- Any **3 Validators** submitting a co-signed on-chain emergency notice.

### §2 — Emergency Response Tiers

#### Tier 1 — Pause (Scoped)
- **Trigger:** Isolated vulnerability in a specific module.
- **Action:** MAQ executes a targeted `PAUSE` call on the affected contract(s).
- **Authorization:** 2-of-N MAQ signatures.
- **Duration:** Up to **48 hours** without community vote; extendable by community vote in 24-hour increments.
- **Notification:** Public disclosure within **1 hour** of pause execution.

#### Tier 2 — Full Protocol Halt
- **Trigger:** Systemic vulnerability or multi-module compromise.
- **Action:** MAQ executes a full `GLOBAL_PAUSE`; all streaming and governance transactions are suspended.
- **Authorization:** 3-of-N MAQ signatures (absolute majority of current MAQ size).
- **Duration:** Up to **7 days** without community vote.
- **Notification:** Public disclosure within **30 minutes**; emergency governance vote must be initiated within **24 hours**.

#### Tier 3 — Emergency Decommissioning
- **Trigger:** Unrecoverable state, irremediable exploit, or legal order mandating permanent shutdown.
- **Action:** MAQ executes `DECOMMISSION` — migrating user funds to a recovery contract and disabling all Protocol entry points.
- **Authorization:** 4-of-N MAQ signatures + ratification by emergency community vote (≥ 20 % quorum, ≥ 67 % approval, 24-hour voting window).
- **Fund Recovery:** Users may claim pro-rata recovery funds from the escrow contract for a minimum of **180 days** post-decommission.
- **Notification:** Public disclosure before or simultaneously with execution; no pre-announcement that could enable front-running.

### §3 — Emergency Governance Fast-Track

During an active emergency (Tier 1 or higher):

- The standard Proposal lifecycle (Article II) is suspended for emergency-response SIPs only.
- Emergency SIPs skip Stages 0–2 and enter Stage 3 (Voting) immediately.
- Voting period is compressed to **24 hours**.
- Quorum is reduced to **15 %**; approval threshold remains at **67 %**.
- The Timelock is waived; execution may proceed immediately upon passage.
- All emergency SIPs are automatically flagged for post-mortem review (Article II §6).

### §4 — Post-Emergency Reinstatement

After a Tier 1 or Tier 2 pause:
1. MAQ must publish a full incident report within **72 hours** of the pause being lifted.
2. A remediation SIP must pass standard governance before the paused functionality is re-enabled.
3. Any Admin or Validator implicated in causing the emergency is automatically suspended pending a disciplinary review (Article IV §4).

After Tier 3 Decommissioning:
1. The Protocol is considered permanently shut down unless a successor Protocol is established via a new constitutional process.
2. No MAQ member may unilaterally restart or fork the Protocol under the StellarStream brand without a new community vote under the successor governance framework.

---

## Article VI — Amendments to This Constitution

- Constitutional amendments require the thresholds defined in Article III §2–§3 (50 % quorum, 75 % approval).
- A minimum **30-day discussion period** (Stage 0) is mandatory before on-chain submission.
- No amendment may reduce the Timelock for constitutional changes below 7 days.
- No amendment may grant any single Admin or Validator unilateral authority over Protocol execution.

---

## Article VII — Ratification

This Constitution enters into force when:
1. It is passed via a constitutional amendment vote meeting the Article III thresholds.
2. The resulting governance contracts are deployed and verified on-chain.
3. A minimum of 3 MAQ Admins have signed the ratification transaction.

All prior informal governance norms are superseded by this document upon ratification.

---

*This document is maintained in the Folex1275/StellarStream repository. Proposed edits must follow the SIP process defined in Article II.*
