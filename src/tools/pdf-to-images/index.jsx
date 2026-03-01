/**
 * PDF to Images Tool - React Component
 * Convert PDF pages to PNG/JPG/WebP images.
 */

import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { config, formats, scales, defaultSettings } from './config'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function PdfToImages() {
  const [file, setFile] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [outputImages, setOutputImages] = useState([])
  const [pageCount, setPageCount] = useState(0)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  
  const fileInputRef = useRef(null)

  // Load PDF
  const loadPdf = async (pdfFile) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const count = pdfDoc.numPages

      setFile({
        name: pdfFile.name,
        size: pdfFile.size,
        data: arrayBuffer,
        pdfDoc,
      })
      setPageCount(count)
      setOutputImages([])
      setError('')
    } catch (err) {
      throw new Error(`Failed to load PDF: ${err.message}`)
    }
  }

  // Handle file selection
  const handleFile = async (selectedFile) => {
    setError('')
    
    if (!config.supportedTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.')
      return
    }

    if (selectedFile.size > config.maxFileSize) {
      setError(`File exceeds the ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setIsProcessing(true)
    try {
      await loadPdf(selectedFile)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // File input change
  const onFileInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
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
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // Parse page range
  const parsePageRange = (range, totalPages) => {
    const pages = new Set()
    const parts = range.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (start > 0 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.add(i)
          }
        }
      } else {
        const pageNum = parseInt(part)
        if (pageNum > 0 && pageNum <= totalPages) {
          pages.add(pageNum)
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b)
  }

  // Convert PDF to images
  const convertToImages = async () => {
    if (!file) return
    
    setIsProcessing(true)
    setError('')
    setOutputImages([])

    try {
      const format = formats.find(f => f.id === settings.format)
      const scale = scales.find(s => s.value === settings.scale)
      
      // Determine which pages to convert
      const pageNumbers = settings.extractAll 
        ? Array.from({ length: pageCount }, (_, i) => i + 1)
        : parsePageRange(settings.pageRange, pageCount)
      
      if (pageNumbers.length === 0) {
        throw new Error('No valid pages selected')
      }

      setProgress({ current: 0, total: pageNumbers.length })
      const images = []

      for (const pageNum of pageNumbers) {
        const page = await file.pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: settings.scale })
        
        // Create canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        // Render page
        await page.render({ canvasContext: context, viewport }).promise
        
        // Convert to image
        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, format.mimeType, settings.quality)
        })
        
        const extension = format.id
        images.push({
          name: file.name.replace('.pdf', `_page_${pageNum}.${extension}`),
          data: blob,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height,
        })
        
        setProgress(prev => ({ ...prev, current: prev.current + 1 }))
      }

      setOutputImages(images)
    } catch (err) {
      setError(`Error converting PDF: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Download an image
  const downloadImage = (image) => {
    const url = URL.createObjectURL(image.data)
    const link = document.createElement('a')
    link.href = url
    link.download = image.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download all images
  const downloadAll = () => {
    outputImages.forEach(image => downloadImage(image))
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">PDF to Images</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Convert PDF pages to high-quality images. Choose format, resolution, and pages to extract.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDraggingOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {file ? file.name : 'Drop PDF file here or click to browse'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {file ? `${pageCount} pages • ${formatSize(file.size)}` : `Max ${config.maxFileSize / 1024 / 1024}MB`}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {file ? 'Change File' : 'Select PDF File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
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

      {/* Conversion Settings */}
      {file && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Conversion Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {formats.map(format => (
                  <option key={format.id} value={format.id}>
                    {format.label} - {format.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Scale/Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resolution
              </label>
              <select
                value={settings.scale}
                onChange={(e) => setSettings({ ...settings, scale: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                {scales.map(scale => (
                  <option key={scale.value} value={scale.value}>
                    {scale.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quality (for JPG and WebP) */}
          {(settings.format === 'jpg' || settings.format === 'webp') && (
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

          {/* Page Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={settings.extractAll}
                onChange={(e) => setSettings({ ...settings, extractAll: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              Convert all pages
            </label>
            {!settings.extractAll && (
              <>
                <input
                  type="text"
                  value={settings.pageRange}
                  onChange={(e) => setSettings({ ...settings, pageRange: e.target.value })}
                  placeholder="e.g., 1-3,5,7-9"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter page numbers (1-indexed). Example: "1-3,5,7-9"
                </p>
              </>
            )}
          </div>

          {/* Convert Button */}
          <button
            onClick={convertToImages}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isProcessing ? 'Converting...' : 'Convert to Images'}
          </button>

          {/* Progress Bar */}
          {isProcessing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Converting pages...</span>
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
        </div>
      )}

      {/* Output Images */}
      {outputImages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Images ({outputImages.length})
            </h2>
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Download All
            </button>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outputImages.map((image, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center p-4">
                  <img
                    src={URL.createObjectURL(image.data)}
                    alt={`Page ${image.pageNumber}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-3 bg-white dark:bg-gray-800">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{image.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Page {image.pageNumber} • {image.width}×{image.height} • {formatSize(image.data.size)}
                  </p>
                  <button
                    onClick={() => downloadImage(image)}
                    className="mt-2 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download
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
          <li>• PNG format preserves quality but creates larger files</li>
          <li>• JPG format is best for photos with smaller file sizes</li>
          <li>• WebP format offers best compression with good quality</li>
          <li>• Higher resolution (DPI) creates larger but more detailed images</li>
        </ul>
      </div>
    </div>
  )
}
