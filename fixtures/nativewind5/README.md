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
The candidate also includes the same patched Rust source compiled to WASM.
Non-Linux hosts and LIGHTNINGCSS_FORCE_WASM=1 use the bundled synchronous
upstream Node WASM adapter. Actual macOS/Windows/EAS runs remain integration checks.

node scripts/build-candidate-wasm.mjs /path/to/raw.wasm /built-wasm
node scripts/pack-native-candidate.mjs /path/to/liblightningcss_node.so /output /built-wasm
creates one portable review tarball with its embedded native and WASM binaries, source
archive and commit/hash provenance. The candidate requires a clean committed tree.

The second regression is Tailwind rounded-full: border-radius:calc(infinity * 1px).
Non-finite floats must survive f64-to-f32 numeric coercion. Finite overflow remains an error.

Large integral values (for example border-radius:100000px) must also survive
numeric coercion, including the second visitor pass after infinity is printed.

## 고정 배포물의 호스트 검증

vendor의 수정 후보와 manifest는 동일한 파일 해시를 고정한다. npm ci 후 npm test는 전달 pack을 실제로 추출하고 Node 전체90개·최소 재현·Expo resolver·앱과 독립적인 합성 CSS의 compiler IR을 검증한다. Linux에서는 native와 강제 WASM을 각각 실행하며 macOS와 Windows에서는 해당 호스트의 자동 WASM 선택을 실제 실행한다. GitHub CI의 호스트별 실행 결과를 확인하기 전에는 그 호스트가 통과했다고 표시하지 않는다.

기존 CodSpeed 성능 서비스는 원 저장소에서만 실행한다. 이 fork의 변경은 외부 성능 서비스 연결을 요구하지 않으며 기능 검증은 별도 고정 배포물 CI가 수행한다. 고정 배포물의 Rust 소스 revision은 684c528b2d16c581c99cf829f9a4988985488d5f이며, 이후 CI/fixture 추가 커밋은 해당 실행 소스의 변경을 포함하지 않는다.
