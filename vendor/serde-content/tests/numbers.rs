#![cfg(feature = "derive")]

extern crate alloc;

use core::fmt;
use serde::Deserialize;
use serde_content::Deserializer;
use serde_content::Error;
use serde_content::Expected;
use serde_content::Found;
use serde_content::Number;
use serde_content::Serializer;

fn assert_ok<T>(deserializer: Deserializer<'static>)
where
    T: Deserialize<'static> + Into<Number> + fmt::Debug,
{
    deserializer.deserialize::<T>().unwrap();
}

fn assert_err<T>(deserializer: Deserializer<'static>, found: Found, expected: Expected)
where
    T: Deserialize<'static> + fmt::Debug,
{
    let error = deserializer.deserialize::<T>().unwrap_err();
    let expected = Error::unexpected(found, expected);
    assert_eq!(error, expected);
}

macro_rules! range {
    ($src:ident as $dest:ty) => {
        (($src::MIN as $dest)..=($src::MAX as $dest))
    };
}

#[test]
fn coerce_i8() {
    let serializer = Serializer::new();
    for v in [i8::MIN, 0, i8::MAX] {
        let value = serializer.serialize(v).unwrap();
        let deserializer = Deserializer::new(value);
        // Conversion between different number types is not supported by default.
        assert_err::<u8>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::U8,
        );
        assert_err::<i16>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::I16,
        );
        assert_err::<u16>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::U16,
        );
        assert_err::<i32>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::I32,
        );
        assert_err::<f32>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::F32,
        );
        assert_err::<u32>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::U32,
        );
        assert_err::<i64>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::I64,
        );
        assert_err::<f64>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::F64,
        );
        assert_err::<u64>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::U64,
        );
        assert_err::<i128>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::I128,
        );
        assert_err::<u128>(
            deserializer.clone(),
            Found::Number(Number::I8(v)),
            Expected::U128,
        );
        // Enable number coercion.
        let deserializer = deserializer.coerce_numbers();
        assert_ok::<i16>(deserializer.clone());
        assert_ok::<i32>(deserializer.clone());
        assert_ok::<f32>(deserializer.clone());
        assert_ok::<i64>(deserializer.clone());
        assert_ok::<f64>(deserializer.clone());
        assert_ok::<i128>(deserializer.clone());
        if v < 0 {
            assert_err::<u8>(
                deserializer.clone(),
                Found::Number(Number::I8(v)),
                Expected::U8,
            );
            assert_err::<u16>(
                deserializer.clone(),
                Found::Number(Number::I8(v)),
                Expected::U16,
            );
            assert_err::<u32>(
                deserializer.clone(),
                Found::Number(Number::I8(v)),
                Expected::U32,
            );
            assert_err::<u64>(
                deserializer.clone(),
                Found::Number(Number::I8(v)),
                Expected::U64,
            );
            assert_err::<u128>(
                deserializer.clone(),
                Found::Number(Number::I8(v)),
                Expected::U128,
            );
            assert_err::<u128>(deserializer, Found::Number(Number::I8(v)), Expected::U128);
        } else {
            assert_ok::<u8>(deserializer.clone());
            assert_ok::<u16>(deserializer.clone());
            assert_ok::<u32>(deserializer.clone());
            assert_ok::<u64>(deserializer.clone());
            assert_ok::<u128>(deserializer);
        }
    }
}

#[test]
fn coerce_u8() {
    let serializer = Serializer::new();
    for v in [u8::MIN, 0, u8::MAX] {
        let value = serializer.serialize(v).unwrap();
        let deserializer = Deserializer::new(value);
        assert_err::<i8>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I8,
        );
        assert_err::<i16>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I16,
        );
        assert_err::<u16>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::U16,
        );
        assert_err::<i32>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I32,
        );
        assert_err::<f32>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::F32,
        );
        assert_err::<u32>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::U32,
        );
        assert_err::<i64>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I64,
        );
        assert_err::<i64>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I64,
        );
        assert_err::<f64>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::F64,
        );
        assert_err::<u64>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::U64,
        );
        assert_err::<i128>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::I128,
        );
        assert_err::<u128>(
            deserializer.clone(),
            Found::Number(Number::U8(v)),
            Expected::U128,
        );
        let deserializer = deserializer.coerce_numbers();
        if v <= (i8::MAX as u8) {
            assert_ok::<i8>(deserializer.clone());
        } else {
            assert_err::<i8>(
                deserializer.clone(),
                Found::Number(Number::U8(v)),
                Expected::I8,
            );
        }
        assert_ok::<i16>(deserializer.clone());
        assert_ok::<u16>(deserializer.clone());
        assert_ok::<i32>(deserializer.clone());
        assert_ok::<f32>(deserializer.clone());
        assert_ok::<u32>(deserializer.clone());
        assert_ok::<i64>(deserializer.clone());
        assert_ok::<f64>(deserializer.clone());
        assert_ok::<u64>(deserializer.clone());
        assert_ok::<i128>(deserializer.clone());
        assert_ok::<u128>(deserializer);
    }
}

#[test]
fn coerce_i16() {
    let serializer = Serializer::new();
    for v in [i16::MIN, 0, i16::MAX] {
        let value = serializer.serialize(v).unwrap();
        let deserializer = Deserializer::new(value);
        assert_err::<i8>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::I8,
        );
        assert_err::<u8>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::U8,
        );
        assert_err::<u16>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::U16,
        );
        assert_err::<i32>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::I32,
        );
        assert_err::<f32>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::F32,
        );
        assert_err::<u32>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::U32,
        );
        assert_err::<i64>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::I64,
        );
        assert_err::<f64>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::F64,
        );
        assert_err::<u64>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::U64,
        );
        assert_err::<i128>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::I128,
        );
        assert_err::<u128>(
            deserializer.clone(),
            Found::Number(Number::I16(v)),
            Expected::U128,
        );
        let deserializer = deserializer.coerce_numbers();
        if range!(i8 as i16).contains(&v) {
            assert_ok::<i8>(deserializer.clone());
        } else {
            assert_err::<i8>(
                deserializer.clone(),
                Found::Number(Number::I16(v)),
                Expected::I8,
            );
        }
        if range!(u8 as i16).contains(&v) {
            assert_ok::<u8>(deserializer.clone());
        } else {
            assert_err::<u8>(
                deserializer.clone(),
                Found::Number(Number::I16(v)),
                Expected::U8,
            );
        }
        assert_ok::<i32>(deserializer.clone());
        assert_ok::<f32>(deserializer.clone());
        assert_ok::<i64>(deserializer.clone());
        assert_ok::<f64>(deserializer.clone());
        assert_ok::<i128>(deserializer.clone());
        if v < 0 {
            assert_err::<u16>(
                deserializer.clone(),
                Found::Number(Number::I16(v)),
                Expected::U16,
            );
            assert_err::<u32>(
                deserializer.clone(),
                Found::Number(Number::I16(v)),
                Expected::U32,
            );
            assert_err::<u64>(
                deserializer.clone(),
                Found::Number(Number::I16(v)),
                Expected::U64,
            );
            assert_err::<u128>(deserializer, Found::Number(Number::I16(v)), Expected::U128);
        } else {
            assert_ok::<u16>(deserializer.clone());
            assert_ok::<u32>(deserializer.clone());
            assert_ok::<u64>(deserializer.clone());
            assert_ok::<u128>(deserializer);
        }
    }
}

#[test]
fn coerce_f32() {
    let serializer = Serializer::new();
    for v in [f32::MIN, 0.0, f32::MAX] {
        let value = serializer.serialize(v).unwrap();
        let deserializer = Deserializer::new(value);
        assert_err::<f64>(
            deserializer.clone(),
            Found::Number(Number::F32(v)),
            Expected::F64,
        );
        let deserializer = deserializer.coerce_numbers();
        assert_ok::<f64>(deserializer);
    }
}

#[test]
fn coerce_f64() {
    let serializer = Serializer::new();
    for v in [f64::MIN, 0.0, f64::MAX] {
        let value = serializer.serialize(v).unwrap();
        let deserializer = Deserializer::new(value);
        assert_err::<f32>(
            deserializer.clone(),
            Found::Number(Number::F64(v)),
            Expected::F32,
        );
        let deserializer = deserializer.coerce_numbers();
        if range!(f32 as f64).contains(&v) {
            assert_ok::<f32>(deserializer.clone());
        } else {
            assert_err::<f32>(
                deserializer.clone(),
                Found::Number(Number::F64(v)),
                Expected::F32,
            );
        }
    }
}

#[test]
fn coerce_f64_nonfinite() {
    use serde_content::Value;
    for value in [f64::INFINITY, f64::NEG_INFINITY, f64::NAN] {
        let deserializer = Deserializer::new(Value::Number(Number::F64(value)));
        assert!(deserializer.clone().deserialize::<f32>().is_err());
        let actual: f32 = deserializer.coerce_numbers().deserialize().unwrap();
        if value.is_nan() {
            assert!(actual.is_nan());
        } else {
            assert_eq!(actual, value as f32);
        }
    }
}

#[test]
fn coerce_large_integer_floats() {
    use serde_content::Value;
    for number in [
        Number::I64(100000),
        Number::I64(i64::MIN),
        Number::I64(i64::MAX),
        Number::U64(u64::MAX),
        Number::I128(i128::MIN),
        Number::I128(i128::MAX),
    ] {
        let value = match number {
            Number::I64(value) => value as f64,
            Number::U64(value) => value as f64,
            Number::I128(value) => value as f64,
            _ => unreachable!(),
        };
        let deserializer = Deserializer::new(Value::Number(number));
        assert!(deserializer.clone().deserialize::<f32>().is_err());
        assert_eq!(
            deserializer
                .clone()
                .coerce_numbers()
                .deserialize::<f32>()
                .unwrap(),
            value as f32
        );
        assert_eq!(
            deserializer.coerce_numbers().deserialize::<f64>().unwrap(),
            value
        );
    }
    let too_large = Deserializer::new(Value::Number(Number::U128(u128::MAX))).coerce_numbers();
    assert!(too_large.clone().deserialize::<f32>().is_err());
    assert_eq!(too_large.deserialize::<f64>().unwrap(), u128::MAX as f64);
}
