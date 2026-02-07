# mcwics

## Scavenger Hunt JSON

This repo includes a JSON Schema and an example to power a node-based editor and a play feature for a scavenger hunt app.

- Schema: [schema/scavenger.schema.json](schema/scavenger.schema.json)
- Example: [examples/scavenger.sample.json](examples/scavenger.sample.json)

### Top-Level Structure

- **version**: Semver string for the file format.
- **metadata**: Title, description, author, timestamps.
- **settings**: Gameplay settings (start puzzle, time limit, hints, scoring).
- **puzzles**: Array of puzzle nodes with type, text, API config (if needed), success conditions, hints, rewards, and editor position.
- **edges**: Directed connections between puzzles for the node editor, with optional conditions.

### Puzzle Types and Success Conditions

- **passcode**: `success.codes` list, with `caseSensitive`, `ignoreWhitespace`, `attemptsAllowed`, `normalize`.
- **reorder**: `success.tokens` (optional), `success.targetOrder`, `orderMatters`.
- **multipleChoice**: `success.choices` (id/text), `success.correctIds`, `minSelect`, `maxSelect`, `orderMatters`.
- **regex**: `success.pattern`, `flags`.
- **api**: `api` block (url, method, headers/query/body, timeout), `success.expect` with JSONPath `path`, `operator` (equals/contains/matches/gt/lt/gte/lte), `value`, `requireAll`.
- **location**: `success.lat`, `success.lon`, `radiusMeters`.
- **qr**: `success.codes` list.

Each puzzle has `title`, `description`, optional `ui` (input type, placeholder), optional `hints` and `reward`, and a `position` `{x,y}` for the node-based editor.

### Quick Start

1. Copy [examples/scavenger.sample.json](examples/scavenger.sample.json) and customize.
2. Keep `puzzle.type` aligned with the `success` shape described above.
3. Connect puzzles via `edges` using puzzle `id`s.

### Optional Validation (Node.js)

You can validate your JSON against the schema using `ajv-cli`:

```bash
npx ajv-cli validate -s schema/scavenger.schema.json -d examples/scavenger.sample.json
```

If you prefer installing locally:

```bash
npm install --save-dev ajv ajv-cli
npx ajv-cli validate -s schema/scavenger.schema.json -d examples/scavenger.sample.json
```

### Notes

- For `api` puzzles, the `query` or `body` can include placeholders like `{playerInput}`; your app can substitute runtime values before calling.
- `edges.condition.type` defaults to `onSuccess`. You can extend `custom` for bespoke gating.