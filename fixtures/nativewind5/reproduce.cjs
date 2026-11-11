const assert = require('node:assert/strict');
const path = require('node:path');
const target = process.argv[2] ? path.resolve(process.argv[2]) : 'lightningcss';
const api = require(target);
const expectFailure = process.argv.includes('--expect-failure');
for (const css of [
  '.x { color: var(--color); }',
  '.x { border-radius: 100000px; }',
  '.rounded { border-radius: calc(infinity * 1px); }',
  '.x { padding: env(safe-area-inset-top); }',
  '@property --x { syntax: "*"; inherits: false; initial-value: 0; } .x { translate: var(--x); }',
]) {
  const options = {filename: 'nativewind-repro.css', code: Buffer.from(css)};
  const expected = api.transform(options).code.toString();
  for (const [name, visitor] of [
    ['Rule', {Rule: value => value}],
    ['StyleSheetExit', {StyleSheetExit: value => value}],
  ]) {
    if (expectFailure) {
      assert.throws(() => api.transform({...options, visitor}), /failed to deserialize/);
      console.log('EXPECTED FAILURE', name, css);
    } else {
      assert.equal(api.transform({...options, visitor}).code.toString(), expected);
      console.log('PASS', name, css);
    }
  }
}
