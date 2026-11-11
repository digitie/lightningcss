#[cfg(feature = "serde")]
use lightningcss::stylesheet::{ParserOptions, StyleSheet};

#[cfg(feature = "serde")]
#[test]
fn test_serde() {
  let code = r#"
    .foo {
      color: red;
    }
  "#;
  let (json, stylesheet) = {
    let stylesheet = StyleSheet::parse(code, ParserOptions::default()).unwrap();
    let json = serde_json::to_string(&stylesheet).unwrap();
    (json, stylesheet)
  };

  let deserialized: StyleSheet = serde_json::from_str(&json).unwrap();
  assert_eq!(&deserialized.rules, &stylesheet.rules);
}

#[cfg(feature = "serde")]
#[test]
fn test_serde_null_optional_fields() {
  for code in [
    ".x { color: var(--color); }",
    ".x { color: var(--color, var(--fallback)); }",
    ".x { padding: env(safe-area-inset-top); }",
    ".x { padding: env(--custom); }",
    r#"@property --x { syntax: "*"; inherits: false; initial-value: 0; } .x { translate: var(--x); }"#,
  ] {
    let (json, stylesheet) = {
      let stylesheet = StyleSheet::parse(code, ParserOptions::default()).unwrap();
      let json = serde_json::to_string(&stylesheet).unwrap();
      (json, stylesheet)
    };
    let deserialized: StyleSheet = serde_json::from_str(&json).unwrap();
    assert_eq!(
      deserialized.to_css(Default::default()).unwrap().code,
      stylesheet.to_css(Default::default()).unwrap().code,
      "{}",
      code
    );
  }
}
