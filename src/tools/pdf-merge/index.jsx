/**
 * PDF Merge Tool - React Component
 * Combine multiple PDF files into one. Reorder, rotate, and organize pages.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { config, rotationOptions, qualityOptions } from './config'

// Set up PDF.js worker from npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11)

export default function PdfMerge() {
  const [files, setFiles] = useState([]) // Array of { id, name, size, data, pageCount, pages }
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [mergeProgress, setMergeProgress] = useState(0)
  const [modalFile, setModalFile] = useState(null) // File object for modal
  const [pageThumbnails, setPageThumbnails] = useState({}) // { fileId: { pageIndex: dataUrl } }
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null) // URL for PDF preview
  const [showPreview, setShowPreview] = useState(false) // Show preview modal
  const [selectedQuality, setSelectedQuality] = useState('standard') // Quality preset
  const [insertIndex, setInsertIndex] = useState(null)
  const [addMenuIndex, setAddMenuIndex] = useState(null)
  const blankCounterRef = useRef(1)
  const [sortAsc, setSortAsc] = useState(true)
  const fileInputRef = useRef(null)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  useEffect(() => {
    files.forEach((file) => {
      if (!pageThumbnails[file.id]) {
        generateThumbnails(file)
      }
    })
  }, [files])

  // Generate thumbnails for a file
  const generateThumbnails = async (file) => {
    if (pageThumbnails[file.id]) return // Already generated
    
    setLoadingThumbnails(true)
    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise
      const thumbnails = {}
      
      for (let i = 0; i < file.pageCount; i++) {
        const page = await pdfDoc.getPage(i + 1)
        const viewport = page.getViewport({ scale: 0.3 })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({ canvasContext: context, viewport }).promise
        thumbnails[i] = canvas.toDataURL('image/jpeg', 0.7)
      }
      
      setPageThumbnails(prev => ({ ...prev, [file.id]: thumbnails }))
    } catch (err) {
      console.error('Failed to generate thumbnails:', err)
    } finally {
      setLoadingThumbnails(false)
    }
  }

  // Open modal for a file
  const openModal = async (file) => {
    setModalFile(file)
    await generateThumbnails(file)
  }

  // Close modal
  const closeModal = () => {
    setModalFile(null)
  }

  // Load PDF and extract info
  const loadPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const pageCount = pdfDoc.getPageCount()
      
      // Create page entries
      const pages = Array.from({ length: pageCount }, (_, i) => ({
        id: generateId(),
        pageIndex: i,
        rotation: 0,
        included: true,
      }))

      return {
        id: generateId(),
        name: file.name,
        size: file.size,
        data: arrayBuffer,
        pageCount,
        pages,
      }
    } catch (err) {
      throw new Error(`Failed to load "${file.name}": ${err.message}`)
    }
  }

  const createBlankPdf = async () => {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.addPage([595.28, 841.89]) // A4 size in points
    const bytes = await pdfDoc.save()
    const name = `blank-page-${blankCounterRef.current++}.pdf`
    const pageCount = 1
    const pages = [{ id: generateId(), pageIndex: 0, rotation: 0, included: true }]
    return {
      id: generateId(),
      name,
      size: bytes.byteLength,
      data: bytes.buffer,
      pageCount,
      pages,
    }
  }

  // Handle file selection
  const handleFiles = async (selectedFiles, insertAt = null) => {
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
      setFiles(prev => {
        if (insertAt === null || insertAt === undefined) return [...prev, ...loadedFiles]
        const next = [...prev]
        next.splice(insertAt, 0, ...loadedFiles)
        return next
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // File input change
  const onFileInputChange = (e) => {
    if (e.target.files?.length) {
      const idx = insertIndex
      setInsertIndex(null)
      handleFiles(e.target.files, idx)
      e.target.value = ''
    }
  }

  // Drag and drop handlers for adding files
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

  const addBlankPageAt = async (index) => {
    try {
      const blankFile = await createBlankPdf()
      setFiles(prev => {
        const next = [...prev]
        next.splice(index, 0, blankFile)
        return next
      })
    } catch (err) {
      setError('Failed to add blank page.')
    }
  }

  const sortFilesByName = () => {
    setSortAsc(prev => {
      const nextAsc = !prev
      setFiles(prevFiles => {
        const next = [...prevFiles].sort((a, b) => a.name.localeCompare(b.name))
        return nextAsc ? next : next.reverse()
      })
      return nextAsc
    })
  }

  // Remove a file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (modalFile?.id === fileId) setModalFile(null)
    // Clean up thumbnails
    setPageThumbnails(prev => {
      const newThumbnails = { ...prev }
      delete newThumbnails[fileId]
      return newThumbnails
    })
  }

  // Clear all files
  const clearAll = () => {
    setFiles([])
    setModalFile(null)
    setPageThumbnails({})
    setError('')
  }

  // Reorder files via drag
  const handleFileDragStart = (e, index) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFileDragEnter = (index) => {
    dragOverItem.current = index
  }

  const handleFileDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newFiles = [...files]
      const draggedItem = newFiles[dragItem.current]
      newFiles.splice(dragItem.current, 1)
      newFiles.splice(dragOverItem.current, 0, draggedItem)
      setFiles(newFiles)
    }
    dragItem.current = null
    dragOverItem.current = null
  }

  // Move file up/down
  const moveFile = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= files.length) return
    const newFiles = [...files]
    ;[newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]]
    setFiles(newFiles)
  }

  // Toggle page inclusion
  const togglePage = (fileId, pageId) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f
      return {
        ...f,
        pages: f.pages.map(p => p.id === pageId ? { ...p, included: !p.included } : p)
      }
    }))
  }

  // Toggle all pages in a file
  const toggleAllPages = (fileId, included) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f
      return {
        ...f,
        pages: f.pages.map(p => ({ ...p, included }))
      }
    }))
  }

  // Rotate a page
  const rotatePage = (fileId, pageId, rotation) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f
      return {
        ...f,
        pages: f.pages.map(p => p.id === pageId ? { ...p, rotation } : p)
      }
    }))
  }

  // Rotate all pages in a file
  const rotateAllPages = (fileId, rotation) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f
      return {
        ...f,
        pages: f.pages.map(p => ({ ...p, rotation }))
      }
    }))
  }

  // Calculate total pages
  const totalPages = files.reduce((sum, f) => sum + f.pages.filter(p => p.included).length, 0)

  // Merge PDFs and download
  const mergePdfs = async () => {
    if (files.length === 0 || totalPages === 0) return
    
    setIsProcessing(true)
    setMergeProgress(0)
    setError('')

    try {
      const quality = getCurrentQuality()
      const pdfBytes = await generateMergedPdf(quality)
      
      // Download the merged PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `merged-${quality.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMergeProgress(100)
    } catch (err) {
      setError(`Merge failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get current quality options
  const getCurrentQuality = () => qualityOptions.find(q => q.id === selectedQuality) || qualityOptions[1]

  // Generate merged PDF bytes (original quality - no re-rendering)
  const generateMergedPdfOriginal = async () => {
    const mergedPdf = await PDFDocument.create()
    let processedPages = 0
    const totalPagesToProcess = totalPages

    for (const file of files) {
      const sourcePdf = await PDFDocument.load(file.data, { ignoreEncryption: true })
      
      for (const page of file.pages) {
        if (!page.included) continue

        const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [page.pageIndex])
        
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(copiedPage.getRotation().angle + page.rotation))
        }
        
        mergedPdf.addPage(copiedPage)
        processedPages++
        setMergeProgress(Math.round((processedPages / totalPagesToProcess) * 100))
      }
    }

    return await mergedPdf.save()
  }

  // Generate compressed PDF by re-rendering pages as images
  const generateMergedPdfCompressed = async (scale, imageQuality) => {
    const mergedPdf = await PDFDocument.create()
    let processedPages = 0
    const totalPagesToProcess = totalPages

    for (const file of files) {
      // Use pdfjs to render pages
      const pdfDoc = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise
      
      for (const page of file.pages) {
        if (!page.included) continue

        // Get the page from pdfjs
        const pdfPage = await pdfDoc.getPage(page.pageIndex + 1)
        const viewport = pdfPage.getViewport({ scale, rotation: page.rotation })
        
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
        const jpgImage = await mergedPdf.embedJpg(imageBytes)
        
        // Create page with image dimensions
        const newPage = mergedPdf.addPage([viewport.width, viewport.height])
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        })
        
        processedPages++
        setMergeProgress(Math.round((processedPages / totalPagesToProcess) * 100))
      }
    }

    return await mergedPdf.save()
  }

  // Generate merged PDF based on quality settings
  const generateMergedPdf = async (quality) => {
    if (!quality.useCompression) {
      // Use original method for high quality
      return await generateMergedPdfOriginal()
    } else {
      // Use compression method
      return await generateMergedPdfCompressed(quality.scale, quality.imageQuality)
    }
  }

  // Preview merged PDF (always use original quality for preview)
  const previewPdf = async () => {
    if (files.length === 0 || totalPages === 0) return
    
    setIsProcessing(true)
    setMergeProgress(0)
    setError('')

    try {
      // Use original quality for preview (faster)
      const pdfBytes = await generateMergedPdfOriginal()
      
      // Clean up old preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setShowPreview(true)
      setMergeProgress(100)
    } catch (err) {
      setError(`Preview failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Download from preview
  const downloadFromPreview = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = 'merged.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Close preview
  const closePreview = () => {
    setShowPreview(false)
    // Don't revoke URL immediately in case user wants to download
  }

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (files.length === 0) {
    return (
      <div className="w-full min-h-[80vh] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">PDF Merger</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">Combine multiple PDF files into one. Drag to reorder, select pages, and rotate as needed.</p>

          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-600/60 rounded-2xl px-6 py-14 text-center bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-4">📄</div>
            <div className="text-lg font-medium">Click or drag PDF files here</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Up to {config.maxFiles} files, max {config.maxFileSize / 1024 / 1024}MB each</div>
          </div>

          <div className="mt-8 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">How it works</h2>
            <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li>Add PDFs by clicking the drop zone or dragging files onto it.</li>
              <li>Reorder files by dragging them left or right in the grid.</li>
              <li>Use the + buttons to insert PDFs or a blank page between files.</li>
              <li>Click Finish to download your merged PDF.</li>
            </ol>
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">🔒 All processing happens locally in your browser. Files are never uploaded.</div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={config.acceptedExtensions}
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept={config.acceptedExtensions}
        multiple
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Top Toolbar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="text-lg">＋</span> Add PDF
            </button>
            <button
              onClick={sortFilesByName}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              title="Sort"
            >
              A/Z {sortAsc ? '↑' : '↓'}
            </button>
          </div>
          <div className="ml-auto">
            <button
              onClick={mergePdfs}
              disabled={isProcessing || totalPages === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Canvas */}
      <div
        className={`m-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 min-h-[70vh] p-6 ${
          isDraggingOver ? 'ring-2 ring-blue-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-wrap gap-4 items-start">
          {files.map((file, index) => (
            <div key={file.id} className="flex items-center gap-4">
              <div
                draggable
                onDragStart={(e) => handleFileDragStart(e, index)}
                onDragEnter={() => handleFileDragEnter(index)}
                onDragEnd={handleFileDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="w-40"
              >
                <div className="relative bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                  <div
                  className="aspect-[3/4] bg-white dark:bg-slate-950 flex items-center justify-center cursor-pointer"
                    onClick={() => openModal(file)}
                  >
                    {pageThumbnails[file.id]?.[0] ? (
                      <img src={pageThumbnails[file.id][0]} alt={file.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-slate-300 text-4xl">📄</div>
                    )}
                  </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-3 -right-3 h-7 w-7 flex items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:text-red-500 shadow"
                  title="Remove"
                >
                  ×
                </button>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{file.pageCount} page{file.pageCount !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {index < files.length && (
                <div className="relative">
                  <button
                    onClick={() => setAddMenuIndex(addMenuIndex === index ? null : index)}
                    className="h-10 w-10 rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-sm"
                    title="Insert"
                  >
                    +
                  </button>
                  {addMenuIndex === index && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg w-40 z-10">
                      <button
                        className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => {
                          setAddMenuIndex(null)
                          setInsertIndex(index + 1)
                          fileInputRef.current?.click()
                        }}
                      >
                        Add PDF
                      </button>
                      <button
                        className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => {
                          setAddMenuIndex(null)
                          addBlankPageAt(index + 1)
                        }}
                      >
                        Add blank page
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add tile at end */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-40 aspect-[3/4] border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <div className="text-2xl">＋</div>
            <div className="text-sm text-center px-2">Add PDF files</div>
          </button>
        </div>
      </div>

        {/* Page Preview Modal */}
        {modalFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{modalFile.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{modalFile.pages.filter(p => p.included).length}/{modalFile.pageCount} pages selected</p>
                </div>
                <button onClick={closeModal} className="h-9 w-9 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">×</button>
              </div>

              <div className="flex flex-wrap gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <button onClick={() => toggleAllPages(modalFile.id, true)} className="text-sm px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-colors">Select all</button>
                <button onClick={() => toggleAllPages(modalFile.id, false)} className="text-sm px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-colors">Deselect all</button>
                <select
                  onChange={(e) => {
                    rotateAllPages(modalFile.id, parseInt(e.target.value))
                    e.target.value = ''
                  }}
                  className="text-sm px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:ring-2 focus:ring-blue-500"
                  value=""
                >
                  <option value="" disabled>Rotate all pages...</option>
                  {rotationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-950">
                {loadingThumbnails && !pageThumbnails[modalFile.id] ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="ml-3 text-slate-500 dark:text-slate-400">Loading previews...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {files.find(f => f.id === modalFile.id)?.pages.map((page) => (
                      <div
                        key={page.id}
                        className={`relative group rounded-lg border-2 transition-all overflow-hidden ${page.included ? 'border-blue-500 bg-white dark:bg-slate-950' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 opacity-60'}`}
                      >
                        <div className="aspect-[3/4] flex items-center justify-center cursor-pointer bg-white dark:bg-slate-950" onClick={() => togglePage(modalFile.id, page.id)}>
                          {pageThumbnails[modalFile.id]?.[page.pageIndex] ? (
                            <img src={pageThumbnails[modalFile.id][page.pageIndex]} alt={`Page ${page.pageIndex + 1}`} className="w-full h-full object-contain" style={{ transform: `rotate(${page.rotation}deg)` }} />
                          ) : (
                            <span className="text-2xl font-bold text-slate-400">{page.pageIndex + 1}</span>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 px-2 py-1.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Page {page.pageIndex + 1}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); rotatePage(modalFile.id, page.id, (page.rotation - 90 + 360) % 360) }} className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Rotate left">↺</button>
                            <button onClick={(e) => { e.stopPropagation(); rotatePage(modalFile.id, page.id, (page.rotation + 90) % 360) }} className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Rotate right">↻</button>
                          </div>
                        </div>
                        {page.rotation !== 0 && (
                          <div className="absolute top-2 right-2 text-xs bg-blue-600 text-white rounded px-1.5 py-0.5 font-medium">{page.rotation}°</div>
                        )}
                        <div className="absolute top-2 left-2 cursor-pointer" onClick={() => togglePage(modalFile.id, page.id)}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${page.included ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700'}`}>
                            {page.included && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <button onClick={closeModal} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-white">Done</button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && mergeProgress > 0 && (
          <div className="mx-3 mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Processing...</span>
              <span>{mergeProgress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${mergeProgress}%` }} />
            </div>
          </div>
        )}
    </div>
  )
}
