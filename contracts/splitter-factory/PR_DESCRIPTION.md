# [Contract] Logic: White-Label Splitter Factory — Issue #707

## Summary

Implements a `SplitterFactory` contract that allows any address to deploy their own isolated, fully-owned instance of the `stellar_stream_v3` splitter contract in a single transaction. Closes #707.

---

## What Changed

**New crate: `contracts/splitter-factory/`**

```
splitter-factory/
├── Cargo.toml
├── FACTORY_GUIDE.md
└── src/
    ├── lib.rs      # Factory contract
    ├── types.rs    # SplitterInitArgs, SplitterDeployedEvent
    └── test.rs     # 7 tests
```

---

## Contract Design

### Storage (instance)

| Key | Type | Description |
|---|---|---|
| `"Admin"` | `Address` | Factory-level admin (protocol team) |
| `"WasmHash"` | `BytesN<32>` | Hash of the `stellar_stream_v3` WASM |

### Public Interface

| Function | Auth | Description |
|---|---|---|
| `initialize(admin, wasm_hash)` | `admin` | One-time setup. Panics if called twice. |
| `update_wasm_hash(new_hash)` | `admin` | Protocol-wide upgrade. Only affects future deployments. |
| `deploy_splitter(creator, salt, init_args) → Address` | `creator` | Deploys + initializes a child splitter. |
| `admin()` / `wasm_hash()` | — | View helpers. |

### Deployment Flow

```
creator calls deploy_splitter(creator, salt, init_args)
  │
  ├── env.deployer().with_address(creator, salt).deploy_v2(wasm_hash, ())
  │     └── deterministic child address = f(creator, salt)
  │
  ├── SplitterClient::new(&env, &child).initialize(creator, token, fee_bps, treasury, extra_admins)
  │     └── creator is set as the child's owner/sub-admin
  │
  └── env.events().publish(("deployed", creator), SplitterDeployedEvent { child_address, creator, salt })
```

### Key Design Decisions

- **`deploy_v2` with no constructor args** — initialization is a separate cross-contract call. This is the safe Soroban pattern; it avoids any reentrancy window during deployment.
- **`creator.require_auth()`** on `deploy_splitter` — prevents deploying on behalf of another address without their signature.
- **Event-based tracking** — `SplitterDeployedEvent` is emitted with `creator` as a topic, enabling off-chain indexers to build a full registry without any on-chain list storage (no unbounded storage growth).
- **`update_wasm_hash` is non-breaking** — existing child contracts are completely unaffected by a hash update. Only future deployments use the new WASM.

---

## Tests (7 total)

| Test | Covers |
|---|---|
| `test_deploy_returns_valid_address` | Factory deploys a child and returns a live contract address |
| `test_child_initialized_with_creator_as_owner` | Child has correct `owner`, `fee_bps`, and `treasury` after init |
| `test_different_salts_produce_different_addresses` | Salt uniqueness → address uniqueness |
| `test_update_wasm_hash_changes_hash` | Admin can upgrade the stored WASM hash |
| `test_double_initialize_panics` | Re-initialization is blocked |
| `test_wasm_hash_view` | `wasm_hash()` view returns correct value |
| `test_admin_view` | `admin()` view returns correct value |

Tests use an inline `MockSplitter` that implements the same `initialize` signature as `stellar_stream_v3`, allowing full assertion of the cross-contract initialization call without depending on the real child contract.

---

## Documentation

`FACTORY_GUIDE.md` covers:
- Architecture diagram
- Off-chain address pre-computation
- TypeScript integration example
- Full function reference
- DAO integration patterns (single treasury, per-department, white-label)
- Security notes
- Off-chain indexing via `getEvents`

---

## Checklist

- [x] Factory stores `wasm_hash` in instance storage
- [x] `update_wasm_hash` is admin-only
- [x] `deploy_splitter` uses `with_address(creator, salt)` for deterministic addressing
- [x] Child `initialize` is called immediately after deployment with `creator` as owner
- [x] `SplitterDeployedEvent` emitted for off-chain indexing
- [x] 7 tests — covers all 3 required scenarios plus edge cases
- [x] `FACTORY_GUIDE.md` written for third-party DAO integrators
- [x] No unbounded on-chain storage (event-based tracking only)
- [x] `cargo test` passes (verified locally)
