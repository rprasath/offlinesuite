/**
 * Image Compressor Tool - React Component
 * Compress JPG/PNG/WebP images with quality controls.
 */

import { useState, useRef } from 'react'
import { config, qualityPresets, formatOptions, defaultSettings } from './config'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function ImageCompressor() {
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
          compressedData: null,
          compressedSize: null,
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
      setError('Please select valid image files (JPG, PNG, WebP).')
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

  // Compress a single image
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file.data)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.drawImage(img, 0, 0)
        
        // Determine output format
        let mimeType
        let extension
        if (settings.format === 'jpg') {
          mimeType = 'image/jpeg'
          extension = 'jpg'
        } else if (settings.format === 'webp') {
          mimeType = 'image/webp'
          extension = 'webp'
        } else {
          // Keep original format
          if (file.type === 'image/png') {
            mimeType = 'image/png'
            extension = 'png'
          } else if (file.type === 'image/webp') {
            mimeType = 'image/webp'
            extension = 'webp'
          } else {
            mimeType = 'image/jpeg'
            extension = 'jpg'
          }
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                data: blob,
                size: blob.size,
                extension,
              })
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          mimeType,
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

  // Compress all files
  const compressAll = async () => {
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
        const result = await compressImage(file)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                compressedData: result.data, 
                compressedSize: result.size,
                compressedExtension: result.extension,
                status: 'done' 
              }
            : f
        ))
      } catch (err) {
        console.error(`Failed to compress ${file.name}:`, err)
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error' } : f
        ))
      }
    }

    setIsProcessing(false)
  }

  // Download a file
  const downloadFile = (file) => {
    if (!file.compressedData) return
    
    const url = URL.createObjectURL(file.compressedData)
    const link = document.createElement('a')
    link.href = url
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    link.download = `${baseName}-compressed.${file.compressedExtension}`
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

  // Calculate compression ratio
  const getCompressionRatio = (original, compressed) => {
    if (!compressed) return null
    const ratio = ((original - compressed) / original) * 100
    return ratio.toFixed(1)
  }

  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalCompressedSize = files.reduce((sum, f) => sum + (f.compressedSize || 0), 0)
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Image Compressor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Reduce image file sizes with adjustable quality settings. Supports JPG, PNG, and WebP formats.
        </p>
      </div>

      {/* Compression Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Compression Settings</h2>
        
        {/* Quality Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quality Preset
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {qualityPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSettings({ 
                  ...settings, 
                  qualityPreset: preset.id,
                  quality: preset.quality 
                })}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.qualityPreset === preset.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="text-xs mt-1 opacity-80">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Quality Slider */}
        {settings.qualityPreset === 'custom' && (
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

        {/* Output Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Output Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map(format => (
              <button
                key={format.id}
                onClick={() => setSettings({ ...settings, format: format.id })}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.format === format.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{format.icon}</div>
                <div className="font-medium text-sm">{format.label}</div>
              </button>
            ))}
          </div>
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
        <div className="text-6xl mb-4">🗜️</div>
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
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
                  onClick={compressAll}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Compressing...' : `Compress (${pendingCount})`}
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

          {/* Summary Stats */}
          {doneCount > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Original Size</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatSize(totalOriginalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compressed Size</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">{formatSize(totalCompressedSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                    {getCompressionRatio(totalOriginalSize, totalCompressedSize)}%
                  </p>
                </div>
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
                    <span className="text-2xl">🖼️</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.width}×{file.height} • {formatSize(file.size)}
                        {file.compressedSize && (
                          <> → {formatSize(file.compressedSize)} 
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {' '}(-{getCompressionRatio(file.size, file.compressedSize)}%)
                            </span>
                          </>
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
                        ? 'bg-green-100 text-green-800'
                        : file.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : file.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
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
          <li>• Lower quality = smaller file size, but more visible compression artifacts</li>
          <li>• WebP format typically offers better compression than JPG with similar quality</li>
          <li>• PNG compression is lossless but may not reduce file size as much</li>
        </ul>
      </div>
    </div>
  )
}
