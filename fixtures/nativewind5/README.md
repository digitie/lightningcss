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

기존 CodSpeed 성능 서비스는 원 저장소에서만 실행한다. 이 fork의 변경은 외부 성능 서비스 연결을 요구하지 않으며 기능 검증은 별도 고정 배포물 CI가 수행한다. fix.4는 현재 source archive와 별도로 native/raw WASM의 실제 빌드 revision 684c528b2d16c581c99cf829f9a4988985488d5f를 기록한다. Rust/Cargo/serde vendor 입력 전체 digest가 같을 때만 기존 binary를 재사용한다. JS adapter는 수정한 현재 helper로 다시 번들하며 입력·출력 receipt를 동봉한다. 소스가 달라지면 pack/manifest를 함께 교체해야 한다.

release/1.33.0 PR의 source-gate는 현재 checkout(시험 fixture와 고정 호스트 CI·검증기 metadata만 제외), 동봉 git archive, Rust 빌드 입력, JS adapter receipt, binary hash를 자동 대조한다. 이어 정확한 checkout의 LightningCSS test_serde, vendored serde integration suite 및 doctest를 경고 완화 없이 실행한다. vendor의 기존 unit mock dead-code 경고를 숨기지 않으며, 이 gate가 upstream unit 전체 실행이라고 주장하지 않는다. 별도 serde fork의 전체 unit gate는 그 fork의 정확 SHA에서 관리한다.

MIT 고지는 고정 napi-wasm package.json의 author/license 선언과 허가·조건·면책 전문을 포함한다. 상류가 제공하지 않은 copyright 연도/권리자는 추정하지 않는다. source vendor와 npm wasm 디렉터리에 같은 고지 및 package.json을 제공한다.

WASM 회귀는 package를 symlink 대신 공백, #, %, 복합 경로에 실제 복사해 강제 WASM require와 visitor를 실행한다. .gitattributes는 fixture vendor의 역사 tgz만 git archive에서 제외하며 Rust/Cargo/vendor/wasm/build scripts는 보존한다.


## macOS 호스트 공급 부족과 CI metadata

2026-11-11 정확748의 macOS15 arm64 job은 두 시도에서 hosted runner를 받지 못해 실행 전 취소됐다. GitHub check annotation의 공급 부족 공지와 공식 runner-images 목록을 확인하고 같은 macOS15의 macos-15-intel 호스트로 바꿔 동일 pack·Node90·IR8·특수 경로 검사를 실행한다. 기존 취소를 성공으로 표시하지 않는다.

source gate의 metadata 분리는 정확히 .github/workflows/fixed-pack.yml 및 그 검증기·회귀 Python 두 파일에 한정한다. 각 변경 전후 SHA256을 출력하며, 다른 빌드 workflow·Cargo/Rust/vendor·JS loader/adapter·pack/build 스크립트는 동봉 source와 계속 byte 대조한다. Rust 빌드 입력·실제 binary hash·adapter receipt 검사도 유지한다. CI 호스트 선택 때문에 실행 코드가 같은 배포물을 다른 bytes로 재발행하지 않는다. 근거: https://github.com/actions/runner-images#available-images
