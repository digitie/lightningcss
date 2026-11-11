"""오래된 binary가 새 source를 대신 통과하지 못하는 감사 회귀."""
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location("gate", Path(__file__).with_name("check-native-css-source.py"))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
class SourceGateTests(unittest.TestCase):
    def test_fixture_only_allowed(self):
        gate.same_source({"src/a.rs": b"a", "fixtures/nativewind5/manifest": b"new"},
                         {"src/a.rs": b"a", "fixtures/nativewind5/manifest": b"old"})
    def test_only_fixed_ci_metadata_allowed(self):
        names = (".github/workflows/fixed-pack.yml", "scripts/check-native-css-source.py",
                 "scripts/test-native-css-source.py")
        old = {"src/a.rs": b"a", **{name: b"old" for name in names}}
        gate.same_source({**old, **{name: b"new" for name in names}}, old)
    def test_ci_metadata_neighbors_and_build_workflow_are_source(self):
        for name in (".github/workflows/build.yml", ".github/workflows/fixed-pack.yml.extra",
                     "scripts/check-native-css-source.py.extra", "scripts/pack-native-candidate.mjs",
                     "node/index.js"):
            with self.subTest(name=name), self.assertRaises(AssertionError):
                gate.same_source({name: b"new"}, {name: b"old"})
    def test_changes_fail(self):
        for name in ("src/a.rs", "Cargo.lock", "vendor/serde-content/src/de/mod.rs",
                     "wasm/import.meta.url-polyfill.js", "scripts/build-candidate-wasm.mjs"):
            with self.subTest(name=name), self.assertRaises(AssertionError):
                gate.same_source({name: b"new"}, {name: b"old"})
    def test_added_and_deleted_fail(self):
        for a, b in (({"src/a.rs": b"a"}, {}), ({}, {"src/a.rs": b"a"})):
            with self.assertRaises(AssertionError):
                gate.same_source(a, b)
    def test_rust_build_fingerprint(self):
        old = {"src/a.rs": b"a", "Cargo.lock": b"a", "vendor/serde-content/tests/a.rs": b"a"}
        for name in old:
            self.assertNotEqual(gate.rust_digest(old), gate.rust_digest({**old, name: b"new"}))
        self.assertEqual(gate.rust_digest(old), gate.rust_digest({**old, "wasm/a.js": b"new"}))
if __name__ == "__main__":
    unittest.main()
