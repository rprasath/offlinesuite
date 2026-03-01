/**
 * Tool Registry - Central registry for all OfflineSuite tools
 * 
 * To add a new tool:
 * 1. Create your tool component in src/tools/your-tool-name/index.jsx
 * 2. Add a loader entry below with `() => import('./your-tool-name')`
 * 3. The tool will automatically appear on the dashboard
 */

import {
  Camera,
  Eraser,
  FileArchive,
  FileDiff,
  FileImage,
  FileSearch,
  FileSignature,
  FileText,
  Files,
  Image as ImageIcon,
  PenTool,
  QrCode,
  Receipt,
  Repeat,
  Scissors,
  SlidersHorizontal,
  Stamp,
  Wrench,
} from 'lucide-react'

// Tool Categories
export const toolCategories = {
  image: {
    name: 'Image Tools',
    icon: ImageIcon,
    description: 'Edit, resize, and process images',
  },
  document: {
    name: 'PDF Tools',
    icon: FileText,
    description: 'Work with PDFs and documents',
  },
  // converter: {
  //   name: 'Converters',
  //   icon: Repeat,
  //   description: 'Convert between formats',
  // },
  utility: {
    name: 'Utilities',
    icon: Wrench,
    description: 'Useful Utilities for various tasks',
  },
  // Add more categories as needed
}

// All available tools
export const tools = [
  {
    id: 'passport-photo',
    name: 'Passport Photo Maker',
    description: 'Create professional passport & visa photos with custom sizes, background removal, and print layouts.',
    icon: Camera,
    category: 'image',
    loader: () => import('./passport-photo'),
    isNew: false,
    status: 'active', // 'active' | 'beta' | 'coming-soon'
    keywords: ['passport', 'visa', 'photo', 'id', 'crop', 'resize'],
  },
  {
    id: 'pdf-sign',
    name: 'PDF Signer',
    description: 'Sign PDFs offline with click-to-place signatures, text fill, and page navigation.',
    icon: FileSignature,
    category: 'document',
    loader: () => import('./pdf-sign'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'sign', 'signature', 'digital', 'document', 'authorize'],
  },
  {
    id: 'pdf-merger',
    name: 'PDF Merger',
    description: 'Combine multiple PDF files into one. Reorder, rotate, and organize pages easily.',
    icon: Files,
    category: 'document',
    loader: () => import('./pdf-merge'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'merge', 'combine', 'document', 'rotate', 'reorder'],
  },
  {
    id: 'pdf-editor',
    name: 'PDF Page Editor',
    description: 'Extract, rotate, delete, and split PDF pages in one workspace.',
    icon: Scissors,
    category: 'document',
    loader: () => import('./pdf-editor'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'split', 'extract', 'pages', 'rotate', 'delete', 'organize'],
  },
  {
    id: 'pdf-compress',
    name: 'PDF Compressor',
    description: 'Reduce PDF file sizes with adjustable compression levels. Process multiple files at once.',
    icon: FileArchive,
    category: 'document',
    loader: () => import('./pdf-compress'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'compress', 'reduce', 'size', 'optimize', 'shrink'],
  },
  {
    id: 'signature-maker',
    name: 'Signature Maker',
    description: 'Extract your signature from a photo with transparent background - perfect for signing PDFs.',
    icon: PenTool,
    category: 'image',
    loader: () => import('./signature-maker'),
    isNew: false,
    status: 'active',
    keywords: ['signature', 'sign', 'extract', 'transparent', 'png', 'pdf', 'background'],
  },
  {
    id: 'pdf-watermark',
    name: 'PDF Watermark',
    description: 'Add custom text or image watermarks to PDFs with adjustable opacity, position, and rotation.',
    icon: Stamp,
    category: 'document',
    loader: () => import('./pdf-watermark'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'watermark', 'stamp', 'text', 'image', 'branding', 'protect'],
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    description: 'Convert PDF pages to PNG, JPG, or WebP images with quality and resolution controls.',
    icon: FileImage,
    category: 'document',
    loader: () => import('./pdf-to-images'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'image', 'convert', 'png', 'jpg', 'export', 'pages'],
  },
  {
    id: 'pdf-metadata',
    name: 'PDF Metadata Editor',
    description: 'View and edit PDF metadata including title, author, subject, and keywords.',
    icon: FileText,
    category: 'document',
    loader: () => import('./pdf-metadata'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'metadata', 'properties', 'title', 'author', 'edit'],
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce image file sizes with adjustable quality settings. Batch process multiple images.',
    icon: ImageIcon,
    category: 'image',
    loader: () => import('./image-compressor'),
    isNew: false,
    status: 'active',
    keywords: ['image', 'compress', 'reduce', 'size', 'optimize', 'quality'],
  },
  {
    id: 'image-converter',
    name: 'Image Format Converter',
    description: 'Convert images between JPG, PNG, WebP, BMP formats with optional resizing.',
    icon: Repeat,
    category: 'image',
    loader: () => import('./image-converter'),
    isNew: false,
    status: 'active',
    keywords: ['image', 'convert', 'format', 'jpg', 'png', 'webp', 'resize'],
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Create customizable QR codes for URLs, text, WiFi credentials, and contact cards.',
    icon: QrCode,
    category: 'utility',
    loader: () => import('./qr-generator'),
    isNew: false,
    status: 'active',
    keywords: ['qr', 'code', 'generator', 'url', 'wifi', 'vcard', 'barcode'],
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Create professional invoices with 5 beautiful templates and automatic calculations.',
    icon: Receipt,
    category: 'utility',
    loader: () => import('./invoice-generator'),
    isNew: false,
    status: 'active',
    keywords: ['invoice', 'bill', 'receipt', 'payment', 'business', 'accounting', 'template'],
  },
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'Remove backgrounds from images using AI. Perfect for product photos and portraits.',
    icon: Eraser,
    category: 'image',
    loader: () => import('./background-remover'),
    isNew: false,
    status: 'active',
    keywords: ['background', 'remove', 'transparent', 'cutout', 'ai', 'photo'],
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Complete image editor with filters, adjustments, resize, and crop tools.',
    icon: SlidersHorizontal,
    category: 'image',
    loader: () => import('./image-editor'),
    isNew: false,
    status: 'active',
    keywords: ['image', 'edit', 'filter', 'adjust', 'brightness', 'contrast', 'effects', 'resize', 'crop'],
  },
  {
    id: 'text-diff',
    name: 'Text Diff Tool',
    description: 'Compare two text files with side-by-side, unified, or inline diff views.',
    icon: FileDiff,
    category: 'utility',
    loader: () => import('./text-diff'),
    isNew: false,
    status: 'active',
    keywords: ['text', 'diff', 'compare', 'difference', 'file', 'code'],
  },
  {
    id: 'pdf-diff',
    name: 'PDF Diff Tool',
    description: 'Compare two PDF files with text or visual comparison modes.',
    icon: FileSearch,
    category: 'document',
    loader: () => import('./pdf-diff'),
    isNew: false,
    status: 'active',
    keywords: ['pdf', 'diff', 'compare', 'difference', 'document', 'visual'],
  },
  // Add more tools here as they are developed
]

// Helper functions
export function getToolById(id) {
  return tools.find(tool => tool.id === id) || null
}

export function getToolsByCategory(category) {
  return tools.filter(tool => tool.category === category)
}

export function searchTools(query) {
  const lowerQuery = query.toLowerCase()
  return tools.filter(tool => 
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  )
}

export function getActiveTools() {
  return tools.filter(tool => tool.status === 'active' || tool.status === 'beta')
}
