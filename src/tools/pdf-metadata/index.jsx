/**
 * PDF Metadata Editor Tool - React Component
 * View and edit PDF metadata (title, author, subject, keywords, etc.).
 */

import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { config, metadataFields } from './config'
import { PDF_CONFIG } from '../../utils/pdfConfig'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function PdfMetadata() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [metadata, setMetadata] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef(null)

  // Load PDF and extract metadata
  const loadPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const pageCount = pdfDoc.getPageCount()

      // Extract metadata
      const meta = {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || '',
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || '',
        creationDate: pdfDoc.getCreationDate() || null,
        modificationDate: pdfDoc.getModificationDate() || null,
      }

      return {
        id: generateId(),
        name: file.name,
        size: file.size,
        data: arrayBuffer,
        pageCount,
        originalMetadata: meta,
        updatedData: null,
        status: 'pending',
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
      if (loadedFiles.length > 0 && !selectedFile) {
        selectFile(loadedFiles[0])
      }
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

  // Select a file for editing
  const selectFile = (file) => {
    setSelectedFile(file)
    setMetadata({ ...file.originalMetadata })
  }

  // Remove a file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
      setMetadata({})
    }
  }

  // Clear all files
  const clearAll = () => {
    setFiles([])
    setSelectedFile(null)
    setMetadata({})
    setError('')
  }

  // Update metadata for selected file
  const updateMetadata = async () => {
    if (!selectedFile) return
    
    setIsProcessing(true)
    setError('')

    try {
      const pdfDoc = await PDFDocument.load(selectedFile.data.slice(0), { ignoreEncryption: true })
      
      // Set metadata
      if (metadata.title) pdfDoc.setTitle(metadata.title)
      if (metadata.author) pdfDoc.setAuthor(metadata.author)
      if (metadata.subject) pdfDoc.setSubject(metadata.subject)
      if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords)
      if (metadata.creator) pdfDoc.setCreator(metadata.creator)
      pdfDoc.setProducer(metadata.producer || PDF_CONFIG.producer)
      
      const pdfBytes = await pdfDoc.save()
      
      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, updatedData: pdfBytes, status: 'done' }
          : f
      ))
      
      // Update selected file
      setSelectedFile(prev => ({ ...prev, updatedData: pdfBytes, status: 'done' }))
    } catch (err) {
      setError(`Error updating metadata: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Clear metadata for selected file
  const clearMetadata = () => {
    setMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
      producer: '',
    })
  }

  // Download a file
  const downloadFile = (file) => {
    if (!file.updatedData) return
    
    const blob = new Blob([file.updatedData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name.replace('.pdf', '-metadata-updated.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleString()
    } catch {
      return 'Invalid Date'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">PDF Metadata Editor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and edit PDF metadata including title, author, subject, and keywords. All processing happens locally.
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
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Drop PDF files here or click to browse
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Support for up to {config.maxFiles} files, max {config.maxFileSize / 1024 / 1024}MB each
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 sm:px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Files and Editor Layout */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Files List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Files</h2>
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => selectFile(file)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFile?.id === file.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.pageCount} pages • {formatSize(file.size)}
                      </p>
                    </div>
                    {file.status === 'done' && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Editor */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Metadata</h2>
                  {selectedFile.status === 'done' && (
                    <button
                      onClick={() => downloadFile(selectedFile)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Download
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {metadataFields.map(field => (
                    <div key={field.id}>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span>{field.icon}</span>
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={metadata[field.id] || ''}
                        onChange={(e) => setMetadata({ ...metadata, [field.id]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {/* Dates (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Creation Date
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedFile.originalMetadata.creationDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Modification Date
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedFile.originalMetadata.modificationDate)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={updateMetadata}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {isProcessing ? 'Updating...' : 'Update Metadata'}
                  </button>
                  <button
                    onClick={clearMetadata}
                    disabled={isProcessing}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Select a file to edit its metadata
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• All processing happens locally - your files never leave your device</li>
          <li>• Metadata helps organize and search PDFs in document libraries</li>
          <li>• Keywords should be comma-separated for best compatibility</li>
          <li>• Creation and modification dates are read-only system properties</li>
        </ul>
      </div>
    </div>
  )
}
