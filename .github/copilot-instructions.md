# OfflineSuite - AI Coding Instructions

## Project Overview
OfflineSuite is a **privacy-first, offline-capable** web application providing 17+ tools for PDF editing, image processing, and document management. Built with React + Vite + TailwindCSS.

**Core Principle**: All file processing happens 100% client-side in the browser. NO server uploads, NO external API calls for file processing (except for AI model loading).

## Architecture

### Tool Registry Pattern
All tools follow a **centralized registration system** in `src/tools/registry.js`:
- Import tool component from `src/tools/{tool-name}/index.jsx`
- Register in `tools` array with metadata (id, name, description, icon, category, keywords, status)
- Tool automatically appears on dashboard and gets routed via `src/pages/ToolPage.jsx`
- Categories defined in `toolCategories` object (image, document, converter, utility)

### Directory Structure
```
src/
├── tools/
│   ├── registry.js           # Central tool registration - START HERE for adding tools
│   └── {tool-name}/
│       ├── index.jsx          # Tool component (default export)
│       └── config.js          # Optional: Tool-specific config/constants
├── pages/
│   ├── Dashboard.jsx         # Tool grid, auto-populated from registry
│   └── ToolPage.jsx          # Dynamic tool wrapper, handles routing
├── utils/
│   ├── seo.js                # Dynamic meta tags, updateToolSEO()
│   └── pdfConfig.js          # Shared PDF metadata constants
└── components/Layout.jsx     # App shell with header/footer
```

## Key Technologies & Constraints

### Dependencies
- **pdf-lib**: PDF manipulation (merge, watermark, metadata, split)
- **pdfjs-dist**: PDF rendering to canvas/images
- **@imgly/background-removal**: AI background removal (loads WASM models)
- **qrcode**: QR code generation
- **React Router**: v6 with nested routes under `<Layout>`
- **Vite**: Build tool with alias config (`@`, `@tools`, `@components`, `@hooks`, `@utils`)

### Version Constraints
- Node.js: `>=18.0.0 <=20.x` (enforced in package.json engines)
- No Node.js 22+ due to rollup compatibility
- Specific ONNX Runtime version: `1.21.0-dev.20250206-d981b153d3` for background removal

## Adding a New Tool (3-Step Process)

### 1. Create Tool Component
```jsx
// src/tools/your-tool-name/index.jsx
export default function YourTool() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your Tool</h1>
        {/* Tool UI with Tailwind classes */}
      </div>
    </div>
  )
}
```

### 2. Register in Registry
```javascript
// src/tools/registry.js
import YourTool from './your-tool-name'

export const tools = [
  // ... existing tools
  {
    id: 'your-tool-name',           // URL slug
    name: 'Your Tool Name',         // Display name
    description: 'Short description for dashboard',
    icon: '🔧',                     // Emoji icon
    category: 'utility',            // image | document | converter | utility
    component: YourTool,
    isNew: true,                    // Shows "New" badge
    status: 'active',               // active | beta | coming-soon
    keywords: ['search', 'terms'],  // For search/SEO
  },
]
```

### 3. Test
- Tool appears at `/tool/your-tool-name`
- Dashboard auto-updates with new tool card
- SEO metadata auto-generated via `updateToolSEO()` in ToolPage.jsx

## Common Patterns

### File Upload & Processing
```jsx
const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const arrayBuffer = event.target.result
    // Process arrayBuffer (e.g., with pdf-lib or Image API)
  }
  reader.readAsArrayBuffer(file)  // For PDFs
  // OR reader.readAsDataURL(file) // For images
}
```

### PDF Processing with pdf-lib
```javascript
import { PDFDocument } from 'pdf-lib'
import { PDF_CONFIG } from '@utils/pdfConfig'

const pdfDoc = await PDFDocument.load(arrayBuffer)
// Modify PDF...
pdfDoc.setProducer(PDF_CONFIG.producer)
pdfDoc.setCreator(PDF_CONFIG.creator)
const pdfBytes = await pdfDoc.save()
```

### Download Pattern
```javascript
const blob = new Blob([pdfBytes], { type: 'application/pdf' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'output.pdf'
a.click()
URL.revokeObjectURL(url)
```

### State Management
- Use React `useState` for tool state
- Complex tools like passport-photo use single state object with `setState` updates
- Keep state isolated within tool components (no global state/context)

### Styling
- **Tailwind CSS** exclusively (no custom CSS files in tool folders)
- Gradient buttons: `bg-gradient-to-r from-purple-600 to-pink-600`
- Cards: `bg-white rounded-2xl shadow-xl p-8`
- Responsive: Use `max-w-4xl mx-auto` for content containers

## Development Workflow

### Commands
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

### Vite Configuration
- Path aliases configured: `@/`, `@tools/`, `@components/`, `@hooks/`, `@utils/`
- Manual chunks for code splitting (e.g., passport-photo separated)
- Excludes `onnxruntime-web/webgpu` from bundle
- Optimizes deps except `@imgly/background-removal`

### Debugging
- Check browser console for errors
- PDF issues: Ensure `pdf-lib` and `pdfjs-dist` versions compatible
- Background removal: Verify ONNX Runtime loads (network tab for WASM models)

## SEO & Metadata

### Dynamic Tool SEO
- `updateToolSEO(tool)` called in ToolPage.jsx `useEffect`
- Sets title, description, keywords, Open Graph tags, JSON-LD structured data
- Keywords from tool.keywords array in registry

### Tool Keywords
Include in registry for discoverability:
- Primary function: 'merge', 'compress', 'split', 'convert'
- File types: 'pdf', 'png', 'jpg', 'image'
- Use cases: 'passport', 'signature', 'watermark'

## Testing Checklist for New Tools
- [ ] Tool displays on dashboard with correct icon/description
- [ ] Route `/tool/{tool-id}` loads tool component
- [ ] File upload/processing works without network requests
- [ ] Download produces correct output file
- [ ] Works offline (disable network in DevTools)
- [ ] Responsive design on mobile/tablet
- [ ] No console errors/warnings

## Configuration Examples

### Document Size Config (Passport Photo Pattern)
```javascript
// config.js
export const DOC_SIZES = {
  'us-passport': {
    label: 'US Passport',
    displayLabel: 'US Passport (2×2 in)',
    region: 'usa',
    widthMm: 51,
    heightMm: 51,
    widthPx: 600,  // At 300 DPI
    heightPx: 600,
  },
}

export const DPI = 300
export const ZOOM_MIN = 0.05
export const ZOOM_MAX = 5
```

### Tool Config Pattern
- Export constants from `config.js` in tool folder
- Import in `index.jsx`: `import { DOC_SIZES, DPI } from './config'`
- Use for dropdowns, validation, processing logic

## Privacy Requirements
- **NO external API calls** for file processing
- Exception: Loading AI models (background removal WASM files)
- All processing must work in offline mode after initial page load
- No analytics or tracking on user files
- State/files not persisted (no localStorage for file data)

## Contributing Notes
- See CONTRIBUTING.md for detailed guidelines
- Tools follow single-file component pattern (index.jsx)
- Optional config.js for constants/configurations
- Utils.js for complex helper functions (rare - prefer inline)
