# 🔧 OfflineSuite - Free Offline PDF, Image & Document Tools

**17+ Powerful offline tools that respect your privacy. No uploads. No accounts. 100% free.**

OfflineSuite is an open-source collection of browser-based tools for PDF editing, image processing, and document management that work entirely offline. All processing happens locally on your device - no uploads, no accounts, no tracking, no internet required after initial load.

## 🎯 Why OfflineSuite?

- 🔒 **100% Private & Secure** - Your files never leave your device. Zero data upload. Complete privacy.
- ⚡ **Lightning Fast** - No server round-trips. Instant processing in your browser.
- 💻 **Works Offline** - Once loaded, works without internet connection. Perfect for travel or secure environments.
- 💰 **Completely Free** - No subscriptions, no hidden fees, no premium tiers. Forever free.
- 🌐 **No Installation** - Works in any modern web browser. No downloads or installations needed.
- 🔓 **Open Source** - Transparent, auditable code. MIT licensed.
- 🌓 **Dark Mode** - Beautiful light and dark themes with automatic system detection.
- ♿ **Accessible** - WCAG 2.1 AA compliant, keyboard navigable, screen reader friendly.

## 🛠️ Complete Tool List (17+ Tools)

### 📄 PDF Tools
- **PDF Merger** - Combine multiple PDF files into one. Reorder, rotate pages.
- **PDF Compressor** - Reduce PDF file sizes with adjustable compression levels.
- **PDF Splitter** - Split PDFs by page ranges or extract specific pages.
- **PDF Watermark** - Add custom text or image watermarks with opacity control.
- **PDF Signer** - Add digital signatures to PDFs with position customization.
- **PDF to Images** - Convert PDF pages to PNG, JPG, or WebP images.
- **PDF Metadata Editor** - View and edit PDF properties (title, author, keywords).
- **PDF Diff Tool** - Compare two PDF files with text or visual comparison.

### 🖼️ Image Tools
- **Passport Photo Maker** - Create professional passport & visa photos with:
  - 50+ country-specific sizes (US, UK, EU, India, China, etc.)
  - Smart crop with face alignment guide
  - Image adjustments (brightness, contrast, exposure, saturation)
  - AI-powered background removal
  - Print layout generation (4×6, A4, Letter sizes)
- **Background Remover** - Remove backgrounds from images using AI. Perfect for product photos.
- **Image Compressor** - Reduce image file sizes with quality control. Batch processing.
- **Image Converter** - Convert between JPG, PNG, WebP, BMP formats with resizing.
- **Image Editor** - Complete editor with filters, adjustments, resize, and crop tools.

### 🔄 Converters & Utilities
- **QR Code Generator** - Create QR codes for URLs, text, WiFi, contact cards (vCard).
- **Invoice Generator** - Create professional invoices with 5 templates and auto-calculations.
- **Signature Maker** - Extract signatures from photos with transparent background.
- **Text Diff Tool** - Compare text files with side-by-side, unified, or inline views.

## 🔍 Search Keywords

Perfect for users searching for: offline pdf tools, pdf merger offline, compress pdf offline, passport photo maker, background remover, image compressor, free pdf editor, no upload pdf tools, privacy-first tools, browser-based pdf tools, local pdf processing, offline image editor, pdf tools without upload, secure pdf editor, offline document tools, client-side pdf processing, javascript pdf tools, web-based pdf editor, offline invoice generator, qr code generator offline

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/offlinesuite.git
cd offlinesuite

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
offlinesuite/
├── public/              # Static assets
├── src/
│   ├── components/      # Shared UI components
│   │   └── Layout.jsx   # Main app layout
│   ├── pages/           # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── ToolPage.jsx
│   │   └── NotFound.jsx
│   ├── tools/           # Individual tools
│   │   ├── registry.js  # Tool registration
│   │   ├── passport-photo/
│   │   │   ├── index.jsx
│   │   │   └── config.js
│   │   └── pdf-merger/
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding a New Tool

1. Create a new folder in `src/tools/your-tool-name/`
2. Create your tool component in `index.jsx`
3. Register it in `src/tools/registry.js`

See [TOOLS_GUIDE.md](TOOLS_GUIDE.md) for detailed instructions.

## ✨ Features

### 🌓 Dark Mode
- Automatic system theme detection
- Toggle between light and dark themes
- Preference saved locally
- Smooth transitions

See [DARK_MODE_GUIDE.md](DARK_MODE_GUIDE.md) for implementation details.

### ♿ Accessibility
- WCAG 2.1 Level AA compliant
- Full keyboard navigation support
- Screen reader friendly
- High contrast color ratios
- Focus indicators on all interactive elements

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for complete guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [@imgly/background-removal](https://www.npmjs.com/package/@imgly/background-removal) - AI background removal

---

**Made with ❤️ for privacy-conscious users**
