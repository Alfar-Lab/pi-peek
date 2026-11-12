# pi-peek

Read large JSON, XML, YAML files without loading them whole: `schema`, `find`, `get`.

## pi (native tool)

```bash
pi install git:github.com/Alfar-Lab/pi-peek
```

Registers the `peek` tool. No skill needed.

## Other agent harnesses (CLI + skill)

```bash
npm i -g github:Alfar-Lab/pi-peek    # provides the `dpeek` command
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
dpeek schema <file>                key tree: types, array lengths, sample values (depth 3)
dpeek find <file> <regex>          every path whose key matches regex
dpeek get <file> [path] [--max N]  one subtree as JSON, capped at N chars (default 2000)
```

## Example

`app.json`:

```json
{
  "name": "shop-api",
  "version": "2.4.0",
  "server": { "port": 8080, "cors": { "origins": ["https://shop.example.com"], "credentials": true } },
  "users": [
    { "id": 1, "name": "Ana", "roles": ["admin"], "address": { "city": "Bandung", "zip": "40115" } },
    { "id": 2, "name": "Budi", "roles": ["user"], "email": "budi@example.com" }
  ]
}
```

**schema**: structure first. Keys of all array items are merged (`email` exists only in `users[1]`).

```console
$ dpeek schema app.json
$: object{4}
  name: string = "shop-api"
  version: string = "2.4.0"
  server: object{2}
    port: number = 8080
    cors: object{2}
      origins: array[1] of string = "https://shop.example.com"
      credentials: boolean = true
  users: array[2] of object
    []: object{5}
      id: number = 1
      name: string = "Ana"
      roles: array[1] of string = "admin"
      address: object{2}
        city: string = "Bandung"
        zip: string = "40115"
      email: string = "budi@example.com"
```

**find**: locate keys by regex.

```console
$ dpeek find app.json '^(id|city)$'
users[0].id: number = 1
users[0].address.city: string = "Bandung"
users[1].id: number = 2
```

**get**: read only one subtree.

```console
$ dpeek get app.json users[0].address
{
  "city": "Bandung",
  "zip": "40115"
}
```

Large output is capped and suggests a narrower path:

```console
$ dpeek get app.json users --max 60
[
  {
    "id": 1,
    "name": "Ana",
    "roles": [
      "
… [truncated: 60 of 257 chars. Narrow the path, e.g. users[0]]
```

**XML**: attributes become `@name`. `books.xml`:

```xml
<catalog>
  <book id="b1" lang="en"><title>One</title><price>10</price></book>
  <book id="b2"><title>Two</title></book>
</catalog>
```

```console
$ dpeek find books.xml '^@id$'
catalog.book[0].@id: string = "b1"
catalog.book[1].@id: string = "b2"

$ dpeek get books.xml 'catalog.book[1]'
{
  "title": "Two",
  "@id": "b2"
}
```

In pi, the same actions run through the `peek` tool: `peek({ action: "find", file: "app.json", regex: "^id$" })`.

## Dev

```bash
npm install && npm test
```
