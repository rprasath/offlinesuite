/**
 * Image Compressor - Configuration
 */

export const config = {
  supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 20,
}

export const qualityPresets = [
  { id: 'low', label: 'Low Quality', quality: 0.5, description: 'Smallest file size' },
  { id: 'medium', label: 'Medium Quality', quality: 0.7, description: 'Balanced size/quality' },
  { id: 'high', label: 'High Quality', quality: 0.85, description: 'Good quality' },
  { id: 'custom', label: 'Custom', quality: 0.8, description: 'Adjust manually' },
]

export const formatOptions = [
  { id: 'original', label: 'Keep Original Format', icon: '📄' },
  { id: 'jpg', label: 'Convert to JPG', icon: '🖼️' },
  { id: 'webp', label: 'Convert to WebP', icon: '✨' },
]

export const defaultSettings = {
  qualityPreset: 'high',
  quality: 0.85,
  format: 'original',
  maintainAspectRatio: true,
}
