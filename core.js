// Plain JS so it runs on Node without a build step (pi, CLI, any harness).
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { parseAllDocuments } from "yaml";
import { XMLParser } from "fast-xml-parser";

export async function load(file) {
	const text = await readFile(file, "utf8");
	switch (extname(file).toLowerCase()) {
		case ".json":
			return JSON.parse(text);
		case ".yaml":
		case ".yml": {
			const out = parseAllDocuments(text).map((d) => {
				if (d.errors.length) throw new Error(`YAML error: ${d.errors[0].message}`);
				return d.toJS();
			});
			return out.length === 1 ? out[0] : out;
		}
		case ".xml":
			// Attributes become "@name", text next to children becomes "#text".
			return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text" }).parse(text);
		default:
			throw new Error(`Unsupported extension: ${extname(file) || "(none)"} (json, xml, yaml, yml)`);
	}
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

function sample(v, n = 40) {
	const s = JSON.stringify(v) ?? String(v);
	return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function joinPath(base, key) {
	if (typeof key === "number") return `${base}[${key}]`;
	if (/^[A-Za-z_$@#][\w$@#:-]*$/.test(key)) return base ? `${base}.${key}` : key;
	return `${base}[${JSON.stringify(key)}]`;
}

export function parsePath(path) {
	const parts = [];
	const re = /\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]|\.?([^.[\]]+)/gy;
	const p = path.trim().replace(/^\$\.?/, "");
	let m;
	while (re.lastIndex < p.length && (m = re.exec(p))) {
		parts.push(m[1] !== undefined ? Number(m[1]) : m[2] !== undefined ? JSON.parse(m[2]) : m[3]);
	}
	if (re.lastIndex !== p.length) throw new Error(`Bad path near: ${p.slice(re.lastIndex)}`);
	return parts;
}

// Merge sibling objects in an array so the schema shows every key that appears (first 50 items).
function mergeItems(items) {
	const objs = items.slice(0, 50).filter(isObj);
	if (!objs.length) return items[0];
	const merged = {};
	for (const o of objs) for (const [k, v] of Object.entries(o)) if (!(k in merged)) merged[k] = v;
	return merged;
}

export function schema(v, maxDepth = 3) {
	const lines = [];
	const walk = (val, label, depth, indent) => {
		if (Array.isArray(val)) {
			const types = [...new Set(val.slice(0, 50).map(typeOf))].join("|") || "empty";
			const item = mergeItems(val);
			const leaf = !val.length || (!isObj(item) && !Array.isArray(item));
			lines.push(`${indent}${label}: array[${val.length}] of ${types}${leaf && val.length ? ` = ${sample(item)}` : ""}`);
			if (leaf) return;
			// Array items don't consume depth, so item keys stay visible.
			walk(item, "[]", depth, `${indent}  `);
		} else if (isObj(val)) {
			const keys = Object.keys(val);
			lines.push(`${indent}${label}: object{${keys.length}}${depth >= maxDepth && keys.length ? " …" : ""}`);
			if (depth >= maxDepth) return;
			for (const k of keys) walk(val[k], k, depth + 1, `${indent}  `);
		} else {
			lines.push(`${indent}${label}: ${typeOf(val)} = ${sample(val)}`);
		}
	};
	walk(v, "$", 0, "");
	return lines.join("\n");
}

export function find(v, pattern) {
	const re = new RegExp(pattern);
	const out = [];
	const walk = (val, path) => {
		const entries = Array.isArray(val) ? val.map((x, i) => [i, x]) : isObj(val) ? Object.entries(val) : [];
		for (const [k, child] of entries) {
			const p = joinPath(path, k);
			if (typeof k === "string" && re.test(k)) {
				const t = typeOf(child);
				const desc = t === "array" ? `array[${child.length}]` : t === "object" ? `object{${Object.keys(child).length}}` : `${t} = ${sample(child)}`;
				out.push(`${p}: ${desc}`);
			}
			walk(child, p);
		}
	};
	walk(v, "");
	return out;
}

export function get(v, path, max = 2000) {
	let cur = v;
	const parts = parsePath(path);
	for (let i = 0; i < parts.length; i++) {
		const k = parts[i];
		if (cur === null || typeof cur !== "object" || !(k in cur)) {
			const at = parts.slice(0, i).reduce((a, b) => joinPath(a, b), "") || "$";
			throw new Error(`Path not found: ${String(k)} missing at ${at}`);
		}
		cur = cur[k];
	}
	const s = JSON.stringify(cur, null, 2) ?? String(cur);
	if (s.length <= max) return s;
	const hint = isObj(cur) ? `. Narrow the path, e.g. ${joinPath(path, Object.keys(cur)[0])}` : Array.isArray(cur) ? `. Narrow the path, e.g. ${joinPath(path, 0)}` : "";
	return `${s.slice(0, max)}\n… [truncated: ${max} of ${s.length} chars${hint}]`;
}
