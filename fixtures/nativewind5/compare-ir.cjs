const fs=require('node:fs'),v8=require('node:v8'),assert=require('node:assert/strict');
const [baselinePath,currentPath]=process.argv.slice(2);
if(!baselinePath || !currentPath) throw new Error('Usage: node compare-ir.cjs baseline.bin current.bin');
const baseline=v8.deserialize(fs.readFileSync(baselinePath));
const current=v8.deserialize(fs.readFileSync(currentPath));
assert.deepStrictEqual(current,baseline);
console.log('Full IR deepStrictEqual PASS:',Object.keys(current).length,'cases,',current.app.s.length,'app classes');
console.log('rounded-full:',JSON.stringify(current.app.s.find(([name])=>name==='rounded-full')));
