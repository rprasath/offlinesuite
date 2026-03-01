/**
 * PDF Diff Tool - Compare two PDF files
 */

import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { config, comparisonModes, viewOptions as defaultViewOptions } from './config'

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function PdfDiff() {
  const [leftFile, setLeftFile] = useState(null)
  const [rightFile, setRightFile] = useState(null)
  const [comparisonMode, setComparisonMode] = useState('text')
  const [viewOptions, setViewOptions] = useState(defaultViewOptions)
  const [error, setError] = useState('')
  const [isComparing, setIsComparing] = useState(false)
  const [diffResult, setDiffResult] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const leftFileRef = useRef(null)
  const rightFileRef = useRef(null)
  const leftCanvasRef = useRef(null)
  const rightCanvasRef = useRef(null)

  // Load PDF file
  const loadPdfFile = async (file, side) => {
    if (!file) return

    if (file.size > config.maxFileSize) {
      setError(`File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setError('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const pageCount = pdfDoc.getPageCount()

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      const pdfData = {
        name: file.name,
        arrayBuffer,
        pdfDoc,
        pdf,
        pageCount,
      }

      if (side === 'left') {
        setLeftFile(pdfData)
      } else {
        setRightFile(pdfData)
      }
    } catch (err) {
      setError(`Failed to load PDF: ${err.message}`)
    }
  }

  // Handle file upload
  const handleFileUpload = (e, side) => {
    const file = e.target.files?.[0]
    if (file) {
      loadPdfFile(file, side)
    }
  }

  // Extract text from PDF
  const extractTextFromPdf = async (pdfData) => {
    const pages = []
    
    for (let i = 1; i <= pdfData.pageCount; i++) {
      const page = await pdfData.pdf.getPage(i)
      const textContent = await page.getTextContent()
      const text = textContent.items.map(item => item.str).join(' ')
      pages.push({ pageNum: i, text })
    }
    
    return pages
  }

  // Compare text content
  const compareText = async () => {
    if (!leftFile || !rightFile) {
      setError('Please upload both PDF files')
      return
    }

    setIsComparing(true)
    setError('')

    try {
      const leftPages = await extractTextFromPdf(leftFile)
      const rightPages = await extractTextFromPdf(rightFile)

      const maxPages = Math.max(leftPages.length, rightPages.length)
      const differences = []

      for (let i = 0; i < maxPages; i++) {
        const leftText = preprocessText(leftPages[i]?.text || '')
        const rightText = preprocessText(rightPages[i]?.text || '')

        if (leftText !== rightText) {
          differences.push({
            pageNum: i + 1,
            leftText: leftPages[i]?.text || '',
            rightText: rightPages[i]?.text || '',
            different: true,
          })
        } else {
          differences.push({
            pageNum: i + 1,
            leftText: leftPages[i]?.text || '',
            rightText: rightPages[i]?.text || '',
            different: false,
          })
        }
      }

      setDiffResult({
        type: 'text',
        differences,
        totalPages: maxPages,
        differentPages: differences.filter(d => d.different).length,
      })
    } catch (err) {
      setError(`Comparison failed: ${err.message}`)
    } finally {
      setIsComparing(false)
    }
  }

  // Preprocess text based on options
  const preprocessText = (text) => {
    let processed = text
    
    if (viewOptions.ignoreWhitespace) {
      processed = processed.replace(/\s+/g, ' ').trim()
    }
    
    if (viewOptions.ignoreCase) {
      processed = processed.toLowerCase()
    }
    
    return processed
  }

  // Render PDF page to canvas
  const renderPdfPage = async (pdfData, pageNum, canvas) => {
    if (!pdfData || !canvas) return

    try {
      const page = await pdfData.pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.5 })
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const ctx = canvas.getContext('2d')
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise
    } catch (err) {
      console.error('Error rendering page:', err)
    }
  }

  // Compare visually
  const compareVisual = async () => {
    if (!leftFile || !rightFile) {
      setError('Please upload both PDF files')
      return
    }

    setIsComparing(true)
    setError('')

    try {
      const maxPages = Math.max(leftFile.pageCount, rightFile.pageCount)
      
      setDiffResult({
        type: 'visual',
        totalPages: maxPages,
        leftPageCount: leftFile.pageCount,
        rightPageCount: rightFile.pageCount,
      })

      setCurrentPage(1)
      
      // Render first page
      if (leftCanvasRef.current && rightCanvasRef.current) {
        await Promise.all([
          renderPdfPage(leftFile, 1, leftCanvasRef.current),
          renderPdfPage(rightFile, 1, rightCanvasRef.current),
        ])
      }
    } catch (err) {
      setError(`Comparison failed: ${err.message}`)
    } finally {
      setIsComparing(false)
    }
  }

  // Compare PDFs
  const comparePdfs = () => {
    if (comparisonMode === 'text') {
      compareText()
    } else {
      compareVisual()
    }
  }

  // Handle page change
  const handlePageChange = async (newPage) => {
    if (!diffResult || diffResult.type !== 'visual') return
    if (newPage < 1 || newPage > diffResult.totalPages) return

    setCurrentPage(newPage)
    
    if (leftCanvasRef.current && rightCanvasRef.current) {
      await Promise.all([
        newPage <= leftFile.pageCount ? renderPdfPage(leftFile, newPage, leftCanvasRef.current) : clearCanvas(leftCanvasRef.current),
        newPage <= rightFile.pageCount ? renderPdfPage(rightFile, newPage, rightCanvasRef.current) : clearCanvas(rightCanvasRef.current),
      ])
    }
  }

  // Clear canvas
  const clearCanvas = (canvas) => {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#6b7280'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Page not available', canvas.width / 2, canvas.height / 2)
  }

  // Reset
  const reset = () => {
    setLeftFile(null)
    setRightFile(null)
    setDiffResult(null)
    setCurrentPage(1)
    setError('')
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">PDF Diff Tool</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare two PDF files to find differences</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 transition-colors">
          {error}
        </div>
      )}

      {!diffResult ? (
        <>
          {/* Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left PDF */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Original PDF</h2>
              
              <input
                ref={leftFileRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'left')}
                className="hidden"
              />
              
              {!leftFile ? (
                <button
                  onClick={() => leftFileRef.current?.click()}
                  className="w-full px-4 py-12 bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-blue-700 dark:text-blue-300"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <div className="font-medium">Upload Original PDF</div>
                </button>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{leftFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{leftFile.pageCount} pages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLeftFile(null)}
                    className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Right PDF */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Modified PDF</h2>
              
              <input
                ref={rightFileRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'right')}
                className="hidden"
              />
              
              {!rightFile ? (
                <button
                  onClick={() => rightFileRef.current?.click()}
                  className="w-full px-4 py-12 bg-green-50 dark:bg-green-900/30 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition text-green-700 dark:text-green-300"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <div className="font-medium">Upload Modified PDF</div>
                </button>
              ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{rightFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{rightFile.pageCount} pages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRightFile(null)}
                    className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Comparison Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Comparison Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comparison Mode
                </label>
                <div className="space-y-2">
                  {comparisonModes.map(mode => (
                    <label key={mode.value} className="flex items-start gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="comparisonMode"
                        value={mode.value}
                        checked={comparisonMode === mode.value}
                        onChange={(e) => setComparisonMode(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{mode.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options for text mode */}
              {comparisonMode === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Comparison Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={viewOptions.showPageNumbers}
                        onChange={(e) => setViewOptions({ ...viewOptions, showPageNumbers: e.target.checked })}
                        className="rounded"
                      />
                      Show Page Numbers
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={viewOptions.ignoreWhitespace}
                        onChange={(e) => setViewOptions({ ...viewOptions, ignoreWhitespace: e.target.checked })}
                        className="rounded"
                      />
                      Ignore Whitespace
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={viewOptions.ignoreCase}
                        onChange={(e) => setViewOptions({ ...viewOptions, ignoreCase: e.target.checked })}
                        className="rounded"
                      />
                      Ignore Case
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                      <input
                        type="checkbox"
                        checked={viewOptions.highlightDifferences}
                        onChange={(e) => setViewOptions({ ...viewOptions, highlightDifferences: e.target.checked })}
                        className="rounded"
                      />
                      Highlight Differences
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compare Button */}
          {leftFile && rightFile && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <button
                onClick={comparePdfs}
                disabled={isComparing}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition"
              >
                {isComparing ? 'Comparing...' : 'Compare PDFs'}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Results */}
          {diffResult.type === 'text' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comparison Results</h2>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Compare New Files
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{diffResult.totalPages}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Pages</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">{diffResult.differentPages}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Different Pages</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{diffResult.totalPages - diffResult.differentPages}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Identical Pages</div>
                </div>
              </div>

              {/* Page by page comparison */}
              <div className="space-y-4">
                {diffResult.differences.map((diff, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-colors ${
                      diff.different ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`font-semibold ${diff.different ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                        Page {diff.pageNum}
                      </span>
                      <span className={`text-sm ${diff.different ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {diff.different ? '⚠️ Different' : '✓ Identical'}
                      </span>
                    </div>

                    {diff.different && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-blue-700 dark:text-blue-400 mb-1">Original:</div>
                          <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-300 dark:border-gray-600 max-h-32 overflow-auto text-gray-900 dark:text-gray-100">
                            {diff.leftText || <span className="text-gray-400">No content</span>}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-green-700 dark:text-green-400 mb-1">Modified:</div>
                          <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-300 dark:border-gray-600 max-h-32 overflow-auto text-gray-900 dark:text-gray-100">
                            {diff.rightText || <span className="text-gray-400">No content</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diffResult.type === 'visual' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Visual Comparison - Page {currentPage} of {diffResult.totalPages}</h2>
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Compare New Files
                </button>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {diffResult.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === diffResult.totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              {/* Side by side canvases */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 rounded-t-lg text-gray-900 dark:text-gray-100">
                    {leftFile.name} {currentPage > leftFile.pageCount && '(No page)'}
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700 overflow-auto">
                    <canvas ref={leftCanvasRef} className="max-w-full h-auto" />
                  </div>
                </div>
                <div>
                  <div className="bg-green-100 dark:bg-green-900/30 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 rounded-t-lg text-gray-900 dark:text-gray-100">
                    {rightFile.name} {currentPage > rightFile.pageCount && '(No page)'}
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700 overflow-auto">
                    <canvas ref={rightCanvasRef} className="max-w-full h-auto" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ How to Use</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Upload two PDF files to compare</li>
          <li>• Choose Text Comparison to compare extracted text content</li>
          <li>• Choose Visual Comparison to view pages side-by-side</li>
          <li>• Text mode shows differences page by page with statistics</li>
          <li>• Visual mode lets you navigate through pages to spot visual changes</li>
          <li>• All processing happens locally - your PDFs stay private</li>
        </ul>
      </div>
    </div>
  )
}
