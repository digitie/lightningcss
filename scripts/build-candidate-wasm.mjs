// Build the existing upstream Node WASM adapter into a self-contained CJS module.
// Usage: node scripts/build-candidate-wasm.mjs raw.wasm output-directory
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [input, destination] = process.argv.slice(2);
if (!input || !destination) throw new Error('Expected raw WASM file and output directory');
const out = path.resolve(destination);
fs.mkdirSync(out, {recursive: true});
for (const name of ['wasm-node.mjs', 'async.mjs', 'import.meta.url-polyfill.js']) {
  fs.copyFileSync(path.join(root, 'wasm', name), path.join(out, name));
}
for (const [name, from, to] of [
  ['browserslistToTargets.js', 'module.exports = browserslistToTargets;', 'export {browserslistToTargets};'],
  ['flags.js', 'exports.Features =', 'export const Features ='],
  ['composeVisitors.js', 'module.exports = composeVisitors', 'export {composeVisitors}'],
]) {
  fs.writeFileSync(path.join(out, name), fs.readFileSync(path.join(root, 'node', name), 'utf8').replace(from, to));
}
execFileSync(process.env.WASM_OPT || 'wasm-opt', [
  path.resolve(input), '--asyncify',
  '--pass-arg=asyncify-imports@env.await_promise_sync',
  '-Oz', '-o', path.join(out, 'lightningcss_node.wasm'),
], {stdio: 'inherit'});
await esbuild.build({
  entryPoints: [path.join(out, 'wasm-node.mjs')],
  outfile: path.join(out, 'wasm-node.cjs'),
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  nodePaths: [path.join(root, 'node_modules')],
  legalComments: 'eof',
  inject: [path.join(out, 'import.meta.url-polyfill.js')],
  define: {'import.meta.url': 'import_meta_url'},
});
fs.copyFileSync(path.join(root, 'vendor/napi-wasm-NOTICE'), path.join(out, 'NAPI-WASM-NOTICE'));
console.log('Bundled patched WASM:', path.join(out, 'wasm-node.cjs'));
