const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
module.exports = function testSpecialPaths(packageRoot, stage) {
  for (const name of ['space path', 'hash#path', 'percent%path', 'combined # % path']) {
    const target = path.join(stage, name);
    fs.cpSync(packageRoot, target, {recursive: true});
    const result = spawnSync(process.execPath, ['-e',
      'const assert=require("node:assert/strict"); const css=require(process.argv[1]);' +
      'assert.equal(css.nativeFixBackend,"wasm");' +
      'assert.match(css.transform({filename:"x.css",code:Buffer.from(".x{color:var(--x)}"),visitor:{Rule:r=>r}}).code.toString(),/var/);',
      target], {env: {...process.env, LIGHTNINGCSS_FORCE_WASM: '1'}, encoding: 'utf8'});
    assert.equal(result.status, 0, name + ': ' + result.stderr);
    fs.rmSync(target, {recursive: true, force: true});
    console.log('Physical WASM path PASS:', name);
  }
};
