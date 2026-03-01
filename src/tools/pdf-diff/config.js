/**
 * PDF Diff Configuration
 */

export const config = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedTypes: ['application/pdf'],
}

export const comparisonModes = [
  { value: 'text', label: 'Text Comparison', description: 'Compare text content extracted from PDFs' },
  { value: 'visual', label: 'Visual Comparison', description: 'Compare PDF pages visually (side-by-side)' },
]

export const viewOptions = {
  showPageNumbers: true,
  highlightDifferences: true,
  ignoreWhitespace: false,
  ignoreCase: false,
}
