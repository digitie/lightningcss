
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const appRequire = createRequire(path.join(process.env.NATIVE_FIX_CONSUMER_ROOT || __dirname, 'package.json'));
const enginePath = path.dirname(appRequire.resolve('react-native-css/package.json'));
const {lightningcssLoader} = appRequire(path.join(enginePath, 'dist/commonjs/compiler/lightningcss-loader.js'));
const {compile} = appRequire('react-native-css/compiler');
const selected = appRequire.resolve('lightningcss', {paths: [path.dirname(appRequire.resolve('@expo/metro-config/package.json'))]});
const selectedMeta = JSON.parse(fs.readFileSync(path.resolve(path.dirname(selected), '../package.json')));
assert.equal(selectedMeta.version, process.env.NATIVE_FIX_EXPECTED_VERSION || '1.33.0+nativecss.fix.4');
assert.equal(lightningcssLoader().lightningcss, appRequire(selected).transform);
console.log('ACTUAL EXPO ENGINE RESOLUTION', selected, selectedMeta.version, selectedMeta.nativeFix, appRequire(selected).nativeFixBackend);
const cases = {
 color: '.x{color:red}',
 rem: '.x{padding:1rem}',
 unresolved: '.x{color:var(--color)}',
 variables: ':root{--s:.25rem}.x{padding:calc(var(--s)*4)}',
 property: '@property --x{syntax:"*";inherits:false;initial-value:0}.x{translate:var(--x)}',
 env: '.x{padding:env(safe-area-inset-top)}',
 nativeMapping: '.x{color:red;@nativeMapping color:color;}',
 app: fs.readFileSync(path.join(__dirname, 'compiler-regression.css'), 'utf8'),
};
const all = {};
for (const [name, css] of Object.entries(cases)) {
 const compiled = compile(css, {filename:'nativewind-repro.css',logger:()=>{}});
 const value = compiled.stylesheet();
 assert.ok(value && typeof value === 'object');
 all[name] = value;
 console.log('PASS', name, Buffer.byteLength(css), 'bytes', JSON.stringify(value).length, 'compiled bytes', JSON.stringify(compiled.warnings()));
}
assert.ok(JSON.stringify(all.rem).includes('14'), 'rem conversion is preserved');
assert.ok(all.app.s?.length > 0, 'real CSS must produce native style rules');
fs.writeFileSync(path.join(__dirname,'compiled-results.json'), JSON.stringify(all,null,2)+'\n');

fs.writeFileSync(path.join(__dirname,'compiled-results.bin'), require('node:v8').serialize(all));
