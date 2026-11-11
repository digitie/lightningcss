# Source provenance

Upstream: https://github.com/rushmorem/serde-content
Base: bb5066da57fb0d76a981dbbef04b68f2aff90a3f (crate version 0.1.2)
Fix: 388acbdd7d235821a54b2e306ce61f53e3e942f9
Branch: fix/null-option-roundtrip

The fix adds opt-in Deserializer::coerce_unit_to_none(), retaining default
Some(()) semantics. Lightning CSS enables this at buffered AST deserialization
boundaries to match serde_json/N-API null handling.

This checked-in source makes the candidate build independent of an unpublished
crate or a local checkout. Keep both upstream license files. Once this API is
released upstream, replace the path patch with that registry release.
