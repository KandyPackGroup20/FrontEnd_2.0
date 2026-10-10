import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/roster/fatigue.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { fatigue } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
for (const hours of [40, 60]) {
  test(`${hours} hour fatigue boundaries use inclusive yellow warning`, () => {
    const limit = hours * 3600;
    assert.match(fatigue(limit * 0.9 - 1, limit).className, /green/);
    assert.match(fatigue(limit * 0.9, limit).className, /yellow/);
    assert.match(fatigue(limit, limit).className, /yellow/);
    assert.match(fatigue(limit + 1, limit).className, /red/);
  });
}
