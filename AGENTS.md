# AGENTS.md

Guidance for agentic coding tools working in this repo.
Keep changes aligned with existing Directus extension patterns.

## Repository summary

- Directus interface extension that adds Prev/Next navigation on item edit pages.
- Source lives in `src/index.ts` and `src/interface.vue`.
- Built as a Directus extension bundle via `@directus/extensions-sdk`.

## Commands

### Install

- `npm install`

### Build

- `npm run build` (production build to `dist/`)
- `npm run dev` (watch mode, no minify)
- `./deploy.sh` (local helper; ignored by git)

### Lint

- No lint script or config found (`eslint`, `prettier`, etc.).
- If you add linting, also add a `npm run lint` script.

### Tests

- No test framework or scripts found.
- Single test execution: not applicable (no tests).
- If you add tests, document `npm test` and single-test invocation.

## Architecture

- `src/index.ts`: registers the interface via `defineInterface`.
- `src/interface.vue`: Vue SFC with navigation logic and styles.
- `dist/` is generated; do not edit manually.

## Code style guidelines

### Imports

- Use ES module imports.
- Order: third-party libs, Directus SDK, local files.
- Keep imports on one line when short (current style).

### Formatting

- Indent with 4 spaces (no tabs).
- Use single quotes for strings.
- End statements with semicolons.
- Use trailing commas in multiline objects/arrays.
- Keep lines readable; prefer short clauses over long ternaries.

### TypeScript

- Prefer `const` and `let` over `var`.
- Use explicit union types for IDs (`string | number | null`).
- Use `interface` for props and simple object shapes.
- Keep type assertions minimal; favor typed values.

### Vue SFC patterns

- Use `<script setup lang="ts">`.
- Keep reactive state in `ref`/`computed`.
- Use `watch` + `onMounted` for data refresh.
- Avoid side effects in computed values.
- Keep template logic minimal and declarative.

### Naming

- Variables/functions: `camelCase`.
- Components: `PascalCase` for imported components.
- CSS classes: `kebab-case`.
- Boolean props: `showLabels`, `loading`.

### Error handling

- Wrap async API calls in `try/catch/finally`.
- Log errors with a concise prefix (see `Navigation fetch error`).
- Always reset loading state in `finally`.

### Directus API usage

- Use `useApi()` for HTTP requests.
- Use `useStores()` to read collection fields.
- Prefer filtering via Directus API params (`filter`, `sort`, `limit`).
- Keep payloads minimal: request only needed fields.

### Routing

- Use Vue Router via `useRoute()` and `useRouter()`.
- Route paths follow `/content/{collection}/{id}`.

### Localization

- Keep simple inline translations via `t(key)`.
- Language detection uses `navigator.language` (ru vs en).
- Add new keys in the same translation map.

### Styling

- Use Directus theme CSS variables (see `interface.vue`).
- Keep `scoped` styles in the SFC.
- Avoid hard-coded colors except CSS variables.
- Maintain button spacing and alignment with flexbox.

### Performance and UX

- Avoid extra API calls; reuse fetched values when possible.
- Keep loading states accurate to prevent rapid clicks.
- Prefer minimal DOM updates; rely on Vue reactivity.

### Accessibility

- Keep buttons disabled via `:disabled` and visual `.disabled`.
- If adding new controls, include text labels or `aria-label`.

### Files to avoid editing

- `dist/` output.
- `deploy.sh` is local-only; update only if asked.

## Change checklist

- Ensure navigation still handles ascending/descending sort.
- Preserve auto-detect behavior for `sort` or primary key.
- Keep `showLabels` behavior consistent.
- Update README/CLAUDE if behavior changes.

## Agent rules in this repo

- Cursor rules: none found (`.cursor/rules/` or `.cursorrules`).
- Copilot rules: none found (`.github/copilot-instructions.md`).

## Notes for future additions

- If adding tests, include a documented single-test command.
- If adding lint/format tools, codify their config here.
- Keep repo focused on a small Directus extension; avoid extra tooling.
- If you add a new build step, update `package.json` scripts.
- Prefer ASCII-only edits unless existing file already uses Unicode.
- Avoid modifying `package-lock.json` unless dependencies change.
- Keep `README.md` in sync with extension behavior.
- When adding options, update `src/index.ts` and prop defaults.
- When changing API queries, verify sorting math for `position`.
- Use `npm run build` before shipping changes.
- Document any new environment requirements here.
