# Item Navigation for Directus

Navigate between items without leaving the edit page. Adds **Prev/Next buttons** with position counter to any collection.

![Directus 10.10+](https://img.shields.io/badge/Directus-10.10%2B-6644FF)
![License MIT](https://img.shields.io/badge/License-MIT-green)

## Features

- **Quick navigation** — Jump to previous/next item with one click
- **Position counter** — See where you are: `5 / 42`
- **Smart sorting** — Auto-detects `sort` field or uses primary key
- **Configurable** — Custom sort field and direction
- **Bilingual** — English and Russian labels
- **Themed** — Matches your Directus color scheme

## Installation

### Via Directus Marketplace

1. Go to **Settings → Extensions**
2. Search for "Item Navigation"
3. Click **Install**

### Manual Installation

```bash
npm install directus-extension-item-navigation
```

Or copy the `dist` folder to your Directus extensions directory:
```
extensions/directus-extension-item-navigation/
├── dist/
│   └── index.js
└── package.json
```

Restart Directus after installation.

## Usage

1. Open any collection settings
2. Create a new field:
   - **Type:** Alias (Presentation)
   - **Interface:** Item Navigation
3. Configure options (optional):
   - **Sort Field** — Field to determine order (default: `sort` or `id`)
   - **Sort Direction** — Ascending or Descending
   - **Show Labels** — Display "Prev/Next" text
4. Position the field at the top of your form

## Screenshots

### Navigation Buttons
```
┌─────────────────────────────────────────┐
│  [< Prev]    5 / 42    [Next >]         │
├─────────────────────────────────────────┤
│                                         │
│  Title: My Article                      │
│  Status: Published                      │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Interface Options
| Option | Description | Default |
|--------|-------------|---------|
| Sort Field | Field used for ordering items | Auto-detect |
| Sort Direction | `asc` or `desc` | Ascending |
| Show Labels | Display text on buttons | Yes |

## How It Works

The extension queries the Directus API to find adjacent items based on the sort field value:

1. Fetches current item's sort value
2. Finds item with next lower value (previous)
3. Finds item with next higher value (next)
4. Counts items before current for position

Navigation uses Vue Router for seamless page transitions.

## Compatibility

- Directus 10.10.0 and higher
- Directus 11.x

## License

MIT License — feel free to use in personal and commercial projects.

## Author

**Miša** — [GitHub](https://github.com/bulkmaker)

## Contributing

Issues and pull requests are welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request
