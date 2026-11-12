// Self-check: node check.ts
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { find, get, load, parsePath, schema } from "./core.js";

const d = mkdtempSync(join(tmpdir(), "peek-"));
const f = (n: string, s: string) => (writeFileSync(join(d, n), s), join(d, n));

const json = await load(f("a.json", JSON.stringify({ users: [{ id: 1, name: "a" }, { id: 2, email: "x" }], "odd key": { deep: { deeper: { deepest: 1 } } } })));
const s = schema(json);
assert.match(s, /users: array\[2\] of object/);
assert.match(s, /email: string = "x"/); // merged across items
assert.match(s, /deeper: object\{1\} …/); // depth cut
assert.match(s, /\[\]: object\{3\}\n\s+id: number = 1/); // array items don't consume depth
assert.doesNotMatch(get({ s: "x".repeat(50) }, "s", 10), /Narrow/); // no hint for scalars
assert.deepEqual(parsePath('$.users[1]["odd key"].x'), ["users", 1, "odd key", "x"]);
assert.deepEqual(find(json, "^id$"), ["users[0].id: number = 1", "users[1].id: number = 2"]);
assert.equal(get(json, "users[1].email"), '"x"');
assert.match(get(json, "", 10), /truncated: 10 of/);
assert.throws(() => get(json, "users[5]"), /Path not found/);

const yml = await load(f("b.yml", "a: 1\n---\nb: [x, y]\n"));
assert.equal(get(yml, "[1].b[1]"), '"y"');

const xml = await load(f("c.xml", '<root><item id="7">hi</item><item id="8">yo</item></root>'));
assert.equal(get(xml, 'root.item[1]["@id"]'), '"8"');
assert.deepEqual(find(xml, "^@id$").length, 2);
console.log("ok");

// CLI smoke test
import { execFileSync } from "node:child_process";
const cli = (...a: string[]) => execFileSync("node", [new URL("./cli.js", import.meta.url).pathname, ...a], { encoding: "utf8" });
const jf = f("cli.json", '{"a":{"b":[1,2]}}');
assert.match(cli("schema", jf), /b: array\[2\] of number/);
assert.equal(cli("find", jf, "^b$").trim(), "a.b: array[2]");
assert.equal(cli("get", jf, "a.b[1]").trim(), "2");
assert.match(cli("get", jf, "--max", "5"), /truncated: 5 of/);
assert.throws(() => execFileSync("node", ["cli.js", "nope"], { stdio: "pipe" }));
console.log("cli ok");
