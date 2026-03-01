/**
 * Passport Photo Maker - React Component
 */

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { DOC_SIZES, PRINT_SIZES, REGIONS, DPI, ZOOM_MIN, ZOOM_MAX } from './config'
import { removeBackground } from '@imgly/background-removal'

// Initial state
const getInitialState = () => ({
  currentStep: 1,
  img: null,
  imgLoaded: false,
  uploadedFile: null,
  bgColor: '#ffffff',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
  brightness: 100,
  contrast: 100,
  exposure: 100,
  saturation: 100,
  cropParams: null,
  printSize: '',
  docType: 'us-passport',
  removeBackground: false,
  originalImg: null,
  processedImg: null,
  isProcessingBg: false,
  touches: [],
  lastTouchDistance: 0,
})

export default function PassportPhoto() {
  const [state, setState] = useState(getInitialState)
  const [warning, setWarning] = useState('')
  const [bgStatus, setBgStatus] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [docSearch, setDocSearch] = useState('')
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  
  // Refs
  const cropContainerRef = useRef(null)
  const cropFrameRef = useRef(null)
  const imageLayerRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const docDropdownRef = useRef(null)
  
  // Use ref to track current state for event handlers
  const stateRef = useRef(state)
  stateRef.current = state

  // Get current document size
  const getCurrentDocSize = useCallback(() => {
    return DOC_SIZES[state.docType] || DOC_SIZES['us-passport']
  }, [state.docType])

  // Update crop frame dimensions
  const updateCropFrame = useCallback(() => {
    if (!cropContainerRef.current || !cropFrameRef.current) return

    const { widthPx, heightPx } = getCurrentDocSize()
    const ratio = widthPx / heightPx
    const containerRect = cropContainerRef.current.getBoundingClientRect()
    const padding = 20
    const maxWidth = containerRect.width - padding * 2
    const maxHeight = containerRect.height - padding * 2

    let frameWidth = maxWidth
    let frameHeight = frameWidth / ratio

    if (frameHeight > maxHeight) {
      frameHeight = maxHeight
      frameWidth = frameHeight * ratio
    }

    cropFrameRef.current.style.width = `${frameWidth}px`
    cropFrameRef.current.style.height = `${frameHeight}px`
    cropFrameRef.current.style.left = `${(containerRect.width - frameWidth) / 2}px`
    cropFrameRef.current.style.top = `${(containerRect.height - frameHeight) / 2}px`
  }, [getCurrentDocSize])

  // Clamp offsets to keep image within bounds
  const clampOffsets = useCallback((currentState) => {
    if (!cropFrameRef.current || !cropContainerRef.current || !currentState.img) {
      return currentState
    }

    const frameRect = cropFrameRef.current.getBoundingClientRect()
    const containerRect = cropContainerRef.current.getBoundingClientRect()

    // Make sure we have valid dimensions
    if (frameRect.width === 0 || frameRect.height === 0) {
      return currentState
    }

    const frameX = frameRect.left - containerRect.left
    const frameY = frameRect.top - containerRect.top
    const frameW = frameRect.width
    const frameH = frameRect.height

    const imgW = currentState.img.width * currentState.scale
    const imgH = currentState.img.height * currentState.scale

    const minX = frameX + frameW - imgW
    const maxX = frameX
    const minY = frameY + frameH - imgH
    const maxY = frameY

    let newOffsetX = currentState.offsetX
    let newOffsetY = currentState.offsetY

    if (imgW < frameW) {
      newOffsetX = frameX + (frameW - imgW) / 2
    } else {
      newOffsetX = Math.min(maxX, Math.max(minX, currentState.offsetX))
    }

    if (imgH < frameH) {
      newOffsetY = frameY + (frameH - imgH) / 2
    } else {
      newOffsetY = Math.min(maxY, Math.max(minY, currentState.offsetY))
    }

    return { ...currentState, offsetX: newOffsetX, offsetY: newOffsetY }
  }, [])

  // Fit image initially
  const fitImageInitially = useCallback(() => {
    if (!stateRef.current.img || !cropContainerRef.current || !cropFrameRef.current) return

    const containerRect = cropContainerRef.current.getBoundingClientRect()
    const frameRect = cropFrameRef.current.getBoundingClientRect()

    const frameWidth = frameRect.width
    const frameHeight = frameRect.height
    
    // Make sure frame has been sized
    if (frameWidth === 0 || frameHeight === 0) return

    const img = stateRef.current.img
    let newScale = Math.min(frameWidth / img.width, frameHeight / img.height)
    newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale))

    const imgDisplayWidth = img.width * newScale
    const imgDisplayHeight = img.height * newScale

    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2

    const newOffsetX = containerCenterX - imgDisplayWidth / 2
    const newOffsetY = containerCenterY - imgDisplayHeight / 2

    setState(prev => {
      const newState = {
        ...prev,
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      }
      return clampOffsets(newState)
    })
    setIsReady(true)
  }, [clampOffsets])

  // Handle file select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFromFile(file)
  }

  // Set image from file
  const setImageFromFile = (file) => {
    setWarning('')
    setBgStatus('')
    
    const url = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      setState(prev => ({
        ...prev,
        img,
        imgLoaded: true,
        uploadedFile: file,
        originalImg: null,
        processedImg: null,
        removeBackground: false,
      }))
    }
    
    img.src = url
  }

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setImageFromFile(file)
    }
  }

  // Handle zoom
  const applyZoom = useCallback((newScale, anchorX, anchorY) => {
    if (!stateRef.current.imgLoaded || !cropContainerRef.current) return

    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale))
    const containerRect = cropContainerRef.current.getBoundingClientRect()
    const anchorClientX = anchorX ?? (containerRect.left + containerRect.width / 2)
    const anchorClientY = anchorY ?? (containerRect.top + containerRect.height / 2)

    setState(prev => {
      const imgPointX = (anchorClientX - containerRect.left - prev.offsetX) / prev.scale
      const imgPointY = (anchorClientY - containerRect.top - prev.offsetY) / prev.scale

      const newState = {
        ...prev,
        scale: clamped,
        offsetX: anchorClientX - containerRect.left - imgPointX * clamped,
        offsetY: anchorClientY - containerRect.top - imgPointY * clamped,
      }
      return clampOffsets(newState)
    })
  }, [clampOffsets])

  const handleWheel = useCallback((e) => {
    if (!stateRef.current.imgLoaded) return
    e.preventDefault()
    e.stopPropagation()
    const zoomFactor = Math.exp(-e.deltaY * 0.0025)
    const currentScale = stateRef.current.scale
    applyZoom(currentScale * zoomFactor, e.clientX, e.clientY)
  }, [applyZoom])

  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (!stateRef.current.imgLoaded) return
    e.preventDefault()
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
      startOffsetX: prev.offsetX,
      startOffsetY: prev.offsetY,
    }))
  }

  const handleMouseMove = useCallback((e) => {
    if (!stateRef.current.isDragging) return
    const { dragStartX, dragStartY, startOffsetX, startOffsetY } = stateRef.current
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    setState(prev => clampOffsets({
      ...prev,
      offsetX: startOffsetX + dx,
      offsetY: startOffsetY + dy,
    }))
  }, [clampOffsets])

  const handleMouseUp = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: false }))
  }, [])

  // Touch event handlers for mobile pinch-to-zoom
  const handleTouchStart = useCallback((e) => {
    if (!stateRef.current.imgLoaded) return
    
    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      setState(prev => ({
        ...prev,
        touches: Array.from(e.touches),
        lastTouchDistance: distance,
        isDragging: false,
      }))
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragStartX: touch.clientX,
        dragStartY: touch.clientY,
        startOffsetX: prev.offsetX,
        startOffsetY: prev.offsetY,
        touches: [],
      }))
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!stateRef.current.imgLoaded) return

    if (e.touches.length === 2) {
      e.preventDefault()
      e.stopPropagation()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      if (stateRef.current.lastTouchDistance > 0) {
        const scale = distance / stateRef.current.lastTouchDistance
        const currentScale = stateRef.current.scale
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        applyZoom(currentScale * scale, centerX, centerY)
      }

      setState(prev => ({ ...prev, lastTouchDistance: distance }))
    } else if (e.touches.length === 1 && stateRef.current.isDragging) {
      const touch = e.touches[0]
      const { dragStartX, dragStartY, startOffsetX, startOffsetY } = stateRef.current
      const dx = touch.clientX - dragStartX
      const dy = touch.clientY - dragStartY
      setState(prev => clampOffsets({
        ...prev,
        offsetX: startOffsetX + dx,
        offsetY: startOffsetY + dy,
      }))
    }
  }, [applyZoom, clampOffsets])

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      setState(prev => ({
        ...prev,
        isDragging: false,
        touches: [],
        lastTouchDistance: 0,
      }))
    } else if (e.touches.length === 1) {
      setState(prev => ({
        ...prev,
        touches: [],
        lastTouchDistance: 0,
      }))
    }
  }, [])

  // Handle document type change
  const handleDocumentChange = (docType) => {
    setState(prev => ({ ...prev, docType }))
    setIsDocDropdownOpen(false)
    setDocSearch('')
  }

  // Handle print size change
  const handlePrintSizeChange = (e) => {
    setState(prev => ({ ...prev, printSize: e.target.value }))
  }

  // Handle adjustment changes
  const handleAdjustmentChange = (key, value) => {
    setState(prev => ({ ...prev, [key]: parseFloat(value) }))
  }

  // Reset adjustments
  const resetAdjustments = () => {
    setState(prev => ({
      ...prev,
      brightness: 100,
      contrast: 100,
      exposure: 100,
      saturation: 100,
    }))
  }

  // Get filter string
  const getFilterString = useCallback(() => {
    const brightnessValue = (state.brightness / 100) * (state.exposure / 100)
    const contrastValue = state.contrast / 100
    const saturationValue = state.saturation / 100
    return `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`
  }, [state.brightness, state.contrast, state.exposure, state.saturation])

  // Process background removal
  const processBackgroundRemoval = async () => {
    if (!state.img) return

    const originalImg = state.originalImg || state.img
    
    const canvas = document.createElement('canvas')
    canvas.width = originalImg.width
    canvas.height = originalImg.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(originalImg, 0, 0)

    const inputBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

    const config = {
      debug: false,
      output: {
        format: 'image/png',
        quality: 1.0,
        type: 'foreground'
      }
    }

    const processedBlob = await removeBackground(inputBlob, config)
    
    const url = URL.createObjectURL(processedBlob)
    const transparentImg = new Image()

    await new Promise((resolve, reject) => {
      transparentImg.onload = resolve
      transparentImg.onerror = reject
      transparentImg.src = url
    })

    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = transparentImg.width
    finalCanvas.height = transparentImg.height
    const finalCtx = finalCanvas.getContext('2d')

    finalCtx.fillStyle = '#ffffff'
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
    finalCtx.drawImage(transparentImg, 0, 0)

    const finalImg = new Image()
    await new Promise((resolve, reject) => {
      finalImg.onload = resolve
      finalImg.onerror = reject
      finalImg.src = finalCanvas.toDataURL('image/png')
    })

    URL.revokeObjectURL(url)
    return finalImg
  }

  // Generate preview
  const handleGeneratePreview = async () => {
    if (!state.imgLoaded) return

    // Store original image
    if (!state.originalImg) {
      setState(prev => ({ ...prev, originalImg: prev.img }))
    }

    let imgToUse = state.img

    // Process background removal if checked
    if (state.removeBackground) {
      try {
        setState(prev => ({ ...prev, isProcessingBg: true }))
        setBgStatus('🔄 Processing... This may take 20-60 seconds on first use...')

        const processedImg = await processBackgroundRemoval()
        imgToUse = processedImg
        
        setState(prev => ({ ...prev, img: processedImg, processedImg, isProcessingBg: false }))
        setBgStatus('✓ Background removed!')
      } catch (error) {
        console.error('Background removal failed:', error)
        setBgStatus(`⚠️ Failed: ${error.message || 'Unknown error'}`)
        setState(prev => ({ ...prev, isProcessingBg: false }))
        return
      }
    } else if (state.originalImg) {
      imgToUse = state.originalImg
      setState(prev => ({ ...prev, img: prev.originalImg }))
    }

    // Capture crop parameters
    if (cropContainerRef.current && cropFrameRef.current) {
      const containerRect = cropContainerRef.current.getBoundingClientRect()
      const frameRect = cropFrameRef.current.getBoundingClientRect()

      const frameX = frameRect.left - containerRect.left
      const frameY = frameRect.top - containerRect.top
      const frameW = frameRect.width
      const frameH = frameRect.height

      const sx = (frameX - state.offsetX) / state.scale
      const sy = (frameY - state.offsetY) / state.scale
      const sw = frameW / state.scale
      const sh = frameH / state.scale

      setState(prev => ({
        ...prev,
        cropParams: { sx, sy, sw, sh },
        currentStep: 3,
      }))
    }
  }

  // Render export canvas
  const renderExportCanvas = useCallback(() => {
    if (!previewCanvasRef.current || !state.cropParams || !state.img) return

    const docSize = getCurrentDocSize()
    const ctx = previewCanvasRef.current.getContext('2d')
    
    let canvasWidth, canvasHeight
    
    if (state.printSize && PRINT_SIZES[state.printSize]) {
      const printSize = PRINT_SIZES[state.printSize]
      canvasWidth = printSize.widthPx
      canvasHeight = printSize.heightPx
    } else {
      canvasWidth = docSize.widthPx
      canvasHeight = docSize.heightPx
    }

    previewCanvasRef.current.width = canvasWidth
    previewCanvasRef.current.height = canvasHeight

    const { sx, sy, sw, sh } = state.cropParams

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = state.bgColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.filter = getFilterString()

    if (state.printSize && PRINT_SIZES[state.printSize]) {
      const photoWidth = docSize.widthPx
      const photoHeight = docSize.heightPx

      const cols = Math.floor(canvasWidth / photoWidth)
      const rows = Math.floor(canvasHeight / photoHeight)

      const totalGridWidth = cols * photoWidth
      const totalGridHeight = rows * photoHeight
      const offsetX = (canvasWidth - totalGridWidth) / 2
      const offsetY = (canvasHeight - totalGridHeight) / 2

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * photoWidth
          const y = offsetY + row * photoHeight
          ctx.drawImage(state.img, sx, sy, sw, sh, x, y, photoWidth, photoHeight)
        }
      }
    } else {
      ctx.drawImage(state.img, sx, sy, sw, sh, 0, 0, docSize.widthPx, docSize.heightPx)
    }

    ctx.filter = 'none'
  }, [state.cropParams, state.img, state.printSize, state.bgColor, getCurrentDocSize, getFilterString])

  // Handle export
  const handleExport = () => {
    if (!previewCanvasRef.current) return

    renderExportCanvas()

    const quality = 0.95
    const dataUrl = previewCanvasRef.current.toDataURL('image/jpeg', quality)
    const { label } = getCurrentDocSize()

    let filename
    if (state.printSize && PRINT_SIZES[state.printSize]) {
      const printLabel = PRINT_SIZES[state.printSize].label
      filename = `${label.toLowerCase().replace(/\s+/g, '-')}-${printLabel.toLowerCase().replace(/\s+/g, '-')}-sheet-${Date.now()}.jpg`
    } else {
      filename = `${label.toLowerCase().replace(/\s+/g, '-')}-photo-${Date.now()}.jpg`
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Navigation
  const goToStep = (step) => {
    if (step === 2 && !state.imgLoaded) {
      setWarning('Please upload a photo first')
      return
    }
    setState(prev => ({ ...prev, currentStep: step }))
  }

  // Effects
  useLayoutEffect(() => {
    if (state.currentStep === 2 && state.imgLoaded) {
      // Reset ready state when entering step 2
      setIsReady(false)
      // Use requestAnimationFrame to ensure DOM is ready
      const timer = requestAnimationFrame(() => {
        updateCropFrame()
        // Small delay to ensure crop frame has been positioned
        setTimeout(() => {
          fitImageInitially()
        }, 50)
      })
      return () => cancelAnimationFrame(timer)
    }
  }, [state.currentStep, state.imgLoaded, state.docType, updateCropFrame, fitImageInitially])

  useEffect(() => {
    if (state.currentStep === 3 && state.cropParams) {
      renderExportCanvas()
    }
  }, [state.currentStep, state.cropParams, renderExportCanvas])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    const handleResize = () => {
      if (state.currentStep === 2) {
        updateCropFrame()
        if (state.imgLoaded) fitImageInitially()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state.currentStep, state.imgLoaded, updateCropFrame, fitImageInitially])

  // Attach wheel event listener with passive: false to prevent page zoom
  useEffect(() => {
    const container = cropContainerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Get size info
  const getSizeInfo = () => {
    const { widthPx, heightPx, widthMm, heightMm } = getCurrentDocSize()
    const widthMmDisplay = Number(widthMm.toFixed(1))
    const heightMmDisplay = Number(heightMm.toFixed(1))
    const widthIn = (widthMm / 25.4).toFixed(2)
    const heightIn = (heightMm / 25.4).toFixed(2)
    return {
      output: `Output: ${widthPx} × ${heightPx} px @ ${DPI} DPI`,
      print: `Print size: ${widthMmDisplay} × ${heightMmDisplay} mm (${widthIn} × ${heightIn} in)`,
    }
  }

  // Get print size info
  const getPrintSizeInfo = () => {
    if (!state.printSize) return 'Select a print size to tile multiple photos'
    const printSize = PRINT_SIZES[state.printSize]
    const docSize = getCurrentDocSize()
    const cols = Math.floor(printSize.widthPx / docSize.widthPx)
    const rows = Math.floor(printSize.heightPx / docSize.heightPx)
    const totalPhotos = cols * rows
    return `Will create ${cols}×${rows} grid (${totalPhotos} photos) on ${printSize.label} sheet`
  }

  // Build document groups for searchable dropdown
  const getFilteredDocGroups = () => {
    const query = docSearch.trim().toLowerCase()
    const docsByRegion = {}
    for (const [key, doc] of Object.entries(DOC_SIZES)) {
      const searchableLabel = `${doc.label} ${doc.displayLabel || ''}`.toLowerCase()
      if (query && !searchableLabel.includes(query) && key !== state.docType) continue
      const region = doc.region
      if (!docsByRegion[region]) docsByRegion[region] = []
      docsByRegion[region].push({ key, ...doc })
    }

    const sortedRegions = Object.entries(REGIONS).sort((a, b) => a[1].order - b[1].order)

    const groups = sortedRegions.map(([regionKey, regionData]) => {
      const docs = docsByRegion[regionKey]?.sort((a, b) => a.label.localeCompare(b.label))
      if (!docs || docs.length === 0) return null
      return { regionKey, regionLabel: regionData.label, docs }
    })

    const visibleGroups = groups.filter(Boolean)
    if (visibleGroups.length === 0) {
      return [{
        regionKey: 'current',
        regionLabel: 'Current Selection',
        docs: [{
          key: state.docType,
          ...getCurrentDocSize(),
        }],
      }]
    }

    return visibleGroups
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!docDropdownRef.current || docDropdownRef.current.contains(e.target)) return
      setIsDocDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="p-4 sm:p-6">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto px-4">
        {[1, 2, 3].map((step, index) => (
          <div key={step} className="flex items-center flex-shrink-0">
            <div
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold transition-all text-sm sm:text-base ${
                state.currentStep === step
                  ? 'bg-primary-600 text-white'
                  : state.currentStep > step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {state.currentStep > step ? '✓' : step}
            </div>
            <span className={`ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium whitespace-nowrap ${state.currentStep >= step ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
              {step === 1 ? 'Upload' : step === 2 ? 'Crop' : 'Download'}
            </span>
            {index < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${state.currentStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {state.currentStep === 1 && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>📸</span> Upload Photo
          </h2>
          
          <label
            className="upload-zone flex flex-col items-center justify-center min-h-[250px]"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {state.imgLoaded ? (
              <>
                <div className="text-5xl mb-3 text-green-500">✓</div>
                <strong className="text-green-600 dark:text-green-400 text-lg">Photo uploaded successfully!</strong>
                <span className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  {state.uploadedFile?.name} ({(state.uploadedFile?.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs mt-2">Click to upload a different photo</span>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">📸</div>
                <strong className="text-gray-700 dark:text-gray-300">Drop your photo here</strong>
                <span className="text-gray-500 dark:text-gray-400 text-sm">or click to browse • JPG, PNG, HEIC</span>
              </>
            )}
          </label>

          {warning && <p className="text-red-500 text-sm mt-2">{warning}</p>}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => goToStep(2)}
              disabled={!state.imgLoaded}
              className="px-4 sm:px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              Next: Crop <span className="hidden sm:inline">& Adjust</span> <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Crop & Adjust */}
      {state.currentStep === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>✂️</span> Crop & Adjust
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Crop Area */}
            <div className="lg:col-span-2">
              <div
                ref={cropContainerRef}
                className={`relative bg-gray-900 rounded-lg overflow-hidden h-[300px] sm:h-[400px] select-none touch-none ${state.isDragging ? 'grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{ touchAction: 'none' }}
              >
                {/* Loading indicator */}
                {state.img && !isReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-sm">Loading...</div>
                  </div>
                )}
                {state.img && isReady && (
                  <img
                    ref={imageLayerRef}
                    src={state.img.src}
                    alt="Preview"
                    className="absolute origin-top-left pointer-events-none"
                    style={{
                      transform: `translate3d(${state.offsetX}px, ${state.offsetY}px, 0) scale(${state.scale})`,
                      filter: getFilterString(),
                      maxWidth: 'none',
                    }}
                    draggable={false}
                  />
                )}
                <div
                  ref={cropFrameRef}
                  className="absolute border-2 border-white/80 shadow-lg pointer-events-none"
                  style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}
                >
                  {showGuides && (
                    <>
                      <div className="absolute inset-0 border border-white/35 rounded-sm" />
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-white/35" />
                      <div className="absolute left-1/2 top-[13%] -translate-x-1/2 w-[58%] h-[72%] border-2 border-dashed border-white/45 rounded-[999px]" />
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
                💡 Drag to move • Scroll or pinch to zoom • Center face inside the oval guide
              </p>

              {/* Zoom Control */}
              <div className="mt-4">
                <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                  <span>Zoom</span>
                  <strong>{Math.round(state.scale * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step={0.01}
                  value={state.scale}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value)
                    applyZoom(newScale, null, null)
                  }}
                  className="w-full"
                />
                <button
                  onClick={() => setShowGuides(prev => !prev)}
                  className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showGuides ? 'Hide alignment guides' : 'Show alignment guides'}
                </button>
              </div>

              {/* Adjustments */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>🎨</span> Image Adjustments
                  </span>
                  <button
                    onClick={resetAdjustments}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { key: 'brightness', label: 'Brightness' },
                    { key: 'contrast', label: 'Contrast' },
                    { key: 'exposure', label: 'Exposure' },
                    { key: 'saturation', label: 'Saturation' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{label}</span>
                        <strong>{state[key]}%</strong>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        value={state[key]}
                        onChange={(e) => handleAdjustmentChange(key, e.target.value)}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span>📄</span> Document Type
                </h3>
                <div ref={docDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDocDropdownOpen(prev => !prev)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors text-left flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{getCurrentDocSize().displayLabel || getCurrentDocSize().label}</span>
                    <span className={`text-xs text-gray-500 dark:text-gray-400 transition-transform ${isDocDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {isDocDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                        <input
                          type="text"
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                          placeholder="Search country or document..."
                          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div className="max-h-72 overflow-y-auto">
                        {getFilteredDocGroups().map(group => (
                          <div key={group.regionKey} className="py-1">
                            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              {group.regionLabel}
                            </p>
                            {group.docs.map(doc => {
                              const isSelected = doc.key === state.docType
                              return (
                                <button
                                  key={doc.key}
                                  type="button"
                                  onClick={() => handleDocumentChange(doc.key)}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    isSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200 font-medium'
                                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {doc.displayLabel || doc.label}
                                </button>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{getSizeInfo().output}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getSizeInfo().print}</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Print Size (Optional)</h3>
                <select
                  value={state.printSize}
                  onChange={handlePrintSizeChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <option value="">Single Photo (Document Size)</option>
                  <optgroup label="Standard Print Sizes">
                    {Object.entries(PRINT_SIZES).map(([key, size]) => (
                      <option key={key} value={key}>{size.label}</option>
                    ))}
                  </optgroup>
                </select>
                <p className={`text-xs mt-2 ${state.printSize ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {getPrintSizeInfo()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.removeBackground}
                    onChange={(e) => {
                      setState(prev => ({ ...prev, removeBackground: e.target.checked }))
                      if (e.target.checked) {
                        setBgStatus('✨ Background will be removed when you generate preview')
                      } else {
                        setBgStatus('')
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Remove Background (Replace with White)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">✨ Removes shadows and background</p>
                {bgStatus && (
                  <p className={`text-xs mt-2 ${bgStatus.includes('✓') ? 'text-green-600' : bgStatus.includes('⚠️') ? 'text-red-600' : 'text-blue-600'}`}>
                    {bgStatus}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button
              onClick={() => goToStep(1)}
              className="px-4 sm:px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base order-2 sm:order-1"
            >
              ← Back
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={state.isProcessingBg}
              className="px-4 sm:px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              {state.isProcessingBg ? '🔄 Processing...' : <><span className="hidden sm:inline">Generate Preview</span><span className="sm:hidden">Preview</span> →</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Download */}
      {state.currentStep === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>💾</span> Download
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">✓ Final Preview</p>
              <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full h-auto rounded shadow-lg"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Your {getCurrentDocSize().label} photo is ready!
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <span>⚙️</span> Export Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{getSizeInfo().print}</p>
                
                <button
                  onClick={handleExport}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-lg flex items-center justify-center gap-2"
                >
                  <span>💾</span> Download Photo
                </button>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
                  📌 All processing happens locally. Your photo never leaves your device.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-start">
            <button
              onClick={() => goToStep(2)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Back to Adjust
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
