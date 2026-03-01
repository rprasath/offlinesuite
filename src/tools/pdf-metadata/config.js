/**
 * PDF Metadata Editor - Configuration
 */

export const config = {
  supportedTypes: ['application/pdf'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
}

export const metadataFields = [
  { id: 'title', label: 'Title', placeholder: 'Document title', icon: '📝' },
  { id: 'author', label: 'Author', placeholder: 'Author name', icon: '👤' },
  { id: 'subject', label: 'Subject', placeholder: 'Document subject', icon: '📋' },
  { id: 'keywords', label: 'Keywords', placeholder: 'keyword1, keyword2, keyword3', icon: '🏷️' },
  { id: 'creator', label: 'Creator', placeholder: 'Application that created the PDF', icon: '🛠️' },
  { id: 'producer', label: 'Producer', placeholder: 'PDF producer software', icon: '⚙️' },
]
