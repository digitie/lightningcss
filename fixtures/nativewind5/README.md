# NativeWind 5 / Lightning CSS 1.33.0 visitor regression

The pure Lightning CSS reproduction does not import React, Metro or NativeWind.

- Registry 1.33.0: node fixtures/nativewind5/reproduce.cjs /path/to/lightningcss --expect-failure
- Fixed native build: node fixtures/nativewind5/reproduce.cjs /path/to/fixed/lightningcss
- Registry 1.30.1 passes the same fixture without the last flag.

Null fields such as Variable.name.from and EnvironmentVariable.fallback
become Value::Unit when buffered from N-API. The serde-content default interprets
that as Some(Unit), although N-API and JSON interpret it as None.
The opt-in coercion preserves that distinction without altering the default
serde-content behavior or the CSS visitor API.

Build from this committed source with: cargo build --locked --release -p lightningcss_node
Use CARGO_TARGET_DIR outside the checkout when storage is limited.
Run: cargo test --locked --lib --test test_serde --features serde
Run the Node tests against the newly built native binary.
WASM and non-Linux host binaries require separate builds and validation.

node scripts/pack-native-candidate.mjs /path/to/liblightningcss_node.so /output
creates one platform-restricted review tarball with its embedded binary, source
archive and commit/hash provenance. The candidate requires a clean committed tree.
