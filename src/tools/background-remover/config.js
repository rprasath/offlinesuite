/**
 * Background Remover Configuration
 */

export const config = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  maxFiles: 10,
  supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

export const exportFormats = [
  { value: 'png', label: 'PNG (Transparent)' },
  { value: 'jpeg', label: 'JPEG (With background color)' },
  { value: 'webp', label: 'WebP (Modern)' },
]

export const backgroundColors = [
  { value: 'transparent', label: 'Transparent', hex: null },
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'gray', label: 'Gray', hex: '#808080' },
  { value: 'red', label: 'Red', hex: '#FF0000' },
  { value: 'blue', label: 'Blue', hex: '#0000FF' },
  { value: 'green', label: 'Green', hex: '#00FF00' },
  { value: 'custom', label: 'Custom Color', hex: null },
]

export const qualityPresets = [
  { value: 'low', label: 'Low (Fast)', config: { model: 'small' } },
  { value: 'medium', label: 'Medium (Balanced)', config: { model: 'medium' } },
  { value: 'high', label: 'High (Best Quality)', config: { model: 'medium' } },
]

export const defaultSettings = {
  format: 'png',
  background: 'transparent',
  customColor: '#FFFFFF',
  quality: 'medium',
  jpegQuality: 0.9,
}
