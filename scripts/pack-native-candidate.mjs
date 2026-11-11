// Produce a single, source-traceable Linux x64 GNU review candidate.
// Usage: node scripts/pack-native-candidate.mjs /path/to/liblightningcss_node.so /output/directory
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [binary, output] = process.argv.slice(2);
if (!binary || !output) throw new Error('Expected native library path and output directory');
if (process.platform !== 'linux' || process.arch !== 'x64' || !process.report.getReport().header.glibcVersionRuntime) {
  throw new Error('This candidate requires a Linux x64 GNU build host');
}
if (execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {cwd: root, encoding: 'utf8'}).trim()) {
  throw new Error('Commit the source changes before packaging');
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'lightningcss-native-candidate-'));
fs.mkdirSync(path.join(stage, 'node'));
for (const name of fs.readdirSync(path.join(root, 'node'))) {
  if (/\.(js|mjs|ts|flow)$/.test(name)) fs.copyFileSync(path.join(root, 'node', name), path.join(stage, 'node', name));
}
for (const name of ['LICENSE', 'README.md']) fs.copyFileSync(path.join(root, name), path.join(stage, name));
const packageJSON = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
packageJSON.version = '1.33.0+nativecss.fix.1';
packageJSON.os = ['linux'];
packageJSON.cpu = ['x64'];
packageJSON.libc = ['glibc'];
delete packageJSON.devDependencies;
delete packageJSON.resolutions;
delete packageJSON.scripts;
delete packageJSON.napi;
delete packageJSON.optionalDependencies;
packageJSON.files = ['node/*.js', 'node/*.mjs', 'node/*.d.ts', 'node/*.flow', '*.node', 'NATIVE-FIX-PROVENANCE.json', 'native-source.tar.gz'];
packageJSON.nativeFix = {base: '1d680fa14e9a089c92dc0929f869d6757ae91c30', revision, target: 'x86_64-unknown-linux-gnu'};
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(packageJSON, null, 2) + '\n');
const entryPath = path.join(stage, 'node/index.js');
const entry = fs.readFileSync(entryPath, 'utf8');
const end = entry.indexOf('module.exports.transform =');
if (end === -1) throw new Error('Unrecognized native loader source');
// A platform-restricted review package owns exactly one binary and must not
// load a stock optional platform package from a consuming app's ancestors.
fs.writeFileSync(entryPath, 'const native = require("../lightningcss.linux-x64-gnu.node");\n\n' + entry.slice(end));
fs.copyFileSync(path.resolve(binary), path.join(stage, 'lightningcss.linux-x64-gnu.node'));
execFileSync('strip', ['--strip-unneeded', path.join(stage, 'lightningcss.linux-x64-gnu.node')]);
execFileSync('git', ['archive', '--format=tar.gz', '--output=' + path.join(stage, 'native-source.tar.gz'), revision], {cwd: root});
const provenance = {
  ...packageJSON.nativeFix,
  version: packageJSON.version,
  rustc: execFileSync(process.env.NATIVE_FIX_RUSTC || 'rustc', ['--version'], {encoding: 'utf8'}).trim(),
  binarySHA256: crypto.createHash('sha256').update(fs.readFileSync(path.join(stage, 'lightningcss.linux-x64-gnu.node'))).digest('hex'),
  sourceSHA256: crypto.createHash('sha256').update(fs.readFileSync(path.join(stage, 'native-source.tar.gz'))).digest('hex'),
  cargoLockSHA256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'Cargo.lock'))).digest('hex'),
  platformPolicy: 'Linux x64 glibc only; embedded binary; no optional-package fallback; other hosts require a separately rebuilt candidate.',
};
fs.writeFileSync(path.join(stage, 'NATIVE-FIX-PROVENANCE.json'), JSON.stringify(provenance, null, 2) + '\n');
fs.mkdirSync(path.resolve(output), {recursive: true});
const result = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', path.resolve(output)], {cwd: stage, encoding: 'utf8'}))[0];
fs.writeFileSync(path.join(path.resolve(output), 'pack-result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({file: path.join(path.resolve(output), result.filename), integrity: result.integrity, provenance, stage}, null, 2));
