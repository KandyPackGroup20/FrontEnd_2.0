import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = await readFile(new URL('../app/warehouse/page.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const loaded = { exports: {} };
const resolve = (name) => {
  if (name === '@/lib/api') return {};
  if (name.startsWith('@/components/')) return { default: ({ children }) => React.createElement('div', null, children) };
  return require(name);
};
new Function('require', 'module', 'exports', code)(resolve, loaded, loaded.exports);

test('warehouse initial render exposes no fabricated employee or seed station selection', () => {
  const html = renderToStaticMarkup(React.createElement(loaded.exports.default));
  assert.match(html, /Loading account/);
  assert.match(html, /Select assigned station/);
  assert.doesNotMatch(html, /Sunil Colombo|store\.colombo@|<option value="1">Colombo/);
});

test('warehouse renders labelled stock search and native adjustment dialog with damage reasons', () => {
  const html = renderToStaticMarkup(React.createElement(loaded.exports.default));
  assert.match(html, /id="stock-search"/);
  assert.match(html, /<dialog[^>]*aria-labelledby="adjust-title"/);
  assert.match(html, /id="adjust-product"/);
  assert.match(html, /id="adjust-qty"/);
  for (const reason of ['DAMAGED','LOST','EXPIRED']) assert.match(html, new RegExp(`<option value="${reason}"`));
});
