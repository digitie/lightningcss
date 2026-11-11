# Source provenance

Upstream: https://github.com/rushmorem/serde-content
Base: bb5066da57fb0d76a981dbbef04b68f2aff90a3f (crate version 0.1.2)
Fixes: 388acbdd7d235821a54b2e306ce61f53e3e942f9 (null options),
36ad1e7c9fd2446aca9b5c72a8dd15bfddca1be5 (non-finite numeric coercion)
Branch: fix/null-option-roundtrip

The fix adds opt-in Deserializer::coerce_unit_to_none(), retaining default
Some(()) semantics. Lightning CSS enables this at buffered AST deserialization
boundaries to match serde_json/N-API null handling.

This checked-in source makes the candidate build independent of an unpublished
crate or a local checkout. Keep both upstream license files. Once this API is
released upstream, replace the path patch with that registry release.

The numeric fix also permits IEEE Infinity and NaN when coercing f64 to f32,
while continuing to reject finite values outside the representable f32 range.

Large integer to float coercion: 67fe4a9c5b4595433a731b70dbe31412721bea8c.
When explicitly coercing numbers, integer-to-float casts follow the floating
point range rather than the source integer width. Integer-target checks and
finite overflow checks remain enabled.
