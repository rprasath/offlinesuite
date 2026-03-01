/**
 * PDF Signer Configuration
 */

export const config = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  supportedTypes: ['application/pdf'],
}

export const signaturePositions = [
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'center', label: 'Center' },
  { value: 'custom', label: 'Custom Position' },
]

export const signaturePages = [
  { value: 'all', label: 'All Pages' },
  { value: 'first', label: 'First Page Only' },
  { value: 'last', label: 'Last Page Only' },
  { value: 'specific', label: 'Specific Pages' },
]

export const defaultSettings = {
  position: 'bottom-right',
  pageSelection: 'last',
  specificPages: '',
  offsetX: 50,
  offsetY: 50,
  width: 150,
  height: 75,
  opacity: 1,
  fontSize: 14,
  textColor: '#000000',
}

export const viewerSettings = {
  maxPreviewPages: 40,
  initialScale: 1,
  minScale: 0.5,
  maxScale: 3,
  thumbScale: 0.35,
}
