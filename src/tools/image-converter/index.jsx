/**
 * Image Format Converter Tool - React Component
 * Convert between JPG, PNG, WebP, BMP with optional resizing.
 */

import { useState, useRef } from 'react'
import { config, formats, resizeOptions, defaultSettings } from './config'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function ImageConverter() {
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef(null)

  // Load image
  const loadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: file,
          width: img.width,
          height: img.height,
          convertedData: null,
          convertedSize: null,
          status: 'pending',
        })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error(`Failed to load image: ${file.name}`))
      }
      
      img.src = url
    })
  }

  // Handle file selection
  const handleFiles = async (selectedFiles) => {
    setError('')
    const imageFiles = Array.from(selectedFiles).filter(
      f => config.supportedTypes.includes(f.type)
    )

    if (imageFiles.length === 0) {
      setError('Please select valid image files.')
      return
    }

    if (files.length + imageFiles.length > config.maxFiles) {
      setError(`Maximum ${config.maxFiles} files allowed.`)
      return
    }

    const oversizedFiles = imageFiles.filter(f => f.size > config.maxFileSize)
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setIsProcessing(true)
    try {
      const loadedFiles = await Promise.all(imageFiles.map(loadImage))
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

  // Calculate new dimensions
  const calculateDimensions = (originalWidth, originalHeight) => {
    let width = originalWidth
    let height = originalHeight

    if (settings.resizeMode === 'percentage') {
      const scale = settings.percentage / 100
      width = Math.round(originalWidth * scale)
      height = Math.round(originalHeight * scale)
    } else if (settings.resizeMode === 'dimensions') {
      width = settings.width
      height = settings.height
      
      if (settings.maintainAspectRatio) {
        const aspectRatio = originalWidth / originalHeight
        if (width / height > aspectRatio) {
          width = Math.round(height * aspectRatio)
        } else {
          height = Math.round(width / aspectRatio)
        }
      }
    } else if (settings.resizeMode === 'maxDimension') {
      const maxDim = settings.maxDimension
      if (originalWidth > maxDim || originalHeight > maxDim) {
        if (originalWidth > originalHeight) {
          width = maxDim
          height = Math.round((maxDim / originalWidth) * originalHeight)
        } else {
          height = maxDim
          width = Math.round((maxDim / originalHeight) * originalWidth)
        }
      }
    }

    return { width, height }
  }

  // Convert a single image
  const convertImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file.data)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const format = formats.find(f => f.id === settings.outputFormat)
        const { width, height } = calculateDimensions(img.width, img.height)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = width
        canvas.height = height
        
        // Fill with white background for formats that don't support transparency
        if (!format.supportsTransparency) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                data: blob,
                size: blob.size,
                format: format.id,
                width,
                height,
              })
            } else {
              reject(new Error('Failed to convert image'))
            }
          },
          format.mimeType,
          settings.quality
        )
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  // Convert all files
  const convertAll = async () => {
    if (files.length === 0) return
    
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error')
    if (pendingFiles.length === 0) return

    setIsProcessing(true)
    setError('')

    for (const file of pendingFiles) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ))

      try {
        const result = await convertImage(file)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                convertedData: result.data, 
                convertedSize: result.size,
                convertedWidth: result.width,
                convertedHeight: result.height,
                convertedFormat: result.format,
                status: 'done' 
              }
            : f
        ))
      } catch (err) {
        console.error(`Failed to convert ${file.name}:`, err)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }

    setIsProcessing(false)
  }

  // Download a file
  const downloadFile = (file) => {
    if (!file.convertedData) return
    
    const url = URL.createObjectURL(file.convertedData)
    const link = document.createElement('a')
    link.href = url
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    link.download = `${baseName}.${file.convertedFormat}`
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Image Format Converter</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Convert images between different formats (JPG, PNG, WebP, BMP) with optional resizing.
        </p>
      </div>

      {/* Conversion Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Conversion Settings</h2>
        
        {/* Output Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Output Format
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {formats.map(format => (
              <button
                key={format.id}
                onClick={() => setSettings({ ...settings, outputFormat: format.id })}
                className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                  settings.outputFormat === format.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="font-medium">{format.label}</div>
                <div className="text-xs mt-1 opacity-80">{format.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality (for lossy formats) */}
        {(settings.outputFormat === 'jpg' || settings.outputFormat === 'webp') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality: {Math.round(settings.quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {/* Resize Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Resize Options
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {resizeOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSettings({ ...settings, resizeMode: option.id })}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.resizeMode === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="font-medium text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resize Settings */}
        {settings.resizeMode === 'percentage' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scale: {settings.percentage}%
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={settings.percentage}
              onChange={(e) => setSettings({ ...settings, percentage: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {settings.resizeMode === 'dimensions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.width}
                  onChange={(e) => setSettings({ ...settings, width: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.height}
                  onChange={(e) => setSettings({ ...settings, height: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.maintainAspectRatio}
                onChange={(e) => setSettings({ ...settings, maintainAspectRatio: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Maintain aspect ratio</span>
            </label>
          </div>
        )}

        {settings.resizeMode === 'maxDimension' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Dimension (px)
            </label>
            <input
              type="number"
              min="1"
              value={settings.maxDimension}
              onChange={(e) => setSettings({ ...settings, maxDimension: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Images larger than this will be scaled down proportionally
            </p>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDraggingOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="text-6xl mb-4">🔄</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Drop images here or click to browse
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Support for up to {config.maxFiles} files, max {config.maxFileSize / 1024 / 1024}MB each
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Select Images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={config.supportedTypes.join(',')}
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
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
                  onClick={convertAll}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Converting...' : `Convert (${pendingCount})`}
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
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* File Items */}
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🖼️</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.width}×{file.height} • {formatSize(file.size)}
                        {file.convertedData && (
                          <> → {file.convertedWidth}×{file.convertedHeight} • {formatSize(file.convertedSize)}</>
                        )}
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
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <li>• PNG and WebP support transparency, JPG and BMP do not</li>
          <li>• WebP offers best compression with good quality for web use</li>
          <li>• Use "Max Dimension" to ensure images don't exceed a certain size</li>
        </ul>
      </div>
    </div>
  )
}
