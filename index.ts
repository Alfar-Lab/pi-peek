import { resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES, truncateHead } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { find, get, load, schema } from "./core.js";

const Params = Type.Object({
	action: Type.Union([Type.Literal("schema"), Type.Literal("find"), Type.Literal("get")]),
	file: Type.String({ description: "Path to .json, .xml, .yaml or .yml file" }),
	regex: Type.Optional(Type.String({ description: "find: regex matched against key names" })),
	path: Type.Optional(Type.String({ description: 'get: path like a.b[0]["odd key"] (empty = root)' })),
	max: Type.Optional(Type.Number({ description: "get: max output chars (default 2000)" })),
});

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "peek",
		label: "peek",
		description: [
			"Read structured data files (json, xml, yaml, yml) without loading them whole. Prefer over read for these files.",
			"- schema: key tree with types, array lengths and sample values, cut at depth 3.",
			"- find: every path whose key matches `regex`.",
			"- get: one subtree at `path`, output capped at `max` chars (default 2000).",
			"XML: attributes are '@name', mixed text is '#text'. Multi-document YAML is an array.",
		].join("\n"),
		parameters: Params,
		annotations: { readOnlyHint: true },
		async execute(_id, p, _signal, _onUpdate, ctx) {
			const data = await load(resolve(ctx.cwd, p.file.replace(/^@/, "")));
			let text: string;
			if (p.action === "schema") text = schema(data);
			else if (p.action === "find") {
				if (!p.regex) throw new Error("find requires regex");
				const hits = find(data, p.regex);
				text = hits.length ? `${hits.length} match(es)\n${hits.join("\n")}` : "No matching keys";
			} else text = get(data, p.path ?? "", p.max ?? 2000);
			const t = truncateHead(text, { maxLines: DEFAULT_MAX_LINES, maxBytes: DEFAULT_MAX_BYTES });
			const out = t.truncated ? `${t.content}\n[truncated: ${t.outputLines} of ${t.totalLines} lines]` : t.content;
			return { content: [{ type: "text", text: out }], details: undefined };
		},
	});
}
