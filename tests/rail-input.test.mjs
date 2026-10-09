import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/rail-input.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { railTimestamp, railError, distinctRailTrips } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('rail schedule input preserves Sri Lanka wall time independent of browser timezone', () => {
  assert.equal(railTimestamp('2026-10-20T08:15'), '2026-10-20T08:15+05:30');
  assert.equal(new Date(railTimestamp('2026-10-20T08:15')).toISOString(), '2026-10-20T02:45:00.000Z');
  assert.throws(() => railTimestamp(''), /valid rail schedule/);
});
test('rail API validation errors remain readable for strings, arrays and server failures', () => {
  assert.equal(railError('INSUFFICIENT_RAIL_CAPACITY'), 'INSUFFICIENT_RAIL_CAPACITY');
  assert.equal(railError([{msg:'Capacity must have at most two decimal places'}]), 'Capacity must have at most two decimal places');
  assert.equal(railError(null, 'Try again'), 'Try again');
});
test('multiple product rows on one train are not labelled as spillover', () => {
  assert.deepEqual(distinctRailTrips([{trip_id:10},{trip_id:10}]), [10]);
  assert.deepEqual(distinctRailTrips([{trip_id:10},{trip_id:20},{trip_id:10}]), [10,20]);
  assert.deepEqual(distinctRailTrips([]), []);
});
