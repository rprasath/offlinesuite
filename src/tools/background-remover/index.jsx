/**
 * Background Remover - Remove backgrounds from images using AI
 */

import { useState, useRef } from 'react'
import { removeBackground } from '@imgly/background-removal'
import { config, exportFormats, backgroundColors, qualityPresets, defaultSettings } from './config'

const generateId = () => Math.random().toString(36).substring(2, 11)

export default function BackgroundRemover() {
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [currentPreview, setCurrentPreview] = useState(null)
  
  const fileInputRef = useRef(null)

  // Load image file
  const loadImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        resolve({
          id: generateId(),
          name: file.name,
          size: file.size,
          file,
          url,
          width: img.width,
          height: img.height,
          processedBlob: null,
          processedUrl: null,
          status: 'pending',
        })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error(`Failed to load ${file.name}`))
      }
      
      img.src = url
    })
  }

  // Handle file upload
  const handleFiles = async (selectedFiles) => {
    setError('')
    const imageFiles = Array.from(selectedFiles).filter(f =>
      config.supportedTypes.includes(f.type)
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
      setError(`Some files exceed ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    try {
      const loadedFiles = await Promise.all(imageFiles.map(loadImage))
      setFiles(prev => [...prev, ...loadedFiles])
      if (!currentPreview && loadedFiles.length > 0) {
        setCurrentPreview(loadedFiles[0])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Apply background color/transparency
  const applyBackground = async (imageBlob, backgroundColor, customColor) => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(imageBlob)
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        
        // If not transparent, fill background
        if (backgroundColor !== 'transparent') {
          const bgColor = backgroundColor === 'custom' 
            ? customColor 
            : backgroundColors.find(c => c.value === backgroundColor)?.hex || '#FFFFFF'
          
          ctx.fillStyle = bgColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        
        canvas.toBlob((blob) => {
          resolve(blob)
        }, `image/${settings.format}`, settings.jpegQuality)
      }
      
      img.src = url
    })
  }

  // Process single image
  const processImage = async (file) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ))

      // Remove background using AI
      const qualityConfig = qualityPresets.find(p => p.value === settings.quality)?.config || {}
      const blob = await removeBackground(file.file, qualityConfig)
      
      // Apply background color if needed
      let finalBlob = blob
      if (settings.format !== 'png' || settings.background !== 'transparent') {
        finalBlob = await applyBackground(blob, settings.background, settings.customColor)
      }
      
      const processedUrl = URL.createObjectURL(finalBlob)
      
      setFiles(prev => prev.map(f =>
        f.id === file.id 
          ? { ...f, processedBlob: finalBlob, processedUrl, status: 'done' } 
          : f
      ))
      
      if (currentPreview?.id === file.id) {
        setCurrentPreview({ ...file, processedBlob: finalBlob, processedUrl, status: 'done' })
      }
      
      return true
    } catch (err) {
      console.error('Error processing image:', err)
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'error', error: err.message } : f
      ))
      return false
    }
  }

  // Process all images
  const processAllImages = async () => {
    if (files.length === 0) {
      setError('Please add images to process')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress({ current: 0, total: files.length })

    for (let i = 0; i < files.length; i++) {
      await processImage(files[i])
      setProgress({ current: i + 1, total: files.length })
    }

    setIsProcessing(false)
  }

  // Download single file
  const downloadFile = (file) => {
    if (!file.processedBlob) return
    
    const link = document.createElement('a')
    link.href = file.processedUrl
    const extension = settings.format === 'jpeg' ? 'jpg' : settings.format
    link.download = file.name.replace(/\.[^.]+$/, `_no_bg.${extension}`)
    link.click()
  }

  // Download all
  const downloadAll = () => {
    files.filter(f => f.processedBlob).forEach(downloadFile)
  }

  // Remove file
  const removeFile = (fileId) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      URL.revokeObjectURL(file.url)
      if (file.processedUrl) URL.revokeObjectURL(file.processedUrl)
    }
    setFiles(files.filter(f => f.id !== fileId))
    if (currentPreview?.id === fileId) {
      setCurrentPreview(files.find(f => f.id !== fileId) || null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Background Remover</h1>
        <p className="text-gray-600 dark:text-gray-400">Remove backgrounds from images using AI - perfect for product photos and portraits</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 transition-colors">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Settings Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>
          
          <div className="space-y-4">
            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Processing Quality
              </label>
              <select
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {qualityPresets.map(preset => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            {/* Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Background
              </label>
              <select
                value={settings.background}
                onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {backgroundColors.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Color */}
            {settings.background === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.customColor}
                    onChange={(e) => setSettings({ ...settings, customColor: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={settings.customColor}
                    onChange={(e) => setSettings({ ...settings, customColor: e.target.value })}
                    placeholder="#FFFFFF"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Output Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {exportFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
              {settings.format !== 'png' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Note: Transparency only available with PNG format
                </p>
              )}
            </div>

            {/* JPEG Quality */}
            {settings.format === 'jpeg' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {Math.round(settings.jpegQuality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.jpegQuality}
                  onChange={(e) => setSettings({ ...settings, jpegQuality: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Preview</h2>
          
          {currentPreview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Original</p>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-900 transition-colors">
                    <img
                      src={currentPreview.url}
                      alt="Original"
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>
                
                {/* Processed */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Background Removed</p>
                  <div 
                    className="border border-gray-300 rounded-lg p-2"
                    style={{ 
                      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px'
                    }}
                  >
                    {currentPreview.processedUrl ? (
                      <img
                        src={currentPreview.processedUrl}
                        alt="Processed"
                        className="w-full h-auto rounded"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-gray-400 text-sm">
                        Not processed yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium">{currentPreview.name}</p>
                <p>{currentPreview.width} × {currentPreview.height}px</p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
              Upload an image to preview
            </div>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Images</h2>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition border-2 border-dashed border-gray-300 dark:border-gray-600"
        >
          🖼️ Click to Upload Images
        </button>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Images ({files.length})</h2>
            {files.some(f => f.processedBlob) && (
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Download All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map(file => (
              <div
                key={file.id}
                className={`border rounded-lg p-3 cursor-pointer transition ${
                  currentPreview?.id === file.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setCurrentPreview(file)}
              >
                <div className="relative">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-xs font-medium truncate">{file.name}</p>
                
                {file.status === 'processing' && (
                  <p className="text-xs text-blue-600 mt-1">Processing...</p>
                )}
                {file.status === 'done' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadFile(file)
                    }}
                    className="mt-2 w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                )}
                {file.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">Error</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button
            onClick={processAllImages}
            disabled={isProcessing}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition"
          >
            {isProcessing 
              ? `Processing... (${progress.current}/${progress.total})` 
              : `Remove Background from ${files.length} Image${files.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ How to Use</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Upload images with subjects you want to isolate</li>
          <li>• Choose processing quality (higher = better but slower)</li>
          <li>• Select background color or keep transparent</li>
          <li>• Process all images and download results</li>
          <li>• Works best with clear subjects and good contrast</li>
          <li>• All processing happens locally using AI - your images stay private</li>
        </ul>
      </div>
    </div>
  )
}
