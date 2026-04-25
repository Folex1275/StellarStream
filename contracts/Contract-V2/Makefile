WASM      := target/wasm32v1-none/release/stellarstream_contracts_v2.wasm
SPEC_OUT  := ../../docs/specs/stellar_stream_v2.json

default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l $(WASM)
	$(MAKE) spec

# ── Issue #406 — WASM Interface Generator ────────────────────────────────────
# Extract the Soroban contract spec embedded in the WASM and write it as JSON
# to docs/specs/ for frontend/backend consumption.  Runs automatically after
# every `make build`; can also be invoked standalone with `make spec`.
spec: $(WASM)
	@mkdir -p ../../docs/specs
	stellar contract inspect \
	    --wasm $(WASM) \
	    --output json \
	    > $(SPEC_OUT)
	@echo "Spec written to $(SPEC_OUT)"

fmt:
	cargo fmt --all

clean:
	cargo clean
