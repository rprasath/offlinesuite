/**
 * PDF Signer - full-width workspace with sidebar page list, top toolbar, zoom/pan, click-to-sign and text
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  PenLine,
  Type as TypeIcon,
  Plus,
  X,
  Upload as UploadIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import { config, defaultSettings, viewerSettings } from './config'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const generateId = () => Math.random().toString(36).substring(2, 11)
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const dataUrlToArrayBuffer = (dataUrl) => {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export default function PdfSign() {
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [signatureImage, setSignatureImage] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [tool, setTool] = useState('signature') // signature | text

  const [signatureModal, setSignatureModal] = useState(false)
  const [signatureTab, setSignatureTab] = useState('draw') // draw | type | upload
  const [drawColor, setDrawColor] = useState('#000000')
  const [typedSignature, setTypedSignature] = useState('')
  const [typedWeight, setTypedWeight] = useState('600')
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('')
  const [drawDataUrl, setDrawDataUrl] = useState('')
  const [typePreviewUrl, setTypePreviewUrl] = useState('')
  const [signatureArmed, setSignatureArmed] = useState(false)
  const [textArmed, setTextArmed] = useState(false)

  const [zoom, setZoom] = useState(viewerSettings.initialScale)
  const [pageCursor, setPageCursor] = useState(0)
  const [hoverPos, setHoverPos] = useState(null)
  const [activeTextId, setActiveTextId] = useState(null)
  const [resizingSig, setResizingSig] = useState(null)
  const [draggingSig, setDraggingSig] = useState(null)
  const [selectedSigId, setSelectedSigId] = useState(null)
  const [selectedTextId, setSelectedTextId] = useState(null)

  const fileInputRef = useRef(null)
  const uploadSignatureRef = useRef(null)
  const drawCanvasRef = useRef(null)
  const drawCtxRef = useRef(null)
  const drawingRef = useRef(false)
  const pdfCacheRef = useRef(new Map())

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId) || files[0], [files, activeFileId])

  useEffect(() => {
    if (!signatureImage) {
      setSignaturePreviewUrl('')
      return
    }
    const blob = new Blob([signatureImage.data], { type: signatureImage.type || 'image/png' })
    const url = URL.createObjectURL(blob)
    setSignaturePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [signatureImage])

  useEffect(() => {
    if (!typedSignature.trim()) {
      setTypePreviewUrl('')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = 700
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000'
    ctx.font = `${typedWeight} 52px \"Caveat\", \"Pacifico\", \"Segoe Script\", cursive`
    ctx.textBaseline = 'middle'
    ctx.fillText(typedSignature.trim(), 30, canvas.height / 2)
    setTypePreviewUrl(canvas.toDataURL('image/png'))
  }, [typedSignature, typedWeight])

  useEffect(() => {
    if (!activeTextId) return
    setFiles(prev => prev.map(f => {
      if (f.id !== activeFile?.id) return f
      const next = f.textFields.map(field => (
        field.id === activeTextId
          ? { ...field, color: settings.textColor, size: settings.fontSize }
          : field
      ))
      return { ...f, textFields: next }
    }))
  }, [settings.textColor, settings.fontSize, activeTextId, activeFile?.id])

  const getPdfDoc = async (file) => {
    if (!file) return null
    const cached = pdfCacheRef.current.get(file.id)
    if (cached) return cached
    const loadingTask = pdfjsLib.getDocument({ data: file.data.slice(0) })
    const pdf = await loadingTask.promise
    pdfCacheRef.current.set(file.id, pdf)
    return pdf
  }

  // Load PDF
  const loadPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    return {
      id: generateId(),
      name: file.name,
      size: file.size,
      data: arrayBuffer,
      pageCount: pdfDoc.getPageCount(),
      signedData: null,
      status: 'pending',
      placements: [],
      textFields: [],
      thumbs: [],
    }
  }

  // Reset page and zoom when switching files
  useEffect(() => {
    if (!activeFile) return
    setPageCursor(0)
    setZoom(viewerSettings.initialScale)
  }, [activeFile?.id])

  // Render thumbnails once per file
  useEffect(() => {
    let cancelled = false
    const renderThumbs = async () => {
      if (!activeFile || (activeFile.thumbs && activeFile.thumbs.length)) return
      const pdf = await getPdfDoc(activeFile)
      if (!pdf || cancelled) return
      const thumbs = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: viewerSettings.thumbScale })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: ctx, viewport }).promise
        thumbs.push({ pageIndex: i - 1, url: canvas.toDataURL('image/png'), width: viewport.width, height: viewport.height })
      }
      if (cancelled) return
      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, thumbs } : f))
    }
    renderThumbs().catch(err => setError(err.message))
    return () => { cancelled = true }
  }, [activeFile?.id])

  // Render main page
  const [pageImages, setPageImages] = useState([])
  useEffect(() => {
    let cancelled = false
    const renderMain = async () => {
      if (!activeFile) return
      const pdf = await getPdfDoc(activeFile)
      if (!pdf || cancelled) return
      const page = await pdf.getPage(pageCursor + 1)
      const viewport = page.getViewport({ scale: zoom })
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
      if (cancelled) return
      setPageImages([{ pageIndex: pageCursor, url: canvas.toDataURL('image/png'), width: viewport.width, height: viewport.height }])
    }
    renderMain().catch(err => setError(err.message))
    return () => { cancelled = true }
  }, [activeFile?.id, pageCursor, zoom])

  // File handling
  const handleFiles = async (selectedFiles) => {
    setError('')
    const pdfFiles = Array.from(selectedFiles).filter(
      f => config.supportedTypes.includes(f.type) || f.name.toLowerCase().endsWith('.pdf')
    )
    if (pdfFiles.length === 0) return setError('Please select valid PDF files.')
    if (files.length + pdfFiles.length > config.maxFiles) return setError(`Maximum ${config.maxFiles} files allowed.`)

    try {
      const loaded = await Promise.all(pdfFiles.map(loadPdf))
      setFiles(prev => {
        const next = [...prev, ...loaded]
        if (!activeFileId) setActiveFileId(next[0]?.id)
        return next
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    }
  }

  // Signature upload (modal)
  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please upload an image file')
    const arrayBuffer = await file.arrayBuffer()
    setSignatureImage({ data: arrayBuffer, type: file.type, name: file.name })
    setSignatureArmed(true)
    setSignatureModal(false)
  }

  const getPointFromEvent = (evt, pageMeta) => {
    const rect = evt.currentTarget.getBoundingClientRect()
    const x = (evt.clientX - rect.left) * (pageMeta.width / rect.width)
    const y = pageMeta.height - (evt.clientY - rect.top) * (pageMeta.height / rect.height)
    const xPct = (evt.clientX - rect.left) / rect.width
    const yPct = 1 - (evt.clientY - rect.top) / rect.height
    return { x, y, xPct, yPct, rect }
  }

  const handleCanvasMove = (evt, pageMeta) => {
    if (tool !== 'signature' || !signaturePreviewUrl || !signatureArmed) return
    const { xPct, yPct } = getPointFromEvent(evt, pageMeta)
    setHoverPos({ pageIndex: pageMeta.pageIndex, xPct, yPct })
  }

  const handleCanvasLeave = () => {
    setHoverPos(null)
  }

  // Placement click on main page image
  const handleCanvasClick = (evt, pageMeta) => {
    if (tool === 'signature' && !signatureImage) {
      setError('')
      setSignatureModal(true)
      return
    }
    if (tool === 'signature' && !signatureArmed) return

    const { x, y } = getPointFromEvent(evt, pageMeta)

    if (tool === 'text') {
      if (!textArmed) return
      const id = generateId()
      setFiles(prev => prev.map(f => {
        if (f.id !== activeFile.id) return f
        return {
          ...f,
          textFields: [...f.textFields, {
            id,
            pageIndex: pageMeta.pageIndex,
            x,
            y,
            text: '',
            color: settings.textColor,
            size: settings.fontSize,
          }],
        }
      }))
      setActiveTextId(id)
      setTextArmed(false)
      return
    }

    setFiles(prev => prev.map(f => {
      if (f.id !== activeFile.id) return f
      return { ...f, placements: [...f.placements, { id: generateId(), pageIndex: pageMeta.pageIndex, x, y, width: settings.width, height: settings.height }] }
    }))
    setSignatureArmed(false)
  }

  const parsePageSelection = (selection, specificPages, totalPages) => {
    switch (selection) {
      case 'all': return Array.from({ length: totalPages }, (_, i) => i)
      case 'first': return [0]
      case 'last': return [totalPages - 1]
      case 'specific':
        return specificPages.split(',').map(t => t.trim()).filter(Boolean).flatMap(token => token.includes('-')
          ? (() => { const [s, e] = token.split('-').map(n => parseInt(n) - 1); return Array.from({ length: e - s + 1 }, (_, i) => s + i) })()
          : [parseInt(token) - 1]).filter(p => p >= 0 && p < totalPages)
      default: return [totalPages - 1]
    }
  }

  const signPdf = async (file) => {
    const pdfDoc = await PDFDocument.load(file.data)
    let signatureImg
    if (signatureImage) {
      signatureImg = signatureImage.type === 'image/png'
        ? await pdfDoc.embedPng(signatureImage.data)
        : await pdfDoc.embedJpg(signatureImage.data)
    }
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()

    if (signatureImg && file.placements.length === 0) {
      const pagesToSign = parsePageSelection(settings.pageSelection, settings.specificPages, pages.length)
      for (const pageIndex of pagesToSign) {
        const page = pages[pageIndex]
        if (!page) continue
        const { width: pw, height: ph } = page.getSize()
        const posMap = {
          'bottom-right': { x: pw - settings.width - settings.offsetX, y: settings.offsetY },
          'bottom-left': { x: settings.offsetX, y: settings.offsetY },
          'top-right': { x: pw - settings.width - settings.offsetX, y: ph - settings.height - settings.offsetY },
          'top-left': { x: settings.offsetX, y: ph - settings.height - settings.offsetY },
          'center': { x: (pw - settings.width) / 2, y: (ph - settings.height) / 2 },
        }
        const pos = posMap[settings.position] || posMap['bottom-right']
        page.drawImage(signatureImg, { x: pos.x, y: pos.y, width: settings.width, height: settings.height, opacity: settings.opacity })
      }
    }

    if (signatureImg && file.placements.length > 0) {
      for (const p of file.placements) {
        const page = pages[p.pageIndex]
        if (!page) continue
        page.drawImage(signatureImg, { x: p.x, y: p.y, width: p.width, height: p.height, opacity: settings.opacity })
      }
    }

    for (const t of file.textFields) {
      const page = pages[t.pageIndex]
      if (!page) continue
      if (!t.text) continue
      page.drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.size || settings.fontSize,
        font,
        color: rgb(
          parseInt((t.color || settings.textColor).slice(1, 3), 16) / 255,
          parseInt((t.color || settings.textColor).slice(3, 5), 16) / 255,
          parseInt((t.color || settings.textColor).slice(5, 7), 16) / 255,
        ),
      })
    }

    return pdfDoc.save()
  }

  const handleSignAll = async () => {
    if (!signatureImage && files.every(f => f.textFields.length === 0)) return setError('Add a signature or text first')
    if (files.length === 0) return setError('Please add PDF files')

    setIsProcessing(true)
    setProgress({ current: 0, total: files.length })
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f))
        try {
          const signedData = await signPdf(file)
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, signedData, status: 'done' } : f))
        } catch (err) {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error' } : f))
        }
        setProgress({ current: i + 1, total: files.length })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFile = (file) => {
    if (!file.signedData) return
    const blob = new Blob([file.signedData], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.pdf$/i, '_signed.pdf')
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => files.filter(f => f.signedData).forEach(downloadFile)

  // Drawing canvas setup
  useEffect(() => {
    if (!signatureModal || signatureTab !== 'draw') return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.width = 700
    canvas.height = 260
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = drawColor
    drawCtxRef.current = ctx
    if (drawDataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = drawDataUrl
    }
  }, [signatureModal, signatureTab, drawColor, drawDataUrl])

  const startDraw = (e) => {
    if (signatureTab !== 'draw') return
    drawingRef.current = true
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = drawCtxRef.current
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
  }

  const moveDraw = (e) => {
    if (!drawingRef.current || signatureTab !== 'draw') return
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = drawCtxRef.current
    ctx.strokeStyle = drawColor
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }

  const endDraw = () => { drawingRef.current = false }
  const clearDraw = () => { const c = drawCanvasRef.current; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height) }

  const createSignatureFromTyped = () => {
    const text = typedSignature.trim()
    if (!text) return setError('Type a name to create a signature')
    const dataUrl = typePreviewUrl
    if (!dataUrl) return setError('Type a name to create a signature')
    setSignatureImage({ data: dataUrlToArrayBuffer(dataUrl), type: 'image/png', name: 'typed-signature.png' })
    setSignatureArmed(true)
    setSignatureModal(false)
  }

  const createSignatureFromDraw = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setDrawDataUrl(dataUrl)
    setSignatureImage({ data: dataUrlToArrayBuffer(dataUrl), type: 'image/png', name: 'drawn-signature.png' })
    setSignatureArmed(true)
    setSignatureModal(false)
  }

  const removePlacement = (pageIndex, idx, kind = 'signature') => {
    setFiles(prev => prev.map(f => {
      if (f.id !== activeFile.id) return f
      if (kind === 'text') {
        const next = [...f.textFields]
        const removed = next.splice(idx, 1)
        if (removed[0]?.id === activeTextId) setActiveTextId(null)
        if (removed[0]?.id === selectedTextId) setSelectedTextId(null)
        return { ...f, textFields: next }
      }
      const next = [...f.placements]; next.splice(idx, 1); return { ...f, placements: next }
    }))
  }

  const startResizeSignature = (evt, pageMeta, id, handle) => {
    evt.stopPropagation()
    const rect = evt.currentTarget.closest('[data-sig-box]')?.getBoundingClientRect()
    if (!rect) return
    const scaleX = pageMeta.width / rect.width
    const scaleY = pageMeta.height / rect.height
    const sig = activeFile?.placements?.find(p => p.pageIndex === pageMeta.pageIndex && p.id === id)
    if (!sig) return
    setResizingSig({
      pageIndex: pageMeta.pageIndex,
      id,
      handle,
      startClientX: evt.clientX,
      startClientY: evt.clientY,
      startW: sig.width,
      startH: sig.height,
      ratio: sig.width / sig.height,
      startX: sig.x,
      startY: sig.y,
      scaleX,
      scaleY,
    })
  }

  useEffect(() => {
    if (!resizingSig) return
    const handleMove = (evt) => {
      const dx = (evt.clientX - resizingSig.startClientX) * resizingSig.scaleX
      const dy = -(evt.clientY - resizingSig.startClientY) * resizingSig.scaleY
      let newW = resizingSig.startW
      let newH = resizingSig.startH
      let newX = resizingSig.startX
      let newY = resizingSig.startY
      const applyRatio = (width) => Math.max(10, width / resizingSig.ratio)
      if (resizingSig.handle.includes('e')) {
        newW = Math.max(20, resizingSig.startW + dx)
        newH = applyRatio(newW)
      }
      if (resizingSig.handle.includes('w')) {
        newW = Math.max(20, resizingSig.startW - dx)
        newH = applyRatio(newW)
        newX = resizingSig.startX + dx
      }
      if (resizingSig.handle.includes('s')) {
        newH = Math.max(10, resizingSig.startH - dy)
        newW = Math.max(20, newH * resizingSig.ratio)
      }
      if (resizingSig.handle.includes('n')) {
        newH = Math.max(10, resizingSig.startH + dy)
        newW = Math.max(20, newH * resizingSig.ratio)
        newY = resizingSig.startY - dy
      }
      setFiles(prev => prev.map(f => {
        if (f.id !== activeFile?.id) return f
        const updated = f.placements.map((p, i) => {
          if (p.pageIndex !== resizingSig.pageIndex) return p
          if (p.id !== resizingSig.id) return p
          return { ...p, width: newW, height: newH, x: newX, y: newY }
        })
        return { ...f, placements: updated }
      }))
    }
    const handleUp = () => setResizingSig(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resizingSig, activeFile?.id])

  useEffect(() => {
    if (!draggingSig) return
    const handleMove = (evt) => {
      const dx = (evt.clientX - draggingSig.startClientX) * draggingSig.scaleX
      const dy = -(evt.clientY - draggingSig.startClientY) * draggingSig.scaleY
      setFiles(prev => prev.map(f => {
        if (f.id !== activeFile?.id) return f
        const updated = f.placements.map(p => {
          if (p.pageIndex !== draggingSig.pageIndex) return p
          if (p.id !== draggingSig.id) return p
          return { ...p, x: draggingSig.startX + dx, y: draggingSig.startY + dy }
        })
        return { ...f, placements: updated }
      }))
    }
    const handleUp = () => setDraggingSig(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [draggingSig, activeFile?.id])

  const selectPage = (idx) => {
    if (!activeFile) return
    setPageCursor(clamp(idx, 0, activeFile.pageCount - 1))
  }

  const changeZoom = (delta) => setZoom(z => clamp(z + delta, viewerSettings.minScale, viewerSettings.maxScale))
  const fitPage = () => setZoom(1)

  // Empty state
  if (files.length === 0) {
    return (
      <div className="w-full min-h-[80vh] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">PDF Signer</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">Sign PDFs offline with click‑to‑place signatures, text fill, and page navigation.</p>

          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-600/60 rounded-2xl px-6 py-14 text-center bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-4">📄</div>
            <div className="text-lg font-medium">Click or drag PDF files here</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Up to {config.maxFiles} files, max 50MB each</div>
          </div>

          <div className="mt-8 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">How it works</h2>
            <ol className="space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li>Add PDFs by clicking the drop zone or dragging files onto it.</li>
              <li>Create a signature, then click anywhere in the document to place it.</li>
              <li>Add text by choosing Text and clicking where you want to type.</li>
              <li>Click Finish to download your signed PDF.</li>
            </ol>
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">🔒 All processing happens locally in your browser. Files are never uploaded.</div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col">
      <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />

      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-xs">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar thumbnails */}
        <div className="w-56 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Pages</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{activeFile?.pageCount}</div>
          </div>
          <div className="space-y-3">
            {activeFile?.thumbs.map(thumb => (
              <div
                key={thumb.pageIndex}
                onClick={() => selectPage(thumb.pageIndex)}
                className={`relative rounded-lg border overflow-hidden cursor-pointer ${pageCursor === thumb.pageIndex ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <img src={thumb.url} alt={`Page ${thumb.pageIndex + 1}`} className="w-full block" />
                <div className="absolute bottom-1 right-2 bg-white/90 dark:bg-black/60 text-xs px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">{thumb.pageIndex + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main workspace */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 text-gray-800 dark:text-slate-100">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setTool('signature'); setSignatureModal(true); setSignatureArmed(false); setTextArmed(false) }}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${tool === 'signature' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-300 dark:border-slate-700 text-gray-700 dark:text-gray-200'}`}
              >
                <PenLine size={16} /> Signatures
                {signatureImage && <Check size={14} className="ml-1 text-green-600" />}
              </button>
              <button onClick={() => { setTool('text'); setTextArmed(true) }} className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${tool === 'text' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-300 dark:border-slate-700 text-gray-700 dark:text-gray-200'}`}><TypeIcon size={16} /> Text</button>
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 truncate max-w-[180px]">{activeFile?.name}</div>
            </div>
            {files.length > 1 && (
              <select
                value={activeFile?.id || ''}
                onChange={(e) => setActiveFileId(e.target.value)}
                className="ml-2 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 text-sm"
              >
                {files.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}

            {tool === 'text' && (
              <div className="flex items-center gap-2 ml-2 text-sm">
                <span className="text-xs text-gray-500 dark:text-gray-400">Click to place text</span>
                <input type="color" value={settings.textColor} onChange={(e) => setSettings({ ...settings, textColor: e.target.value })} className="h-8 w-10 border border-slate-300 dark:border-slate-700 rounded" />
                <input type="number" value={settings.fontSize} min={8} max={48} onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) || 14 })} className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded" />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-100 bg-white dark:bg-slate-900">+ Add PDF</button>
              {files.some(f => f.signedData) && (
                <button onClick={downloadAll} className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Download</button>
              )}
              <button onClick={handleSignAll} disabled={isProcessing} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Finish</button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <button onClick={() => changeZoom(-0.1)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-100"><ZoomOut size={16} /></button>
              <div className="w-12 text-center text-sm text-gray-700 dark:text-gray-100">{Math.round(zoom * 100)}%</div>
              <button onClick={() => changeZoom(0.1)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-100"><ZoomIn size={16} /></button>
              <button onClick={fitPage} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-100"><Maximize2 size={16} /></button>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => selectPage(pageCursor - 1)} disabled={pageCursor === 0} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-100"><ChevronLeft size={16} /></button>
                <div className="text-sm text-gray-700 dark:text-gray-100 w-16 text-center">{pageCursor + 1} / {activeFile?.pageCount}</div>
                <button onClick={() => selectPage(pageCursor + 1)} disabled={pageCursor >= (activeFile?.pageCount ?? 1) - 1} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-100"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>

          {/* Canvas area */}
          <div
            className="flex-1 min-h-0 overflow-auto bg-slate-100 dark:bg-slate-900/60 flex justify-center"
            onMouseDown={() => { setSelectedSigId(null); setSelectedTextId(null); setActiveTextId(null) }}
          >
            <div className="min-w-max py-4">
              {pageImages.map((img) => (
                <div key={img.pageIndex} className="relative">
                  <img
                    src={img.url}
                    alt={`Page ${img.pageIndex + 1}`}
                    className="shadow-md rounded-lg bg-white cursor-crosshair"
                    onClick={(e) => handleCanvasClick(e, img)}
                    onMouseMove={(e) => handleCanvasMove(e, img)}
                    onMouseLeave={handleCanvasLeave}
                    style={{ userSelect: 'none' }}
                  />
                  {tool === 'signature' && signaturePreviewUrl && signatureArmed && hoverPos?.pageIndex === img.pageIndex && (
                    <img
                      src={signaturePreviewUrl}
                      alt="Signature preview"
                      className="absolute pointer-events-none opacity-80"
                      style={{
                        left: `${hoverPos.xPct * 100}%`,
                        bottom: `${hoverPos.yPct * 100}%`,
                        width: `${(settings.width / img.width) * 100}%`,
                        height: `${(settings.height / img.height) * 100}%`,
                        transform: 'translate(-10%, -10%)',
                      }}
                    />
                  )}
                  {activeFile?.placements
                    .filter(p => p.pageIndex === img.pageIndex)
                    .map((p, idx) => (
                      <div
                        key={p.id || `sig-${idx}`}
                        data-sig-box
                        className={`absolute rounded ${selectedSigId === p.id ? 'border-2 border-blue-500/70 bg-blue-500/10 cursor-move' : 'border border-transparent'}`}
                        style={{
                          left: `${(p.x / img.width) * 100}%`,
                          bottom: `${(p.y / img.height) * 100}%`,
                          width: `${(p.width / img.width) * 100}%`,
                          height: `${(p.height / img.height) * 100}%`,
                        }}
                        onMouseDown={(e) => {
                          if (e.target?.dataset?.handle) return
                          e.stopPropagation()
                          setSelectedSigId(p.id)
                          setSelectedTextId(null)
                          const rect = e.currentTarget.getBoundingClientRect()
                          const scaleX = img.width / rect.width
                          const scaleY = img.height / rect.height
                          setDraggingSig({
                            pageIndex: img.pageIndex,
                            id: p.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            startX: p.x,
                            startY: p.y,
                            scaleX,
                            scaleY,
                          })
                        }}
                      >
                        {signaturePreviewUrl && (
                          <img
                            src={signaturePreviewUrl}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}
                        {selectedSigId === p.id && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); removePlacement(img.pageIndex, idx, 'signature') }}
                              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-500 border border-red-200 rounded-full p-1 shadow"
                            >
                              <X size={12} />
                            </button>
                            <button
                              data-handle
                              onMouseDown={(e) => startResizeSignature(e, img, p.id, 'se')}
                              className="absolute -bottom-2 -right-2 h-4 w-4 rounded-sm bg-blue-600 border border-white shadow"
                              title="Resize"
                            />
                            <button data-handle onMouseDown={(e) => startResizeSignature(e, img, p.id, 'sw')} className="absolute -bottom-2 -left-2 h-4 w-4 rounded-sm bg-blue-600 border border-white shadow" title="Resize" />
                            <button data-handle onMouseDown={(e) => startResizeSignature(e, img, p.id, 'ne')} className="absolute -top-2 -right-2 h-4 w-4 rounded-sm bg-blue-600 border border-white shadow" title="Resize" />
                            <button data-handle onMouseDown={(e) => startResizeSignature(e, img, p.id, 'nw')} className="absolute -top-2 -left-2 h-4 w-4 rounded-sm bg-blue-600 border border-white shadow" title="Resize" />
                          </>
                        )}
                      </div>
                    ))}
                  {activeFile?.textFields
                    .filter(t => t.pageIndex === img.pageIndex)
                    .map((t, idx) => (
                      <div
                        key={`txt-${idx}`}
                        className="absolute"
                        style={{
                          left: `${(t.x / img.width) * 100}%`,
                          bottom: `${(t.y / img.height) * 100}%`,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          setSelectedTextId(t.id)
                          setSelectedSigId(null)
                          setActiveTextId(t.id)
                        }}
                      >
                        {t.id === activeTextId ? (
                          <input
                            autoFocus
                            type="text"
                            value={t.text}
                            onChange={(e) => {
                              const value = e.target.value
                              setFiles(prev => prev.map(f => {
                                if (f.id !== activeFile.id) return f
                                const next = f.textFields.map(field => field.id === t.id ? { ...field, text: value } : field)
                                return { ...f, textFields: next }
                              }))
                            }}
                            onBlur={() => setActiveTextId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                setActiveTextId(null)
                              }
                            }}
                            className="px-2 py-1 rounded border border-amber-300 bg-white text-gray-900"
                            style={{ fontSize: t.size || settings.fontSize, color: t.color || settings.textColor }}
                          />
                        ) : (
                          <span
                            className="text-gray-900"
                            style={{ fontSize: t.size || settings.fontSize, color: t.color || settings.textColor }}
                          >
                            {t.text || 'Text'}
                          </span>
                        )}
                        {selectedTextId === t.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removePlacement(img.pageIndex, idx, 'text') }}
                            className="ml-1 text-red-500 bg-white border border-red-200 rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Signature modal */}
      {signatureModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative">
            <button className="absolute top-3 right-3 text-gray-500" onClick={() => setSignatureModal(false)}><X size={18} /></button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Create signature</h3>
            <div className="flex gap-3 mb-3">
              {['draw','type','upload'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSignatureTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm border ${signatureTab === tab ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}
                >
                  {tab === 'draw' ? 'Draw' : tab === 'type' ? 'Type' : 'Upload'}
                </button>
              ))}
            </div>

            {signatureTab === 'draw' && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {['#000000', '#1d4ed8', '#ef4444'].map(color => (
                    <button
                      key={color}
                      onClick={() => setDrawColor(color)}
                      className={`h-8 w-8 rounded-full border ${drawColor === color ? 'ring-2 ring-blue-500 border-white' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button onClick={clearDraw} className="ml-auto text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-3 py-1 rounded">Clear</button>
                </div>
                {drawDataUrl && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Check size={14} className="text-green-600" /> Signature saved
                  </div>
                )}
                <canvas
                  ref={drawCanvasRef}
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  className="w-full h-64 border border-gray-300 dark:border-gray-700 rounded bg-white"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setSignatureModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200">Cancel</button>
                  <button onClick={createSignatureFromDraw} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Use signature</button>
                </div>
              </div>
            )}

            {signatureTab === 'type' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <select value={typedWeight} onChange={(e) => setTypedWeight(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>
                <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center text-gray-600 dark:text-gray-300">
                  {typePreviewUrl ? (
                    <img src={typePreviewUrl} alt="Typed preview" className="mx-auto max-h-24" />
                  ) : (
                    'Type to preview your signature.'
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setSignatureModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200">Cancel</button>
                  <button onClick={createSignatureFromTyped} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Use signature</button>
                </div>
              </div>
            )}

            {signatureTab === 'upload' && (
              <div>
                <input ref={uploadSignatureRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center text-gray-600 dark:text-gray-300">
                  <UploadIcon className="mx-auto mb-3" />
                  <p>Upload a PNG/JPG signature image.</p>
                  <button onClick={() => uploadSignatureRef.current?.click()} className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Choose file</button>
                </div>
                {signaturePreviewUrl && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={14} className="text-green-600" />
                    Signature loaded
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setSignatureModal(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
