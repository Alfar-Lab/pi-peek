---
name: peek
description: Read large JSON, XML, YAML files without loading them whole. Use instead of cat/read when exploring or extracting from .json .xml .yaml .yml files.
---

# peek

Requires the `peek` command (`npm i -g github:Alfar-Lab/pi-peek`).

```
peek schema <file>                 key tree: types, array lengths, sample values (depth 3)
peek find <file> <regex>           every path whose key matches regex
peek get <file> [path] [--max N]   one subtree as JSON, capped at N chars (default 2000)
```

Workflow: `schema` first to see structure, `find` to locate a key, `get` to read only that part.

- Path syntax: `a.b[0]["odd key"]`; empty path = root.
- XML: attributes are `@name`, mixed text is `#text`; a repeated element is an array, a single one is an object.
- Multi-document YAML is an array: `[1].key`.
- Exit code 1 with message on error (bad path, parse error, unsupported extension).
