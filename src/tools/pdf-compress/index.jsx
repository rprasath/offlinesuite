/**
 * PDF Compress Tool - React Component
 * Compress PDF files to reduce their size.
 */

import { useState, useRef, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { config, compressionLevels } from './config'

// Set up PDF.js worker from npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function PdfCompress() {
  const [files, setFiles] = useState([]) // Array of { id, name, size, data, pageCount, compressedSize, compressedData, status }
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [compressionLevel, setCompressionLevel] = useState('balanced')
  const [progress, setProgress] = useState({ current: 0, total: 0, fileIndex: 0 })
  const fileInputRef = useRef(null)

  // Get current compression settings
  const getCompressionSettings = () => 
    compressionLevels.find(l => l.id === compressionLevel) || compressionLevels[2]

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
        compressedSize: null,
        compressedData: null,
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

  // Compress a single PDF
  const compressPdf = async (file, settings) => {
    const { scale, imageQuality } = settings
    const compressedPdf = await PDFDocument.create()
    
    // Use pdfjs to render pages
    const pdfDoc = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise
    
    for (let i = 0; i < file.pageCount; i++) {
      const pdfPage = await pdfDoc.getPage(i + 1)
      const viewport = pdfPage.getViewport({ scale })
      
      // Create canvas and render
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await pdfPage.render({ canvasContext: context, viewport }).promise
      
      // Convert to JPEG with quality setting
      const imageDataUrl = canvas.toDataURL('image/jpeg', imageQuality)
      const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer())
      
      // Embed image in new PDF
      const jpgImage = await compressedPdf.embedJpg(imageBytes)
      
      // Create page with image dimensions
      const newPage = compressedPdf.addPage([viewport.width, viewport.height])
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      })
      
      setProgress(prev => ({ ...prev, current: prev.current + 1 }))
    }
    
    return await compressedPdf.save()
  }

  // Compress all files
  const compressAll = async () => {
    if (files.length === 0) return
    
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error')
    if (pendingFiles.length === 0) return

    setIsProcessing(true)
    setError('')
    
    const totalPages = pendingFiles.reduce((sum, f) => sum + f.pageCount, 0)
    setProgress({ current: 0, total: totalPages, fileIndex: 0 })
    
    const settings = getCompressionSettings()

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      setProgress(prev => ({ ...prev, fileIndex: i + 1 }))
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ))

      try {
        const compressedData = await compressPdf(file, settings)
        
        // Update file with compressed data
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, compressedData, compressedSize: compressedData.byteLength, status: 'done' }
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

  // Download a compressed file
  const downloadFile = (file) => {
    if (!file.compressedData) return
    
    const blob = new Blob([file.compressedData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name.replace('.pdf', '-compressed.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download all compressed files
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

  // Get totals
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalCompressedSize = files.reduce((sum, f) => sum + (f.compressedSize || 0), 0)
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">PDF Compressor</h1>
          <p className="text-slate-400">
            Reduce PDF file sizes by compressing images and optimizing content.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Compression Level Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-3">Compression Level</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {compressionLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => setCompressionLevel(level.id)}
                disabled={isProcessing}
                className={`p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50
                  ${compressionLevel === level.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{level.icon}</span>
                  <span className="font-medium text-sm">{level.label}</span>
                </div>
                <p className="text-xs text-slate-400">{level.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${isDraggingOver 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.acceptedExtensions}
            multiple
            className="hidden"
            onChange={onFileInputChange}
          />
          <div className="text-5xl mb-4">🗜️</div>
          <p className="text-lg font-medium mb-2">
            {isDraggingOver ? 'Drop PDFs here' : 'Click or drag PDF files here'}
          </p>
          <p className="text-slate-400 text-sm">
            Up to {config.maxFiles} files, max {config.maxFileSize / 1024 / 1024}MB each
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {files.length} file{files.length !== 1 ? 's' : ''}
                {doneCount > 0 && (
                  <span className="text-slate-400 font-normal ml-2">
                    • Saved {formatSize(totalOriginalSize - totalCompressedSize)} ({getCompressionRatio(totalOriginalSize, totalCompressedSize)}% reduction)
                  </span>
                )}
              </h2>
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="text-2xl">
                      {file.status === 'pending' && '📄'}
                      {file.status === 'processing' && (
                        <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {file.status === 'done' && '✅'}
                      {file.status === 'error' && '❌'}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.pageCount} page{file.pageCount !== 1 ? 's' : ''}</span>
                        {file.status === 'done' && file.compressedSize && (
                          <>
                            <span>→</span>
                            <span className="text-green-400">{formatSize(file.compressedSize)}</span>
                            <span className="text-green-400">
                              (-{getCompressionRatio(file.size, file.compressedSize)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === 'done' && (
                        <button
                          onClick={() => downloadFile(file)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
                        >
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={isProcessing}
                        className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && progress.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Compressing file {progress.fileIndex} of {files.filter(f => f.status !== 'done').length}...</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="mt-6 flex gap-3">
            {pendingCount > 0 && (
              <button
                onClick={compressAll}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed
                  rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Compressing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Compress {pendingCount} file{pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
            
            {doneCount > 0 && (
              <button
                onClick={downloadAll}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed
                  rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All ({doneCount})
              </button>
            )}
          </div>
        )}

        {/* Help Section */}
        {files.length === 0 && (
          <div className="mt-8 p-6 bg-slate-800/50 rounded-xl">
            <h3 className="font-semibold mb-3">How it works</h3>
            <ul className="space-y-2 text-slate-400 dark:text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">1.</span>
                Choose a compression level based on your needs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">2.</span>
                Add PDF files by clicking or dragging them
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">3.</span>
                Click "Compress" to process all files
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">4.</span>
                Download individual files or all at once
              </li>
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              🔒 All processing happens locally in your browser. Your files are never uploaded to any server.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
