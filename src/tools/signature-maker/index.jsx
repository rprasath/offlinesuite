/**
 * Signature Maker - Extract signature from photo with transparent background
 */

import { useState, useRef, useEffect } from 'react'
import { removeBackground } from '@imgly/background-removal'
import { EXPORT_FORMATS, MAX_IMAGE_SIZE, CROP_MIN_SIZE, DEFAULT_SETTINGS } from './config'

const getInitialState = () => ({
  currentStep: 1,
  originalImg: null,
  processedImg: null,
  uploadedFile: null,
  isProcessingBg: false,
  brightness: DEFAULT_SETTINGS.brightness,
  contrast: DEFAULT_SETTINGS.contrast,
  threshold: DEFAULT_SETTINGS.threshold,
  invert: DEFAULT_SETTINGS.invert,
  cropRect: null, // { x, y, width, height }
  isCropping: false,
  cropStart: null,
})

export default function SignatureMaker() {
  const [state, setState] = useState(getInitialState)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // Reset to initial state
  const resetState = () => {
    setState(getInitialState())
    setStatus('')
    setError('')
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    setError('')
    setState(prev => ({ ...prev, uploadedFile: file, currentStep: 2, isProcessingBg: true }))
    setStatus('Loading image...')

    try {
      // Load original image
      const img = await loadImage(file)
      setState(prev => ({ ...prev, originalImg: img }))
      
      setStatus('Removing background with AI... This may take 10-30 seconds.')
      
      // Remove background
      const blob = await removeBackground(file)
      const processedImg = await loadImage(blob)
      
      setState(prev => ({
        ...prev,
        processedImg,
        isProcessingBg: false,
        currentStep: 3
      }))
      setStatus('Background removed! Now adjust and crop your signature.')
      
      // Draw on canvas
      setTimeout(() => drawCanvas(), 100)
    } catch (err) {
      console.error('Error processing image:', err)
      setError('Failed to process image. Please try another image.')
      setState(prev => ({ ...prev, isProcessingBg: false }))
      setStatus('')
    }
  }

  // Load image from file/blob
  const loadImage = (source) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      
      if (source instanceof Blob) {
        img.src = URL.createObjectURL(source)
      } else {
        const reader = new FileReader()
        reader.onload = (e) => { img.src = e.target.result }
        reader.onerror = reject
        reader.readAsDataURL(source)
      }
    })
  }

  // Draw processed image on canvas with adjustments
  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = state.processedImg
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    
    // Scale image if too large
    let width = img.width
    let height = img.height
    
    if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
      const scale = MAX_IMAGE_SIZE / Math.max(width, height)
      width *= scale
      height *= scale
    }
    
    canvas.width = width
    canvas.height = height

    // Apply filters
    ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%)`
    ctx.drawImage(img, 0, 0, width, height)
    ctx.filter = 'none'

    // Apply invert if needed
    if (state.invert) {
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]       // Red
        data[i + 1] = 255 - data[i + 1] // Green
        data[i + 2] = 255 - data[i + 2] // Blue
        // Keep alpha as is
      }
      ctx.putImageData(imageData, 0, 0)
    }

    // Draw crop rectangle if exists
    if (state.cropRect) {
      drawCropRect(ctx, state.cropRect)
    }
  }

  // Draw crop rectangle overlay
  const drawCropRect = (ctx, rect) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Semi-transparent overlay outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, rect.y)
    ctx.fillRect(0, rect.y, rect.x, rect.height)
    ctx.fillRect(rect.x + rect.width, rect.y, canvas.width - rect.x - rect.width, rect.height)
    ctx.fillRect(0, rect.y + rect.height, canvas.width, canvas.height - rect.y - rect.height)

    // Crop border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

    // Corner handles
    const handleSize = 10
    ctx.fillStyle = '#3b82f6'
    const corners = [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x, rect.y + rect.height],
      [rect.x + rect.width, rect.y + rect.height]
    ]
    corners.forEach(([x, y]) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    })
  }

  // Handle mouse down on canvas (start crop)
  const handleCanvasMouseDown = (e) => {
    if (!state.processedImg) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    setState(prev => ({
      ...prev,
      isCropping: true,
      cropStart: { x, y },
      cropRect: { x, y, width: 0, height: 0 }
    }))
  }

  // Handle mouse move (draw crop)
  const handleCanvasMouseMove = (e) => {
    if (!state.isCropping || !state.cropStart) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    const width = x - state.cropStart.x
    const height = y - state.cropStart.y

    // Normalize rect (handle negative width/height)
    const cropRect = {
      x: width >= 0 ? state.cropStart.x : x,
      y: height >= 0 ? state.cropStart.y : y,
      width: Math.abs(width),
      height: Math.abs(height)
    }

    setState(prev => ({ ...prev, cropRect }))
    drawCanvas()
  }

  // Handle mouse up (finish crop)
  const handleCanvasMouseUp = () => {
    if (state.isCropping) {
      setState(prev => ({ ...prev, isCropping: false, cropStart: null }))
      
      // Remove crop if too small
      if (state.cropRect && (state.cropRect.width < CROP_MIN_SIZE || state.cropRect.height < CROP_MIN_SIZE)) {
        setState(prev => ({ ...prev, cropRect: null }))
        drawCanvas()
      }
    }
  }

  // Clear crop
  const clearCrop = () => {
    setState(prev => ({ ...prev, cropRect: null }))
    drawCanvas()
  }

  // Update adjustment values
  const updateAdjustment = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }))
  }

  // Redraw canvas when adjustments change
  useEffect(() => {
    if (state.processedImg && state.currentStep === 3) {
      drawCanvas()
    }
  }, [state.brightness, state.contrast, state.invert])

  // Export signature
  const exportSignature = async (format) => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Create temporary canvas for export
      const exportCanvas = document.createElement('canvas')
      const ctx = exportCanvas.getContext('2d')

      const sourceCanvas = canvas
      const rect = state.cropRect || { x: 0, y: 0, width: canvas.width, height: canvas.height }

      exportCanvas.width = rect.width
      exportCanvas.height = rect.height

      // For JPEG, fill with white background
      if (format.mimeType === 'image/jpeg') {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, rect.width, rect.height)
      }

      // Draw cropped area
      ctx.drawImage(
        sourceCanvas,
        rect.x, rect.y, rect.width, rect.height,
        0, 0, rect.width, rect.height
      )

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `signature-${Date.now()}.${format.id}`
        a.click()
        URL.revokeObjectURL(url)
        setStatus(`Signature exported as ${format.label}!`)
      }, format.mimeType, format.quality)
    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export signature')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">✍️ Signature Maker</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Extract your signature from a photo with transparent background - perfect for signing PDFs
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        <StepIndicator step={1} current={state.currentStep} label="Upload" />
        <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
        <StepIndicator step={2} current={state.currentStep} label="Process" />
        <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
        <StepIndicator step={3} current={state.currentStep} label="Adjust & Export" />
      </div>

      {/* Status Messages */}
      {status && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300 transition-colors">
          {status}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 transition-colors">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {state.currentStep === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              📁 Upload Signature Photo
            </button>
            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              <p className="mb-2">Tips for best results:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>Use a photo with good lighting</li>
                <li>Sign with dark ink on white/light paper</li>
                <li>Ensure signature is clear and visible</li>
                <li>Avoid shadows or reflections</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {state.currentStep === 2 && state.isProcessingBg && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 transition-colors">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-700 dark:text-gray-300">Processing your signature...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Using AI to remove background</p>
          </div>
        </div>
      )}

      {/* Step 3: Adjust and Export */}
      {state.currentStep === 3 && state.processedImg && (
        <div className="space-y-6">
          {/* Canvas Container */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Adjust & Crop</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Draw a rectangle on the canvas to crop. Use sliders to adjust appearance.
              </p>
            </div>
            
            <div className="flex justify-center mb-4" style={{ maxHeight: '600px', overflow: 'auto' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair max-w-full transition-colors"
                style={{ 
                  background: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                }}
              />
            </div>

            {state.cropRect && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={clearCrop}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear Crop
                </button>
              </div>
            )}
          </div>

          {/* Adjustments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brightness: {state.brightness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={state.brightness}
                  onChange={(e) => updateAdjustment('brightness', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contrast: {state.contrast}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={state.contrast}
                  onChange={(e) => updateAdjustment('contrast', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.invert}
                    onChange={(e) => updateAdjustment('invert', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invert Colors (useful for light signatures on dark paper)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <h3 className="text-lg font-semibold mb-4">Export Signature</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXPORT_FORMATS.map(format => (
                <button
                  key={format.id}
                  onClick={() => exportSignature(format)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ⬇️ {format.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              💡 Tip: PNG format is best for PDF signing as it maintains transparency
            </p>
          </div>

          {/* Start Over */}
          <div className="text-center">
            <button
              onClick={resetState}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors"
            >
              Start Over with New Image
            </button>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 transition-colors">
        🔒 <strong>Privacy First:</strong> All processing happens locally in your browser. Your signature never leaves your device.
      </div>
    </div>
  )
}

// Step Indicator Component
function StepIndicator({ step, current, label }) {
  const isActive = step === current
  const isCompleted = step < current

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          isActive
            ? 'bg-blue-600 text-white'
            : isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
      >
        {isCompleted ? '✓' : step}
      </div>
      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  )
}
