/**
 * PDF Compress Tool - Configuration
 */

export const config = {
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  maxFiles: 20,
  supportedTypes: ['application/pdf'],
  acceptedExtensions: '.pdf',
}

export const compressionLevels = [
  {
    id: 'maximum',
    label: 'Maximum Compression',
    description: 'Smallest file size, lower quality',
    icon: '📦',
    scale: 0.75,
    imageQuality: 0.4,
  },
  {
    id: 'high',
    label: 'High Compression',
    description: 'Good compression, acceptable quality',
    icon: '🗜️',
    scale: 1.0,
    imageQuality: 0.5,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Balance between size and quality',
    icon: '⚖️',
    scale: 1.25,
    imageQuality: 0.65,
  },
  {
    id: 'light',
    label: 'Light Compression',
    description: 'Minimal compression, good quality',
    icon: '✨',
    scale: 1.5,
    imageQuality: 0.8,
  },
]
