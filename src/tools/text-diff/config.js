/**
 * Text Diff Configuration
 */

export const config = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedTypes: ['text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml'],
}

export const diffModes = [
  { value: 'side-by-side', label: 'Side by Side' },
  { value: 'unified', label: 'Unified' },
  { value: 'inline', label: 'Inline' },
]

export const viewOptions = {
  showLineNumbers: true,
  ignoreWhitespace: false,
  ignoreCase: false,
  contextLines: 3,
}

export const themes = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
]
