// Build inputs shared by packaging and its audit receipt.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
export const adapterInputs = [
  'wasm/wasm-node.mjs', 'wasm/async.mjs', 'wasm/import.meta.url-polyfill.js',
  'node/browserslistToTargets.js', 'node/flags.js', 'node/composeVisitors.js',
  'scripts/build-candidate-wasm.mjs', 'scripts/native-css-inputs.mjs',
  'vendor/napi-wasm-NOTICE', 'vendor/napi-wasm-package.json',
];
export const inputHashes = root => Object.fromEntries(adapterInputs.map(name => [name, sha256(fs.readFileSync(path.join(root, name)))]));
export function rustInputs(root, revision) {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', revision], {cwd: root, encoding: 'utf8'}).trim().split('\n')
    .filter(name => name.endsWith('.rs') || /(^|\/)Cargo\.(toml|lock)$/.test(name) || name.startsWith('.cargo/') || name.startsWith('vendor/serde-content/') || name === 'rust-toolchain.toml');
  return sha256(files.sort().map(name => name + '\0' + sha256(execFileSync('git', ['show', revision + ':' + name], {cwd: root})) + '\n').join(''));
}
