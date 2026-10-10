import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
async function load(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => dependencies[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports;
}
const helpers = await load('../lib/reports.ts');
const { default: ReportTable } = await load('../components/ReportTable.tsx', { '@/lib/reports': helpers });

test('report contracts reject wrong envelopes instead of displaying empty success', () => {
  assert.deepEqual(helpers.reportRows({ workforce_hours: [], week_start: '2026-11-02' }, 'workforce_hours'), []);
  for (const body of [null, [], { other: [] }, { workforce_hours: [null] }, { workforce_hours: [{ value: {} }] }]) {
    assert.throws(() => helpers.reportRows(body, 'workforce_hours'), /Invalid report/);
  }
});

test('search and numeric sort preserve original rows', () => {
  const rows = [{ name: 'Tea Colombo', value: 20 }, { name: 'Tea Galle', value: 3 }, { name: 'Coffee', value: 5 }];
  assert.deepEqual(helpers.visibleRows(rows, 'tea', 'value', false).map(r => r.value), [3, 20]);
  assert.deepEqual(helpers.visibleRows(rows, 'TEA', 'value', true).map(r => r.value), [20, 3]);
  assert.equal(rows[0].value, 20);
});

test('charts exclude every SQL subtotal so values are not counted twice', () => {
  const rows = ['detail', 'route_total', 'quarter_total', 'year_total', 'grand_total', 'station_total', 'month_total'].map(row_level => ({ row_level, quantity: 10 }));
  assert.deepEqual(helpers.metricRows(rows, 'quantity'), [{ row_level: 'detail', quantity: 10 }]);
  assert.equal(helpers.metricRows([{ quantity: 'invalid' }], 'quantity').length, 0);
});

test('default workforce week follows Colombo Monday across UTC and year boundary', () => {
  assert.equal(helpers.colomboMonday(new Date('2026-11-01T19:00:00Z')), '2026-11-02');
  assert.equal(helpers.colomboMonday(new Date('2027-01-01T00:00:00Z')), '2026-12-28');
});

test('report table renders accessible SVG, sorting, search and labelled subtotals', () => {
  const html = renderToStaticMarkup(React.createElement(ReportTable, {
    title: 'Sales', rows: [{ row_level: 'detail', product_name: 'Tea', total_sales: 100 }, { row_level: 'grand_total', total_sales: 100 }],
    columns: [{ key: 'row_level', label: 'Row type' }, { key: 'total_sales', label: 'Sales' }], metric: 'total_sales', metricLabel: 'LKR',
  }));
  assert.match(html, /Search this report/);
  assert.match(html, /aria-sort="ascending"/);
  assert.match(html, /<svg role="img" aria-label="Sales: LKR"/);
  assert.equal((html.match(/<rect /g) ?? []).length, 1);
  assert.match(html, /grand_total/);
  assert.match(html, /Page 1 of 1/);
});

test('report rewrite forwards all six existing API paths', async () => {
  const { default: config } = await load('../next.config.ts');
  const rules = await config.rewrites();
  assert.ok(rules.some(rule => rule.source === '/api/v1/:path*' && rule.destination.endsWith('/api/v1/:path*')));
});
