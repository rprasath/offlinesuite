/**
 * PDF Splitter Tool - React Component
 * Split, extract, rotate, and delete pages with a visual editor.
 */

import { useEffect, useRef, useState } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { config } from './config'
import { PDF_CONFIG } from '../../utils/pdfConfig'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const generateId = () => Math.random().toString(36).substring(2, 11)

export default function PdfSplitter() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [pages, setPages] = useState([])
  const [pageThumbnails, setPageThumbnails] = useState([])
  const [mode, setMode] = useState('split')
  const [splitAfter, setSplitAfter] = useState(new Set())
  const [autoSplit, setAutoSplit] = useState(false)
  const [autoSplitEvery, setAutoSplitEvery] = useState(2)
  const [selectedPages, setSelectedPages] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState('')
  const [outputFiles, setOutputFiles] = useState([])
  const fileInputRef = useRef(null)

  const visiblePages = pages.filter((page) => !page.deleted)

  useEffect(() => {
    if (!file) return
    const generateThumbnails = async () => {
      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: file.data.slice(0) }).promise
        const thumbs = []
        for (let i = 0; i < pageCount; i++) {
          const page = await pdfDoc.getPage(i + 1)
          const viewport = page.getViewport({ scale: 0.35 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: context, viewport }).promise
          thumbs[i] = canvas.toDataURL('image/jpeg', 0.75)
        }
        setPageThumbnails(thumbs)
      } catch (err) {
        console.error('Failed to generate thumbnails:', err)
      }
    }

    generateThumbnails()
  }, [file, pageCount])

  useEffect(() => {
    if (!autoSplit || visiblePages.length === 0) return
    const every = Math.max(1, parseInt(autoSplitEvery, 10) || 1)
    const next = new Set()
    for (let i = every - 1; i < visiblePages.length - 1; i += every) {
      next.add(visiblePages[i].id)
    }
    setSplitAfter(next)
  }, [autoSplit, autoSplitEvery, visiblePages])

  const resetStateForFile = () => {
    setPageThumbnails([])
    setSplitAfter(new Set())
    setAutoSplit(false)
    setSelectedPages(new Set())
    setOutputFiles([])
    setError('')
  }

  const loadPdf = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    const count = pdfDoc.getPageCount()
    const pageItems = Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      pageIndex: i,
      rotation: 0,
      deleted: false,
    }))

    setFile({
      name: pdfFile.name,
      size: pdfFile.size,
      data: arrayBuffer,
    })
    setPageCount(count)
    setPages(pageItems)
    setSelectedPages(new Set(pageItems.map((page) => page.id)))
  }

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
      resetStateForFile()
      await loadPdf(selectedFile)
    } catch (err) {
      setError(`Failed to load PDF: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const onFileInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
      e.target.value = ''
    }
  }

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

  const toggleSplitAfter = (pageId) => {
    setSplitAfter((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const togglePageSelected = (pageId) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }

  const deletePage = (pageId) => {
    const target = pages.find((page) => page.id === pageId)
    if (!target || target.deleted) return

    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, deleted: true } : page))
    )

    setSelectedPages((prev) => {
      const next = new Set(prev)
      next.delete(pageId)
      return next
    })

    setSplitAfter((prev) => {
      const next = new Set(prev)
      next.delete(pageId)
      return next
    })
  }

  const rotatePage = (pageId, delta) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page
        const nextRotation = (page.rotation + delta + 360) % 360
        return { ...page, rotation: nextRotation }
      })
    )
  }

  const selectAllPages = () => {
    setSelectedPages(new Set(visiblePages.map((page) => page.id)))
  }

  const clearSelectedPages = () => {
    setSelectedPages(new Set())
  }

  const computeSplitChunks = () => {
    const chunks = []
    let current = []
    visiblePages.forEach((page, index) => {
      current.push(page)
      if (splitAfter.has(page.id) || index === visiblePages.length - 1) {
        if (current.length) chunks.push(current)
        current = []
      }
    })
    return chunks
  }

  const splitPdf = async () => {
    if (!file) return
    if (visiblePages.length === 0) {
      setError('No pages available to split.')
      return
    }
    setIsProcessing(true)
    setError('')
    setOutputFiles([])

    try {
      const pdfDoc = await PDFDocument.load(file.data.slice(0))
      const chunks = computeSplitChunks()
      const outputs = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const newPdf = await PDFDocument.create()
        const copiedPages = await newPdf.copyPages(pdfDoc, chunk.map((page) => page.pageIndex))
        copiedPages.forEach((page, idx) => {
          const rotation = chunk[idx].rotation || 0
          if (rotation % 360 !== 0) {
            page.setRotation(degrees(rotation))
          }
          newPdf.addPage(page)
        })
        newPdf.setProducer(PDF_CONFIG.producer)
        const pdfBytes = await newPdf.save()

        const baseName = file.name.replace(/\.pdf$/i, '')
        outputs.push({
          name: `${baseName}_part${i + 1}.pdf`,
          data: pdfBytes,
          pages: chunk.length,
        })
      }

      setOutputFiles(outputs)
    } catch (err) {
      setError(`Error splitting PDF: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const extractPdf = async () => {
    if (!file) return
    const selected = pages.filter((page) => selectedPages.has(page.id) && !page.deleted)
    if (selected.length === 0) {
      setError('Select at least one page to extract.')
      return
    }

    setIsProcessing(true)
    setError('')
    setOutputFiles([])

    try {
      const pdfDoc = await PDFDocument.load(file.data.slice(0))
      const newPdf = await PDFDocument.create()
      const copiedPages = await newPdf.copyPages(pdfDoc, selected.map((page) => page.pageIndex))
      copiedPages.forEach((page, idx) => {
        const rotation = selected[idx].rotation || 0
        if (rotation % 360 !== 0) {
          page.setRotation(degrees(rotation))
        }
        newPdf.addPage(page)
      })
      newPdf.setProducer(PDF_CONFIG.producer)
      const pdfBytes = await newPdf.save()

      const baseName = file.name.replace(/\.pdf$/i, '')
      setOutputFiles([
        {
          name: `${baseName}_extract.pdf`,
          data: pdfBytes,
          pages: selected.length,
        },
      ])
    } catch (err) {
      setError(`Error extracting pages: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFile = (output) => {
    const blob = new Blob([output.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = output.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    outputFiles.forEach((output) => downloadFile(output))
  }

  const splitCount = visiblePages.length === 0 ? 0 : splitAfter.size + 1
  const selectedCount = pages.filter((page) => selectedPages.has(page.id) && !page.deleted).length

  if (!file) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="p-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors bg-white dark:bg-slate-950 ${
              isDraggingOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-3xl text-blue-600 dark:text-blue-300 mb-6">
              📄
            </div>
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Click or drag PDF file here</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Max {config.maxFileSize / 1024 / 1024}MB</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              disabled={isProcessing}
            >
              Select PDF
            </button>
            <div className="mt-8 text-xs text-slate-400 dark:text-slate-500">
              🔒 All processing happens locally in your browser.
            </div>
          </div>

          <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">How it works</h2>
            <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li>Add a PDF by clicking the drop zone or dragging a file onto it.</li>
              <li>Choose Split or Extract at the top of the editor.</li>
              <li>Rotate or delete pages, then click Split or Extract.</li>
            </ol>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={config.acceptedExtensions}
            onChange={onFileInputChange}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <input
        ref={fileInputRef}
        type="file"
        accept={config.acceptedExtensions}
        onChange={onFileInputChange}
        className="hidden"
      />

      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                mode === 'split'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              ✂️ Split
            </button>
            <button
              onClick={() => setMode('extract')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                mode === 'extract'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              📄 Extract
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="text-lg">＋</span> Add PDF
            </button>
          </div>

          {mode === 'extract' && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPages}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              >
                Select all
              </button>
              <button
                onClick={clearSelectedPages}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              >
                Clear
              </button>
            </div>
          )}

          {mode === 'split' && (
            <div className="flex items-center gap-2 ml-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSplit}
                  onChange={(e) => setAutoSplit(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
                Split after every
              </label>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                <button
                  type="button"
                  onClick={() => setAutoSplitEvery((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={autoSplitEvery}
                  onChange={(e) => setAutoSplitEvery(e.target.value)}
                  className="w-12 text-center bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAutoSplitEvery((prev) => (parseInt(prev, 10) || 1) + 1)}
                  className="h-7 w-7 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">pages</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-slate-500 dark:text-slate-300">
              {file.name} • {visiblePages.length} pages
            </div>
            <button
              onClick={mode === 'split' ? splitPdf : extractPdf}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {mode === 'split' ? `Split (${splitCount} PDFs)` : `Extract (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <div
        className={`m-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 min-h-[65vh] p-6 ${
          isDraggingOver ? 'ring-2 ring-blue-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-wrap items-stretch gap-6">
          {visiblePages.map((page, index) => (
            <div key={page.id} className="flex items-stretch gap-6">
              <button
                type="button"
                onClick={() => (mode === 'extract' ? togglePageSelected(page.id) : null)}
                className={`group relative w-44 rounded-2xl border transition-all ${
                  mode === 'extract' && selectedPages.has(page.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-950 shadow-sm overflow-hidden`}
              >
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      rotatePage(page.id, -90)
                    }}
                    className="h-7 w-7 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-900"
                    title="Rotate left"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      rotatePage(page.id, 90)
                    }}
                    className="h-7 w-7 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-900"
                    title="Rotate right"
                  >
                    ↻
                  </button>
                </div>
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(page.id)
                    }}
                    className="h-7 w-7 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-red-500"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>

                <div className="aspect-[3/4] bg-white dark:bg-slate-950 flex items-center justify-center">
                  {pageThumbnails[page.pageIndex] ? (
                    <img
                      src={pageThumbnails[page.pageIndex]}
                      alt={`Page ${page.pageIndex + 1}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                  ) : (
                    <div className="text-slate-300 text-3xl">📄</div>
                  )}
                </div>
                <div className="px-2 py-2 text-center">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Page {page.pageIndex + 1}</div>
                </div>

                {mode === 'extract' && (
                  <div className="absolute bottom-2 right-2">
                    <div
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPages.has(page.id)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                )}
              </button>

              {index < visiblePages.length - 1 && mode === 'split' && (
                <div className="flex flex-col items-center justify-center">
                  <div className="h-32 w-px bg-blue-300 dark:bg-blue-700" />
                  <button
                    type="button"
                    onClick={() => {
                      if (autoSplit) setAutoSplit(false)
                      toggleSplitAfter(page.id)
                    }}
                    className={`my-2 h-10 w-10 rounded-full border flex items-center justify-center shadow-sm ${
                      splitAfter.has(page.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                    }`}
                    title="Toggle split"
                  >
                    ✂️
                  </button>
                  <div className="h-32 w-px bg-blue-300 dark:bg-blue-700" />
                </div>
              )}
            </div>
          ))}

          {visiblePages.length === 0 && (
            <div className="text-slate-400">No pages loaded.</div>
          )}
        </div>
      </div>

      {outputFiles.length > 0 && (
        <div className="mx-3 mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Output Files ({outputFiles.length})</h3>
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download all
            </button>
          </div>
          <div className="space-y-2">
            {outputFiles.map((output, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium">{output.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {output.pages} page{output.pages !== 1 ? 's' : ''} • {(output.data.byteLength / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(output)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
