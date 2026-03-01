/**
 * PDF Watermark - Configuration
 */

export const config = {
  supportedTypes: ['application/pdf'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
}

export const watermarkTypes = [
  { id: 'text', label: 'Text Watermark', icon: '📝' },
  { id: 'image', label: 'Image Watermark', icon: '🖼️' },
]

export const positions = [
  { id: 'center', label: 'Center', x: 0.5, y: 0.5 },
  { id: 'top-left', label: 'Top Left', x: 0.1, y: 0.9 },
  { id: 'top-center', label: 'Top Center', x: 0.5, y: 0.9 },
  { id: 'top-right', label: 'Top Right', x: 0.9, y: 0.9 },
  { id: 'middle-left', label: 'Middle Left', x: 0.1, y: 0.5 },
  { id: 'middle-right', label: 'Middle Right', x: 0.9, y: 0.5 },
  { id: 'bottom-left', label: 'Bottom Left', x: 0.1, y: 0.1 },
  { id: 'bottom-center', label: 'Bottom Center', x: 0.5, y: 0.1 },
  { id: 'bottom-right', label: 'Bottom Right', x: 0.9, y: 0.1 },
  { id: 'diagonal', label: 'Diagonal (Repeating)', x: 0.5, y: 0.5 },
  { id: 'custom', label: 'Custom Position', x: 0.5, y: 0.5 },
]

export const fontSizes = [
  { value: 12, label: 'Small' },
  { value: 24, label: 'Medium' },
  { value: 36, label: 'Large' },
  { value: 48, label: 'Extra Large' },
  { value: 72, label: 'Huge' },
]

export const colors = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#FF0000', label: 'Red' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#00FF00', label: 'Green' },
  { value: '#FFD700', label: 'Gold' },
  { value: '#808080', label: 'Gray' },
]

export const defaultSettings = {
  type: 'text',
  text: 'CONFIDENTIAL',
  fontSize: 36,
  color: '#FF0000',
  opacity: 0.3,
  rotation: 0,
  position: 'center',
  customX: 50,
  customY: 50,
  imageScale: 1,
  applyToAllPages: true,
  pageRange: '',
}
