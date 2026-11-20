/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript test loader. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const compiled = { exports: {} };
  function resolve(id) {
    if (id in mocks) return mocks[id];
    const local = id.startsWith('@/') ? path.join('src', id.slice(2)) : id.startsWith('.') ? path.join(path.dirname(file), id) : null;
    if (local && fs.existsSync(local + '.ts')) return load(local + '.ts', mocks);
    return require(id);
  }
  new Function('require', 'module', 'exports', source)(resolve, compiled, compiled.exports);
  return compiled.exports;
}
module.exports = { load };
