#!/usr/bin/env python3
"""현재 checkout, 대응 source archive, 재사용 빌드와 adapter receipt를 함께 감사한다."""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parent.parent
def digest(data):
    return hashlib.sha256(data).hexdigest()
def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)
def files_in(data):
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        result = {}
        for member in archive.getmembers():
            assert not member.issym() and not member.islnk(), member.name
            if member.isfile():
                assert member.name not in result, member.name
                result[member.name] = archive.extractfile(member).read()
        return result
def rust_file(name):
    return (name.endswith(".rs") or Path(name).name in ("Cargo.toml", "Cargo.lock")
            or name.startswith((".cargo/", "vendor/serde-content/"))
            or name == "rust-toolchain.toml")
def rust_digest(files):
    return digest("".join(name + "\0" + digest(files[name]) + "\n"
                          for name in sorted(files) if rust_file(name)).encode())
def same_source(current, archived):
    # fixture-only metadata changes after packaging do not change corresponding source.
    relevant = lambda files: {n: v for n, v in files.items()
                              if not n.startswith("fixtures/nativewind5/")}
    a, b = relevant(current), relevant(archived)
    assert a.keys() == b.keys(), "source file set drift: " + str(a.keys() ^ b.keys())
    for name in a:
        assert a[name] == b[name], "source bytes drift: " + name

def main():
    fixture = ROOT / "fixtures/nativewind5"
    manifest = json.loads((fixture / "fixed-pack-manifest-fix4.json").read_text())
    packed = (fixture / "vendor" / manifest["file"]).read_bytes()
    assert digest(packed) == manifest["sha256"], "pack digest mismatch"
    package = files_in(packed)
    provenance = json.loads(package["package/NATIVE-FIX-PROVENANCE.json"])
    assert provenance == manifest["provenance"], "manifest provenance drift"
    archive = package["package/native-source.tar.gz"]
    assert digest(archive) == provenance["sourceSHA256"]
    # Require the declared committed source, not a hand-edited archive.
    assert archive == git("archive", "--format=tar.gz", provenance["revision"]), "archive != committed revision"
    archived = files_in(archive)
    names = git("ls-files", "-z").decode().strip("\0").split("\0")
    current = {name: (ROOT / name).read_bytes() for name in names}
    same_source(current, archived)
    assert not any(n.startswith("fixtures/nativewind5/vendor/") and n.endswith(".tgz")
                   for n in archived), "recursive historical binary in source archive"
    rust = rust_digest(current)
    assert rust == rust_digest(archived) == provenance["rustInputSHA256"]
    lineage = json.loads(current["vendor/nativecss-reused-build.json"])
    assert lineage == provenance["nativeBuild"]
    built_names = git("ls-tree", "-r", "--name-only", lineage["revision"]).decode().splitlines()
    built = {n: git("show", lineage["revision"] + ":" + n) for n in built_names if rust_file(n)}
    assert rust == rust_digest(built), "Rust changed without rebuilding binary lineage"
    assert digest(package["package/lightningcss.linux-x64-gnu.node"]) == lineage["binarySHA256"] == provenance["binarySHA256"]
    assert digest(package["package/wasm/lightningcss_node.wasm"]) == lineage["wasmSHA256"] == provenance["wasmSHA256"]
    receipt = json.loads(package["package/wasm/ADAPTER-BUILD.json"])
    assert receipt == provenance["adapterBuild"]
    assert receipt["rawWasmSHA256"] == lineage["rawWasmSHA256"]
    for name, expected in receipt["inputs"].items():
        assert digest(current[name]) == expected, "adapter input drift: " + name
    assert digest(package["package/wasm/wasm-node.cjs"]) == receipt["adapterSHA256"] == provenance["adapterSHA256"]
    assert receipt["wasmSHA256"] == provenance["wasmSHA256"]
    assert digest(current["Cargo.lock"]) == provenance["cargoLockSHA256"]
    notice = current["vendor/napi-wasm-NOTICE"]
    assert b"Permission is hereby granted" in notice and b"THE SOFTWARE IS PROVIDED" in notice
    assert package["package/wasm/NAPI-WASM-NOTICE"] == notice
    assert package["package/wasm/napi-wasm-package.json"] == current["vendor/napi-wasm-package.json"]
    print(json.dumps({"gate": "PASS", "sourceFiles": len(archived), "rustInputSHA256": rust,
                      "pack": manifest["file"], "revision": provenance["revision"]}, indent=2))
if __name__ == "__main__":
    main()
