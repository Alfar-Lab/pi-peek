#!/usr/bin/env node
import { find, get, load, schema } from "./core.js";

const USAGE = `Usage:
  dpeek schema <file>                key tree: types, array lengths, sample values (depth 3)
  dpeek find <file> <regex>          every path whose key matches regex
  dpeek get <file> [path] [--max N]  one subtree as JSON, capped at N chars (default 2000)
Files: .json .xml .yaml .yml   Path: a.b[0]["odd key"]   XML attrs: @name`;

const args = process.argv.slice(2);
const mi = args.indexOf("--max");
const max = mi >= 0 ? Number(args.splice(mi, 2)[1]) : 2000;
const [cmd, file, arg] = args;

try {
	if (!file || !["schema", "find", "get"].includes(cmd) || !(max > 0)) throw new Error(USAGE);
	const data = await load(file);
	if (cmd === "schema") console.log(schema(data));
	else if (cmd === "get") console.log(get(data, arg ?? "", max));
	else {
		if (!arg) throw new Error("find requires <regex>");
		const hits = find(data, arg);
		console.log(hits.length ? hits.join("\n") : "No matching keys");
	}
} catch (e) {
	console.error(e.message);
	process.exit(1);
}
