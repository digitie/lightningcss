// SPDX-License-Identifier: MPL-2.0
// SPDX-FileCopyrightText: 2026 Youn-sok Choi (digitie)
// 전달 pack을 호스트별로 실행하고 기존 정상 compiler의 전체 IR과 비교한다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fixture = __dirname;
const root = path.resolve(fixture, '../..');
const manifest = require('./fixed-pack-manifest-fix4.json');
const packed = path.join(fixture, 'vendor', manifest.file);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(packed)).digest('hex'), manifest.sha256);
function run(command, args, env = process.env, cwd = fixture) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  assert.equal(result.status, 0, command + ' 실행 실패');
  return result.stdout;
}
const stage = fs.mkdtempSync(path.join(fixture, '.packed-runtime-'));
try {
  run('tar', ['-xzf', packed, '-C', stage]);
  const packageRoot = path.join(stage, 'package');
  const provenance = JSON.parse(fs.readFileSync(path.join(packageRoot, 'NATIVE-FIX-PROVENANCE.json')));
  assert.equal(provenance.revision, manifest.provenance.revision);
  for (const [file, expected] of [
    ['native-source.tar.gz', provenance.sourceSHA256],
    ['lightningcss.linux-x64-gnu.node', provenance.binarySHA256],
    ['wasm/lightningcss_node.wasm', provenance.wasmSHA256],
  ]) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(packageRoot, file))).digest('hex'), expected);
  require('./test-special-paths.cjs')(packageRoot, stage);
  fs.cpSync(path.join(root, 'node/test'), path.join(packageRoot, 'node/test'), { recursive: true });
  const modes = process.platform === 'linux' ? ['auto', 'wasm'] : ['auto'];
  for (const mode of modes) {
    const env = { ...process.env, LIGHTNINGCSS_FORCE_WASM: mode === 'wasm' ? '1' : '0', TEST_WASM: '' };
    console.log('호스트 및 경로:', process.platform, process.arch, mode);
    const output = run(process.execPath, [path.join(fixture, 'node_modules/uvu/bin.js'), path.join(packageRoot, 'node/test')], env, root);
    const plain = output.replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(plain, /Total:\s+90/);
    assert.match(plain, /Passed:\s+90/);
    assert.match(plain, /Skipped:\s+0/);
    run(process.execPath, ['verify.cjs'], env);
    run(process.execPath, ['compare-ir.cjs', 'baseline-compiled-results.bin', 'compiled-results.bin'], env);
    run(process.execPath, [path.join(fixture, 'reproduce.cjs'), packageRoot], env);
  }
} finally {
  assert.equal(path.dirname(stage), fixture);
  fs.rmSync(stage, { recursive: true, force: true });
}
