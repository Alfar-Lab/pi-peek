# pi-peek

Read large JSON, XML, YAML files without loading them whole: `schema`, `find`, `get`.

## pi (native tool)

```bash
pi install git:github.com/Alfar-Lab/pi-peek
```

Registers the `peek` tool. No skill needed.

## Other agent harnesses (CLI + skill)

```bash
npm i -g github:Alfar-Lab/pi-peek    # provides the `peek` command
```

Copy `skills/peek/SKILL.md` into the harness's skill folder, e.g.:

| Harness | Location |
|---|---|
| Claude Code | `~/.claude/skills/peek/SKILL.md` |
| Codex / others with AGENTS.md | paste the command block into `AGENTS.md` |

```bash
mkdir -p ~/.claude/skills/peek
cp "$(npm root -g)/pi-peek/skills/peek/SKILL.md" ~/.claude/skills/peek/
```

## Commands

```
peek schema <file>                 key tree: types, array lengths, sample values (depth 3)
peek find <file> <regex>           every path whose key matches regex
peek get <file> [path] [--max N]   one subtree as JSON, capped at N chars (default 2000)
```

## Dev

```bash
npm install && npm test
```
