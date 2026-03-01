# OfflineSuite Tools

This directory contains individual tools for OfflineSuite.

## Structure

Each tool should be in its own folder:

```
tools/
├── registry.js           # Central tool registration
├── passport-photo/       # Passport Photo Maker
│   ├── index.jsx         # Main component
│   └── config.js         # Configuration
├── pdf-merger/           # PDF Merger (coming soon)
│   └── index.jsx
└── your-new-tool/        # Your new tool
    ├── index.jsx
    ├── config.js
    └── utils.js
```

## Adding a New Tool

1. Create a folder: `src/tools/your-tool-name/`
2. Create `index.jsx` with your component
3. Register in `registry.js`

See CONTRIBUTING.md for detailed guidelines.
