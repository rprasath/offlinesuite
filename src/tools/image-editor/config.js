/**
 * Image Editor Configuration
 */

export const config = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'],
}

export const filters = [
  { id: 'none', name: 'Original', apply: () => {} },
  { id: 'grayscale', name: 'Grayscale', apply: (ctx, canvas) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = data[i + 1] = data[i + 2] = avg
    }
    ctx.putImageData(imageData, 0, 0)
  }},
  { id: 'sepia', name: 'Sepia', apply: (ctx, canvas) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
    }
    ctx.putImageData(imageData, 0, 0)
  }},
  { id: 'invert', name: 'Invert', apply: (ctx, canvas) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    ctx.putImageData(imageData, 0, 0)
  }},
  { id: 'vintage', name: 'Vintage', apply: (ctx, canvas) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.2)
      data[i + 1] = Math.min(255, data[i + 1] * 0.9)
      data[i + 2] = Math.min(255, data[i + 2] * 0.7)
    }
    ctx.putImageData(imageData, 0, 0)
  }},
]

export const exportFormats = [
  { value: 'png', label: 'PNG (Lossless)' },
  { value: 'jpeg', label: 'JPEG (Smaller)' },
  { value: 'webp', label: 'WebP (Modern)' },
]

export const modes = [
  { value: 'adjust', label: 'Adjust', icon: '🎨' },
  { value: 'resize', label: 'Resize', icon: '📐' },
  { value: 'crop', label: 'Crop', icon: '✂️' },
]

export const aspectRatios = [
  { value: 'free', label: 'Free', ratio: null },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '3:2', label: '3:2', ratio: 3 / 2 },
]

export const presetSizes = [
  { label: 'Instagram Square', width: 1080, height: 1080 },
  { label: 'Instagram Story', width: 1080, height: 1920 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720 },
  { label: 'HD (1080p)', width: 1920, height: 1080 },
]

export const defaultSettings = {
  mode: 'adjust',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sharpen: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
  filter: 'none',
  format: 'png',
  quality: 0.9,
  // Resize settings
  resizeWidth: 800,
  resizeHeight: 600,
  maintainAspect: true,
  // Crop settings
  cropX: 0,
  cropY: 0,
  cropWidth: 0,
  cropHeight: 0,
  cropAspect: 'free',
}
