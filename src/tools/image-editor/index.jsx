/**
 * Image Editor - Complete image editing with adjustments, resize, and crop
 */

import { useState, useRef, useEffect } from 'react'
import { config, filters, exportFormats, defaultSettings, modes, aspectRatios, presetSizes } from './config'

export default function ImageEditor() {
  const [originalImage, setOriginalImage] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [isCropping, setIsCropping] = useState(false)
  const [cropStart, setCropStart] = useState(null)
  const [currentCrop, setCurrentCrop] = useState(null)
  
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // Apply all effects
  const applyAllEffects = () => {
    if (!originalImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Determine canvas size based on mode
    let targetWidth = originalImage.width
    let targetHeight = originalImage.height

    if (settings.mode === 'resize') {
      targetWidth = settings.resizeWidth
      targetHeight = settings.resizeHeight
    } else if (settings.mode === 'crop' && settings.cropWidth > 0) {
      targetWidth = settings.cropWidth
      targetHeight = settings.cropHeight
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply CSS filters
    const filterString = [
      `brightness(${settings.brightness}%)`,
      `contrast(${settings.contrast}%)`,
      `saturate(${settings.saturation}%)`,
      `hue-rotate(${settings.hue}deg)`,
      settings.blur > 0 ? `blur(${settings.blur}px)` : '',
    ].filter(Boolean).join(' ')

    ctx.filter = filterString
    ctx.save()
    
    // Apply transformations
    if (settings.rotation !== 0 || settings.flipH || settings.flipV) {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      ctx.translate(centerX, centerY)
      if (settings.rotation !== 0) {
        ctx.rotate((settings.rotation * Math.PI) / 180)
      }
      ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1)
      ctx.translate(-centerX, -centerY)
    }
    
    // Draw the image based on mode
    if (settings.mode === 'crop' && settings.cropWidth > 0) {
      // Draw cropped portion
      ctx.drawImage(
        originalImage,
        settings.cropX, settings.cropY, settings.cropWidth, settings.cropHeight,
        0, 0, canvas.width, canvas.height
      )
    } else if (settings.mode === 'resize') {
      // Draw resized image
      ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight)
    } else {
      // Draw original
      ctx.drawImage(originalImage, 0, 0)
    }
    
    ctx.restore()
    ctx.filter = 'none'

    // Apply custom filter
    const selectedFilter = filters.find(f => f.id === settings.filter)
    if (selectedFilter && selectedFilter.id !== 'none') {
      selectedFilter.apply(ctx, canvas)
    }

    // Sharpen effect
    if (settings.sharpen > 0) {
      applySharpen(ctx, canvas, settings.sharpen)
    }

    // Draw crop overlay if in crop mode
    if (settings.mode === 'crop' && currentCrop && isCropping) {
      drawCropOverlay(ctx, currentCrop)
    }
  }

  useEffect(() => {
    if (originalImage && canvasRef.current) {
      applyAllEffects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, settings, currentCrop, isCropping])

  // Initialize resize dimensions when image loads
  useEffect(() => {
    if (originalImage && settings.resizeWidth === 800) {
      setSettings(s => ({
        ...s,
        resizeWidth: originalImage.width,
        resizeHeight: originalImage.height,
      }))
    }
  }, [originalImage, settings.resizeWidth])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!config.supportedTypes.includes(file.type)) {
      setError('Please upload a valid image file.')
      return
    }

    if (file.size > config.maxFileSize) {
      setError(`File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setOriginalImage(img)
        setSettings(s => ({
          ...s,
          resizeWidth: img.width,
          resizeHeight: img.height,
        }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  // Crop handlers
  const handleCanvasMouseDown = (e) => {
    if (settings.mode !== 'crop') return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = originalImage.width / rect.width
    const scaleY = originalImage.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setCropStart({ x, y })
    setIsCropping(true)
  }

  const handleCanvasMouseMove = (e) => {
    if (!isCropping || !cropStart || settings.mode !== 'crop') return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = originalImage.width / rect.width
    const scaleY = originalImage.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    let width = x - cropStart.x
    let height = y - cropStart.y
    
    // Apply aspect ratio if needed
    const selectedAspect = aspectRatios.find(a => a.value === settings.cropAspect)
    if (selectedAspect && selectedAspect.ratio) {
      height = width / selectedAspect.ratio
    }
    
    setCurrentCrop({ x: cropStart.x, y: cropStart.y, width, height })
  }

  const handleCanvasMouseUp = () => {
    if (!isCropping || !currentCrop) return
    
    // Normalize crop values
    const x = currentCrop.width >= 0 ? currentCrop.x : currentCrop.x + currentCrop.width
    const y = currentCrop.height >= 0 ? currentCrop.y : currentCrop.y + currentCrop.height
    const width = Math.abs(currentCrop.width)
    const height = Math.abs(currentCrop.height)
    
    setSettings(s => ({
      ...s,
      cropX: Math.max(0, x),
      cropY: Math.max(0, y),
      cropWidth: Math.min(width, originalImage.width - x),
      cropHeight: Math.min(height, originalImage.height - y),
    }))
    
    setIsCropping(false)
    setCropStart(null)
    setCurrentCrop(null)
  }

  const drawCropOverlay = (ctx, crop) => {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)
    ctx.restore()
  }

  const applySharpen = (ctx, canvas, amount) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const w = canvas.width
    const h = canvas.height
    
    const factor = amount / 10
    const weights = [0, -factor, 0, -factor, 1 + 4 * factor, -factor, 0, -factor, 0]
    const side = 3
    const halfSide = 1
    const output = ctx.createImageData(w, h)
    const dst = output.data
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstOff = (y * w + x) * 4
        let r = 0, g = 0, b = 0
        
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide
            const scx = x + cx - halfSide
            
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcOff = (scy * w + scx) * 4
              const wt = weights[cy * side + cx]
              r += data[srcOff] * wt
              g += data[srcOff + 1] * wt
              b += data[srcOff + 2] * wt
            }
          }
        }
        
        dst[dstOff] = Math.min(255, Math.max(0, r))
        dst[dstOff + 1] = Math.min(255, Math.max(0, g))
        dst[dstOff + 2] = Math.min(255, Math.max(0, b))
        dst[dstOff + 3] = data[dstOff + 3]
      }
    }
    
    ctx.putImageData(output, 0, 0)
  }

  const downloadImage = () => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const extension = settings.format === 'jpeg' ? 'jpg' : settings.format
      link.href = url
      link.download = fileName.replace(/\.[^.]+$/, `_edited.${extension}`)
      link.click()
      URL.revokeObjectURL(url)
      setIsProcessing(false)
    }, `image/${settings.format}`, settings.quality)
  }

  const resetSettings = () => {
    setSettings({ ...defaultSettings, resizeWidth: originalImage.width, resizeHeight: originalImage.height })
  }

  const resetImage = () => {
    setOriginalImage(null)
    setFileName('')
    setSettings(defaultSettings)
    setError('')
  }

  const handleResize = (width, height) => {
    if (settings.maintainAspect) {
      const ratio = originalImage.width / originalImage.height
      if (width !== settings.resizeWidth) {
        setSettings({ ...settings, resizeWidth: width, resizeHeight: Math.round(width / ratio) })
      } else {
        setSettings({ ...settings, resizeHeight: height, resizeWidth: Math.round(height * ratio) })
      }
    } else {
      setSettings({ ...settings, resizeWidth: width, resizeHeight: height })
    }
  }

  const applyPreset = (preset) => {
    const ratio = preset.width / preset.height
    setSettings({ ...settings, resizeWidth: preset.width, resizeHeight: preset.height })
  }

  const applyCrop = () => {
    if (settings.cropWidth > 0) {
      // Apply crop - make it the new "original"
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = settings.cropWidth
      tempCanvas.height = settings.cropHeight
      const ctx = tempCanvas.getContext('2d')
      ctx.drawImage(
        originalImage,
        settings.cropX, settings.cropY, settings.cropWidth, settings.cropHeight,
        0, 0, settings.cropWidth, settings.cropHeight
      )
      
      const newImg = new Image()
      newImg.onload = () => {
        setOriginalImage(newImg)
        setSettings(s => ({
          ...s,
          cropX: 0,
          cropY: 0,
          cropWidth: 0,
          cropHeight: 0,
          resizeWidth: newImg.width,
          resizeHeight: newImg.height,
        }))
      }
      newImg.src = tempCanvas.toDataURL()
    }
  }

  const cancelCrop = () => {
    setSettings(s => ({
      ...s,
      cropX: 0,
      cropY: 0,
      cropWidth: 0,
      cropHeight: 0,
    }))
    setIsCropping(false)
    setCropStart(null)
    setCurrentCrop(null)
  }

  if (!originalImage) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Image Editor</h1>
          <p className="text-gray-600 dark:text-gray-400">Edit, resize, crop, and apply filters to your images</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 transition-colors">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="text-center">
            <div className="mb-4 text-6xl">🖼️</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Upload Image to Edit
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Supports JPG, PNG, WebP, BMP up to {config.maxFileSize / 1024 / 1024}MB
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">✨ Features</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Adjust:</strong> Brightness, contrast, saturation, hue, blur, sharpen, rotate, flip</li>
            <li>• <strong>Resize:</strong> Change dimensions with preset sizes or custom values</li>
            <li>• <strong>Crop:</strong> Select and crop any area of your image</li>
            <li>• <strong>Filters:</strong> Apply grayscale, sepia, invert, and vintage effects</li>
            <li>• <strong>Export:</strong> Download as PNG, JPEG, or WebP</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1800px] mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{fileName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {originalImage.width} × {originalImage.height}px
            {settings.mode === 'resize' && ` → ${settings.resizeWidth} × ${settings.resizeHeight}px`}
            {settings.mode === 'crop' && settings.cropWidth > 0 && ` → ${settings.cropWidth} × ${settings.cropHeight}px`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetSettings}
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            Reset
          </button>
          <button
            onClick={resetImage}
            className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
          >
            New Image
          </button>
          <button
            onClick={downloadImage}
            disabled={isProcessing}
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
          >
            {isProcessing ? 'Processing...' : 'Download'}
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mb-6 flex gap-2">
        {modes.map(mode => (
          <button
            key={mode.value}
            onClick={() => setSettings({ ...settings, mode: mode.value })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              settings.mode === mode.value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="col-span-3 space-y-4">
          {settings.mode === 'adjust' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Adjustments</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Brightness: {settings.brightness}%</label>
                    <input type="range" min="0" max="200" value={settings.brightness} onChange={(e) => setSettings({ ...settings, brightness: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Contrast: {settings.contrast}%</label>
                    <input type="range" min="0" max="200" value={settings.contrast} onChange={(e) => setSettings({ ...settings, contrast: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Saturation: {settings.saturation}%</label>
                    <input type="range" min="0" max="200" value={settings.saturation} onChange={(e) => setSettings({ ...settings, saturation: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Hue: {settings.hue}°</label>
                    <input type="range" min="0" max="360" value={settings.hue} onChange={(e) => setSettings({ ...settings, hue: parseInt(e.target.value) })} className="w-full" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Effects</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Blur: {settings.blur}px</label>
                    <input type="range" min="0" max="20" value={settings.blur} onChange={(e) => setSettings({ ...settings, blur: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Sharpen: {settings.sharpen}</label>
                    <input type="range" min="0" max="10" value={settings.sharpen} onChange={(e) => setSettings({ ...settings, sharpen: parseInt(e.target.value) })} className="w-full" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Transform</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Rotation: {settings.rotation}°</label>
                    <input type="range" min="0" max="360" value={settings.rotation} onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSettings({ ...settings, flipH: !settings.flipH })} className={`flex-1 px-3 py-2 text-xs rounded-lg transition ${settings.flipH ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Flip H</button>
                    <button onClick={() => setSettings({ ...settings, flipV: !settings.flipV })} className={`flex-1 px-3 py-2 text-xs rounded-lg transition ${settings.flipV ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Flip V</button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Filters</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map(filter => (
                    <button key={filter.id} onClick={() => setSettings({ ...settings, filter: filter.id })} className={`px-2 py-1.5 text-xs rounded-lg transition ${settings.filter === filter.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {settings.mode === 'resize' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Dimensions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Width (px)</label>
                    <input type="number" value={settings.resizeWidth} onChange={(e) => handleResize(parseInt(e.target.value) || 0, settings.resizeHeight)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Height (px)</label>
                    <input type="number" value={settings.resizeHeight} onChange={(e) => handleResize(settings.resizeWidth, parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={settings.maintainAspect} onChange={(e) => setSettings({ ...settings, maintainAspect: e.target.checked })} className="rounded" />
                    <span className="text-gray-700 dark:text-gray-300">Maintain aspect ratio</span>
                  </label>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Presets</h3>
                <div className="space-y-2">
                  {presetSizes.map((preset, idx) => (
                    <button key={idx} onClick={() => applyPreset(preset)} className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{preset.label}</div>
                      <div className="text-gray-500 dark:text-gray-400">{preset.width} × {preset.height}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {settings.mode === 'crop' && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Crop Tool</h3>
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Click and drag on the image to select an area to crop.</p>
                  
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {aspectRatios.map(ratio => (
                        <button key={ratio.value} onClick={() => setSettings({ ...settings, cropAspect: ratio.value })} className={`px-2 py-1.5 text-xs rounded-lg transition ${settings.cropAspect === ratio.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {settings.cropWidth > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600 mb-2">Selection: {Math.round(settings.cropWidth)} × {Math.round(settings.cropHeight)}px</p>
                      <div className="flex gap-2">
                        <button onClick={applyCrop} className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Apply Crop</button>
                        <button onClick={cancelCrop} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-gray-100">Export</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Format</label>
                <select value={settings.format} onChange={(e) => setSettings({ ...settings, format: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                  {exportFormats.map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>
              {settings.format !== 'png' && (
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Quality: {Math.round(settings.quality * 100)}%</label>
                  <input type="range" min="0.1" max="1" step="0.1" value={settings.quality} onChange={(e) => setSettings({ ...settings, quality: parseFloat(e.target.value) })} className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="col-span-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center" style={{ minHeight: '600px' }}>
            <div 
              ref={containerRef}
              className="relative"
              style={{ 
                backgroundImage: 'repeating-conic-gradient(#f3f4f6 0% 25%, transparent 0% 50%) 50% / 20px 20px',
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="max-w-full max-h-[calc(100vh-300px)] h-auto"
                style={{ 
                  cursor: settings.mode === 'crop' ? 'crosshair' : 'default',
                  imageRendering: 'high-quality'
                }}
              />
              {settings.mode === 'crop' && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Click and drag to select crop area
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="col-span-3 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 transition-colors">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">💡 Tips</h3>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              {settings.mode === 'adjust' && (
                <>
                  <li>• Adjust sliders in real-time</li>
                  <li>• Combine multiple filters</li>
                  <li>• Use rotation for corrections</li>
                </>
              )}
              {settings.mode === 'resize' && (
                <>
                  <li>• Maintain aspect ratio for best results</li>
                  <li>• Use presets for common sizes</li>
                  <li>• Larger = better quality</li>
                </>
              )}
              {settings.mode === 'crop' && (
                <>
                  <li>• Drag to select crop area</li>
                  <li>• Use aspect ratios for precision</li>
                  <li>• Click "Apply" to finalize</li>
                </>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold mb-2 text-sm">Image Info</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Original:</strong> {originalImage.width} × {originalImage.height}px</p>
              {settings.mode === 'resize' && (
                <p><strong>Output:</strong> {settings.resizeWidth} × {settings.resizeHeight}px</p>
              )}
              {settings.mode === 'crop' && settings.cropWidth > 0 && (
                <p><strong>Crop:</strong> {Math.round(settings.cropWidth)} × {Math.round(settings.cropHeight)}px</p>
              )}
              <p><strong>Format:</strong> {settings.format.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
