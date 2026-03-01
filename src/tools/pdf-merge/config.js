/**
 * PDF Merge Tool - Configuration
 */

export const config = {
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  maxFiles: 50,
  supportedTypes: ['application/pdf'],
  acceptedExtensions: '.pdf',
}

export const rotationOptions = [
  { value: 0, label: 'No rotation' },
  { value: 90, label: 'Rotate 90° CW' },
  { value: 180, label: 'Rotate 180°' },
  { value: 270, label: 'Rotate 90° CCW' },
]

export const qualityOptions = [
  {
    id: 'compressed',
    label: 'Compressed',
    description: 'Smallest file (~50% smaller)',
    icon: '📦',
    // Render at lower DPI and use JPEG compression
    scale: 1.0,        // Render scale (1.0 = 72 DPI equivalent)
    imageQuality: 0.5, // JPEG quality (0-1)
    useCompression: true,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Good quality & size balance',
    icon: '📄',
    scale: 1.5,        // ~108 DPI equivalent
    imageQuality: 0.75,
    useCompression: true,
  },
  {
    id: 'high-quality',
    label: 'Original',
    description: 'Keep original quality',
    icon: '✨',
    scale: null,       // null = don't re-render, keep original
    imageQuality: null,
    useCompression: false,
  },
]
