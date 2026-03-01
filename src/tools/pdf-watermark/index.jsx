/**
 * PDF Watermark Tool - React Component
 * Add text or image watermarks to PDF files.
 */

import { useState, useRef } from 'react'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import { config, watermarkTypes, positions, fontSizes, colors, defaultSettings } from './config'
import { PDF_CONFIG } from '../../utils/pdfConfig'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function PdfWatermark() {
  const [files, setFiles] = useState([]) // Array of { id, name, size, data, pageCount, watermarkedData, status }
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [watermarkImage, setWatermarkImage] = useState(null) // For image watermark
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  // Load PDF and extract info
  const loadPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const pageCount = pdfDoc.getPageCount()

      return {
        id: generateId(),
        name: file.name,
        size: file.size,
        data: arrayBuffer,
        pageCount,
        watermarkedData: null,
        status: 'pending', // pending, processing, done, error
      }
    } catch (err) {
      throw new Error(`Failed to load "${file.name}": ${err.message}`)
    }
  }

  // Handle file selection
  const handleFiles = async (selectedFiles) => {
    setError('')
    const pdfFiles = Array.from(selectedFiles).filter(
      f => config.supportedTypes.includes(f.type) || f.name.toLowerCase().endsWith('.pdf')
    )

    if (pdfFiles.length === 0) {
      setError('Please select valid PDF files.')
      return
    }

    if (files.length + pdfFiles.length > config.maxFiles) {
      setError(`Maximum ${config.maxFiles} files allowed.`)
      return
    }

    const oversizedFiles = pdfFiles.filter(f => f.size > config.maxFileSize)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setIsProcessing(true)
    try {
      const loadedFiles = await Promise.all(pdfFiles.map(loadPdf))
      setFiles(prev => [...prev, ...loadedFiles])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // File input change
  const onFileInputChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  // Image watermark input change
  const onImageInputChange = async (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      const arrayBuffer = await file.arrayBuffer()
      setWatermarkImage({ data: arrayBuffer, type: file.type })
      e.target.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // Remove a file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Clear all files
  const clearAll = () => {
    setFiles([])
    setError('')
  }

  // Parse page range (e.g., "1-3,5,7-9")
  const parsePageRange = (range, totalPages) => {
    if (!range.trim()) return Array.from({ length: totalPages }, (_, i) => i)
    
    const pages = new Set()
    const parts = range.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (start > 0 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.add(i - 1) // Convert to 0-indexed
          }
        }
      } else {
        const pageNum = parseInt(part)
        if (pageNum > 0 && pageNum <= totalPages) {
          pages.add(pageNum - 1) // Convert to 0-indexed
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b)
  }

  // Convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 }
  }

  // Apply watermark to a single PDF
  const applyWatermark = async (file) => {
    const pdfDoc = await PDFDocument.load(file.data.slice(0))
    const pages = pdfDoc.getPages()
    
    // Determine which pages to watermark
    const pageIndices = settings.applyToAllPages 
      ? Array.from({ length: pages.length }, (_, i) => i)
      : parsePageRange(settings.pageRange, pages.length)
    
    if (pageIndices.length === 0) {
      throw new Error('No valid pages selected')
    }

    const position = positions.find(p => p.id === settings.position) || positions[0]
    const colorRgb = hexToRgb(settings.color)
    
    // For diagonal repeating watermark
    const isDiagonal = settings.position === 'diagonal'
    
    for (let i = 0; i < pages.length; i++) {
      if (!pageIndices.includes(i)) continue
      
      const page = pages[i]
      const { width, height } = page.getSize()
      
      if (settings.type === 'text') {
        // Text watermark
        const font = await pdfDoc.embedFont('Helvetica')
        const textWidth = font.widthOfTextAtSize(settings.text, settings.fontSize)
        const textHeight = settings.fontSize
        
        if (isDiagonal) {
          // Add diagonal repeating watermarks
          const spacing = 200
          const diagAngle = -45
          
          for (let x = -height; x < width + height; x += spacing) {
            for (let y = -width; y < height + width; y += spacing) {
              page.drawText(settings.text, {
                x: x,
                y: y,
                size: settings.fontSize,
                font: font,
                color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
                opacity: settings.opacity,
                rotate: degrees(diagAngle),
              })
            }
          }
        } else {
          // Single watermark at specified position
          let x, y
          
          if (settings.position === 'custom') {
            x = (settings.customX / 100) * width - textWidth / 2
            y = (settings.customY / 100) * height - textHeight / 2
          } else {
            x = position.x * width - textWidth / 2
            y = position.y * height - textHeight / 2
          }
          
          page.drawText(settings.text, {
            x: x,
            y: y,
            size: settings.fontSize,
            font: font,
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
            opacity: settings.opacity,
            rotate: degrees(settings.rotation),
          })
        }
      } else if (settings.type === 'image' && watermarkImage) {
        // Image watermark
        let image
        if (watermarkImage.type.includes('png')) {
          image = await pdfDoc.embedPng(watermarkImage.data)
        } else if (watermarkImage.type.includes('jpg') || watermarkImage.type.includes('jpeg')) {
          image = await pdfDoc.embedJpg(watermarkImage.data)
        } else {
          throw new Error('Unsupported image format. Use PNG or JPG.')
        }
        
        const imageDims = image.scale(settings.imageScale)
        
        if (isDiagonal) {
          // Add diagonal repeating watermarks
          const spacing = Math.max(imageDims.width, imageDims.height) + 100
          const diagAngle = -45
          
          for (let x = -height; x < width + height; x += spacing) {
            for (let y = -width; y < height + width; y += spacing) {
              page.drawImage(image, {
                x: x,
                y: y,
                width: imageDims.width,
                height: imageDims.height,
                opacity: settings.opacity,
                rotate: degrees(diagAngle),
              })
            }
          }
        } else {
          // Single image watermark
          let x, y
          
          if (settings.position === 'custom') {
            x = (settings.customX / 100) * width - imageDims.width / 2
            y = (settings.customY / 100) * height - imageDims.height / 2
          } else {
            x = position.x * width - imageDims.width / 2
            y = position.y * height - imageDims.height / 2
          }
          
          page.drawImage(image, {
            x: x,
            y: y,
            width: imageDims.width,
            height: imageDims.height,
            opacity: settings.opacity,
            rotate: degrees(settings.rotation),
          })
        }
      }
      
      setProgress(prev => ({ ...prev, current: prev.current + 1 }))
    }
    
    pdfDoc.setProducer(PDF_CONFIG.producer)
    return await pdfDoc.save()
  }

  // Process all files
  const processAll = async () => {
    if (files.length === 0) return
    
    if (settings.type === 'text' && !settings.text.trim()) {
      setError('Please enter watermark text')
      return
    }
    
    if (settings.type === 'image' && !watermarkImage) {
      setError('Please select a watermark image')
      return
    }
    
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error')
    if (pendingFiles.length === 0) return

    setIsProcessing(true)
    setError('')
    
    const totalPages = pendingFiles.reduce((sum, f) => sum + f.pageCount, 0)
    setProgress({ current: 0, total: totalPages })

    for (const file of pendingFiles) {
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ))

      try {
        const watermarkedData = await applyWatermark(file)
        
        // Update file with watermarked data
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, watermarkedData, status: 'done' }
            : f
        ))
      } catch (err) {
        console.error(`Failed to watermark ${file.name}:`, err)
        setError(`Error processing ${file.name}: ${err.message}`)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }

    setIsProcessing(false)
  }

  // Download a file
  const downloadFile = (file) => {
    if (!file.watermarkedData) return
    
    const blob = new Blob([file.watermarkedData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name.replace('.pdf', '-watermarked.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download all files
  const downloadAll = () => {
    const doneFiles = files.filter(f => f.status === 'done')
    doneFiles.forEach(file => downloadFile(file))
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">PDF Watermark</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add custom text or image watermarks to your PDF files. All processing happens locally in your browser.
        </p>
      </div>

      {/* Watermark Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Watermark Settings</h2>
        
        {/* Watermark Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Watermark Type
          </label>
          <div className="flex gap-3">
            {watermarkTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSettings({ ...settings, type: type.id })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.type === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Watermark Settings */}
        {settings.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={settings.text}
                onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                placeholder="Enter watermark text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {fontSizes.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.label} ({size.value}px)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  <select
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {colors.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Image Watermark Settings */}
        {settings.type === 'image' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Watermark Image
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {watermarkImage ? 'Change Image' : 'Select Image'}
                </button>
                {watermarkImage && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">Image loaded ✓</span>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={onImageInputChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports PNG and JPG formats</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Scale: {settings.imageScale.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.imageScale}
                onChange={(e) => setSettings({ ...settings, imageScale: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Common Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Opacity: {Math.round(settings.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.opacity}
              onChange={(e) => setSettings({ ...settings, opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rotation: {settings.rotation}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="15"
              value={settings.rotation}
              onChange={(e) => setSettings({ ...settings, rotation: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position
          </label>
          <select
            value={settings.position}
            onChange={(e) => setSettings({ ...settings, position: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          >
            {positions.map(pos => (
              <option key={pos.id} value={pos.id}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        {settings.position === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                X Position: {settings.customX}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.customX}
                onChange={(e) => setSettings({ ...settings, customX: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Y Position: {settings.customY}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.customY}
                onChange={(e) => setSettings({ ...settings, customY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Page Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <input
              type="checkbox"
              checked={settings.applyToAllPages}
              onChange={(e) => setSettings({ ...settings, applyToAllPages: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            Apply to all pages
          </label>
          {!settings.applyToAllPages && (
            <input
              type="text"
              value={settings.pageRange}
              onChange={(e) => setSettings({ ...settings, pageRange: e.target.value })}
              placeholder="e.g., 1-3,5,7-9"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
          )}
        </div>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDraggingOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Drop PDF files here or click to browse
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Support for up to {config.maxFiles} files, max {config.maxFileSize / 1024 / 1024}MB each
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Select PDF Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Files ({files.length})
            </h2>
            <div className="flex gap-3">
              {pendingCount > 0 && (
                <button
                  onClick={processAll}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : `Apply Watermark (${pendingCount})`}
                </button>
              )}
              {doneCount > 0 && (
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download All ({doneCount})
                </button>
              )}
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Processing pages...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* File Items */}
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.pageCount} pages • {formatSize(file.size)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      file.status === 'done'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : file.status === 'processing'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : file.status === 'error'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {file.status === 'done'
                      ? 'Done'
                      : file.status === 'processing'
                      ? 'Processing'
                      : file.status === 'error'
                      ? 'Error'
                      : 'Pending'}
                  </span>

                  {/* Download Button */}
                  {file.status === 'done' && (
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'processing'}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• All processing happens locally - your files never leave your device</li>
          <li>• Use "Diagonal (Repeating)" position for full-page watermark coverage</li>
          <li>• Adjust opacity for subtle watermarks that don't interfere with content</li>
          <li>• Page range format: "1-3,5,7-9" (comma-separated, 1-indexed)</li>
        </ul>
      </div>
    </div>
  )
}
