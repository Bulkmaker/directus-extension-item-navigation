# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Directus interface extension that adds **Prev/Next navigation buttons** to item edit pages. Allows users to quickly navigate between items in a collection without returning to the list view.

## Build & Deploy Commands

```bash
npm install
npm run build          # Production build to dist/
npm run dev            # Watch mode for development
./deploy.sh            # Local deployment (ignored from git)
```

**IMPORTANT:** `deploy.sh` is ignored by git but can be used for local development to build, copy to extensions, and restart Directus.

## Architecture

```
src/
├── index.ts          # Interface definition (defineInterface)
└── interface.vue     # Vue component with navigation logic
```

## Extension Registration (`src/index.ts`)

- **id:** `item-navigation`
- **types:** `['alias']` — virtual field, no database column
- **localTypes:** `['presentation']` — presentation-only field
- **group:** `presentation`

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sortField` | string | `''` | Field to sort by (auto-detects `sort` or primary key) |
| `sortDirection` | string | `'asc'` | Sort direction: `asc` or `desc` |
| `showLabels` | boolean | `true` | Show "Prev/Next" text labels on buttons |

## Component Logic (`src/interface.vue`)

**Props (from Directus):**
- `collection: string` — current collection name
- `primaryKey: string | number` — current item ID
- `sortField?: string` — configured sort field
- `sortDirection?: 'asc' | 'desc'` — sort direction
- `showLabels?: boolean` — show button labels

**Internal State:**
```typescript
loading: boolean          // API request in progress
prevId: string | number | null   // Previous item ID
nextId: string | number | null   // Next item ID
position: { current: number; total: number } | null  // Position counter
```

### Key Functions

| Function | Description |
|----------|-------------|
| `fetchNavigation()` | Queries API for prev/next items and position |
| `navigateTo(id)` | Uses Vue Router to navigate to item |
| `t(key)` | Simple i18n for button labels (en/ru) |

### Navigation Algorithm

1. Get current item's sort field value
2. Query items with sort value **less than** current (for prev)
3. Query items with sort value **greater than** current (for next)
4. Count items before current for position calculation
5. Handle both ascending and descending sort directions

### API Queries

```typescript
// Get previous item (ascending sort)
GET /items/{collection}?filter[sort][_lt]={value}&sort=-sort&limit=1

// Get next item (ascending sort)
GET /items/{collection}?filter[sort][_gt]={value}&sort=sort&limit=1

// Get position (count items before current)
GET /items/{collection}?filter[sort][_lt]={value}&aggregate[count]=*
```

## Styling

Uses Directus CSS variables for consistent theming:
- `--theme--border-color` — button borders
- `--theme--border-radius` — button corners
- `--theme--background` — button background
- `--theme--foreground` — text color
- `--theme--foreground-subdued` — position counter color
- `--theme--primary` — hover accent
- `--theme--background-accent` — hover background

## Localization

Built-in translations for button labels:
- English: "Prev" / "Next"
- Russian: "Назад" / "Далее"

Language detected from `navigator.language`.

## Usage

1. Add field to collection with type **Alias**
2. Select interface **Item Navigation**
3. Configure sort field if needed (defaults to `sort` or primary key)
4. Position field at top of form for best UX

## Dependencies

- `@directus/extensions-sdk` — Directus API and stores
- `vue-router` — navigation between items
