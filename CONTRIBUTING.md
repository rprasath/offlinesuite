# Contributing to OfflineSuite

Thank you for your interest in contributing to OfflineSuite! This document provides guidelines and instructions for contributing.

## 🎯 Core Principles

1. **Privacy First** - All tools must process data locally. No server uploads.
2. **Offline Capable** - Tools should work without an internet connection (after initial load).
3. **Simple & Clean** - Keep the UI intuitive and accessible.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Start development server: `npm run dev`

## 📝 Adding a New Tool

### Step 1: Create Tool Folder

```
src/tools/your-tool-name/
├── index.jsx      # Main component
├── config.js      # Tool configuration (optional)
└── utils.js       # Helper functions (optional)
```

### Step 2: Create Tool Component

```jsx
// src/tools/your-tool-name/index.jsx
export default function YourTool() {
  return (
    <div className="p-6">
      {/* Your tool UI */}
    </div>
  )
}
```

### Step 3: Register the Tool

Add your tool to `src/tools/registry.js`:

```javascript
import YourTool from './your-tool-name'

export const tools = [
  // ... existing tools
  {
    id: 'your-tool',           // URL slug
    name: 'Your Tool Name',    // Display name
    description: 'Brief description of what it does',
    icon: '🔧',                // Emoji icon
    category: 'image',         // Category: 'image', 'document', etc.
    component: YourTool,       // Your component
    status: 'active',          // 'active', 'beta', or 'coming-soon'
    keywords: ['search', 'terms'],
  },
]
```

## 🎨 Styling Guidelines

- Use Tailwind CSS classes
- Follow existing component patterns
- Ensure responsive design (mobile-first)
- Use semantic colors from the theme

## ✅ Pull Request Checklist

- [ ] Code follows project style
- [ ] Tool works entirely offline
- [ ] No external API calls or data uploads
- [ ] Responsive design implemented
- [ ] Tested in Chrome, Firefox, Safari
- [ ] README updated if needed

## 🐛 Reporting Bugs

1. Check existing issues first
2. Include browser and OS information
3. Provide steps to reproduce
4. Include screenshots if applicable

## 💡 Suggesting Features

1. Check existing feature requests
2. Describe the use case
3. Explain why it should be offline-capable
4. Provide mockups if possible

## 📜 Code of Conduct

Be respectful and inclusive. We're all here to build great tools together.

---

Questions? Open an issue or reach out to the maintainers.
