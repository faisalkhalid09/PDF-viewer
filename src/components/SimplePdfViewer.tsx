import React, { useState, useEffect, useCallback } from 'react'
import { 
  Maximize2, 
  Minimize2, 
  Square, 
  X, 
  RotateCw,
  Printer,
  Download,
  BookOpen,
  Search
} from 'lucide-react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
// Configure pdf.js worker once for react-pdf v10 (Vite)
import '../pdf/setupPdfWorker'

interface SimplePdfViewerProps {
  imageUrls: string[]
  pdfUrl?: string | null
  onClose?: () => void
}

export const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({
  imageUrls,
  pdfUrl,
  onClose
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 600, height: 400 })
  const [originalState, setOriginalState] = useState({ position, size })
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStateRef = React.useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)


  // Scroll-pagination: when user scrolls to bottom, go to next page; at top, go to previous
  const scrollerRef = React.useRef<HTMLDivElement | null>(null)
  const pendingScrollRef = React.useRef<'top' | 'bottom' | null>(null)
  const [pageReady, setPageReady] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)

  // Sidebar tool state and overlay for PDF mode
  type Tool = 'none' | 'highlight' | 'comment' | 'underline' | 'strike' | 'draw' | 'shape' | 'text' | 'erase'
  const [tool, setTool] = useState<Tool>('none')
  const pdfPageRefs = React.useRef<Record<number, HTMLDivElement | null>>({})
  const svgRefs = React.useRef<Record<number, SVGSVGElement | null>>({})
  const [pageSizes, setPageSizes] = useState<Record<number, { w: number; h: number }>>({})
  const [annots, setAnnots] = useState<Record<number, any[]>>({})
  const drawingRef = React.useRef<{ page: number; kind: 'draw' | 'shape'; points: { x: number; y: number }[]; start?: { x: number; y: number } } | null>(null)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)
  const [penColor, setPenColor] = useState<string>('#111111')

  // Prefer explicit pdfUrl prop, or try to resolve from the first image URL via a global map set by the processor
  const resolvedPdfUrl: string | null = React.useMemo(() => {
    if (pdfUrl) return pdfUrl
    const first = imageUrls?.[0]
    try {
      const map = (window as any).__pdfUrlByFirstImageUrl as Record<string, string> | undefined
      if (first && map && map[first]) return map[first]
      const lastUploaded = (window as any).__lastUploadedPdfUrl as string | undefined
      if (lastUploaded) return lastUploaded
    } catch {}
    return null
  }, [pdfUrl, imageUrls])

  const isPdfMode = !!resolvedPdfUrl
  useEffect(() => {
    console.log('[PDF] resolvedPdfUrl?', !!resolvedPdfUrl, 'docKey:', (resolvedPdfUrl || imageUrls?.[0] || 'no-doc'))
  }, [resolvedPdfUrl, imageUrls])

  // Normalize file prop for react-pdf: use { data: base64 } for data URIs
  const documentFile: any = React.useMemo(() => {
    if (!resolvedPdfUrl) return undefined
    const dataPrefix = 'data:application/pdf;base64,'
    if (resolvedPdfUrl.startsWith(dataPrefix)) {
      const raw = resolvedPdfUrl.slice(dataPrefix.length).replace(/\s+/g, '')
      // Prefer Uint8Array for maximum compatibility across pdf.js versions
      try {
        const binary = atob(raw)
        const len = binary.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
        return { data: bytes }
      } catch {
        return { data: raw }
      }
    }
    return resolvedPdfUrl
  }, [resolvedPdfUrl])

  // Persist annotations per document so switching PDFs keeps their own annotations
  const docKey: string = React.useMemo(() => {
    const key = resolvedPdfUrl || imageUrls?.[0] || 'no-doc'
    return String(key)
  }, [resolvedPdfUrl, imageUrls])
  const annotsByDocRef = React.useRef<Record<string, Record<number, any[]>>>({})
  const prevDocKeyRef = React.useRef<string | null>(null)

  // Initialize from any saved global annotations (e.g., when loading a workspace)
  useEffect(() => {
    try {
      const saved = (window as any).__pdfAnnotsByDoc as Record<string, Record<number, any[]>> | undefined
      if (saved && typeof saved === 'object') {
        annotsByDocRef.current = { ...saved }
      }
    } catch {}
  }, [])

  // When document changes, save current annots and load the target doc's annots
  useEffect(() => {
    const prev = prevDocKeyRef.current
    if (prev) {
      annotsByDocRef.current[prev] = annots
      try {
        (window as any).__pdfAnnotsByDoc = {
          ...(window as any).__pdfAnnotsByDoc,
          [prev]: annots
        }
      } catch {}
    }
    let nextAnnots = annotsByDocRef.current[docKey] || {}

    // Migration: If switching to a new key (e.g., base64 data URL) and no annots exist under it,
    // but there are annots under the first image key, copy them over so saved work reappears.
    const firstImgKey = imageUrls?.[0]
    if ((!nextAnnots || Object.keys(nextAnnots).length === 0) && firstImgKey && annotsByDocRef.current[firstImgKey]) {
      try {
        annotsByDocRef.current[docKey] = annotsByDocRef.current[firstImgKey]
        ;(window as any).__pdfAnnotsByDoc = {
          ...(window as any).__pdfAnnotsByDoc,
          [docKey]: annotsByDocRef.current[firstImgKey]
        }
        nextAnnots = annotsByDocRef.current[docKey]
      } catch {}
    }

    setAnnots(nextAnnots)
    // Reset per-document derived state
    setPageSizes({})
    setCurrentPage(0)
    setPageReady(false)
    setImgError(null)
    prevDocKeyRef.current = docKey
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey])

  // Keep cache updated when annots change
  useEffect(() => {
    annotsByDocRef.current[docKey] = annots
    try {
      (window as any).__pdfAnnotsByDoc = {
        ...(window as any).__pdfAnnotsByDoc,
        [docKey]: annots
      }
    } catch {}
  }, [annots, docKey])

  const handleMaximize = () => {
    if (!isMaximized) {
      setOriginalState({ position, size })
      setPosition({ x: 20, y: 80 })
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 120 })
    }
    setIsMaximized(true)
    setIsMinimized(false)
  }

  const handleRestore = () => {
    setPosition(originalState.position)
    setSize(originalState.size)
    setIsMaximized(false)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
    setIsMaximized(false)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(300, prev + 25))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(25, prev - 25))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const content = imageUrls.map((url, index) => 
        `<div style="page-break-after: always;"><img src="${url}" style="width: 100%; height: auto;" alt="Page ${index + 1}"/></div>`
      ).join('')
      
      printWindow.document.write(`
        <html>
          <head><title>Print PDF</title></head>
          <body>${content}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    // Create a canvas to combine all pages
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // For now, just download the first page as an image
    // In a real implementation, you'd combine all pages into a PDF
    const link = document.createElement('a')
    link.href = imageUrls[0]
    link.download = `pdf-page-${currentPage + 1}.png`
    link.click()
  }

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle shortcuts when not typing in search input
    if (e.target instanceof HTMLInputElement) return

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        setCurrentPage(prev => Math.max(0, prev - 1))
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        setCurrentPage(prev => Math.min(imageUrls.length - 1, prev + 1))
        break
      case 'Home':
        e.preventDefault()
        setCurrentPage(0)
        break
      case 'End':
        e.preventDefault()
        setCurrentPage(imageUrls.length - 1)
        break
      case '+':
      case '=':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomIn()
        }
        break
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomOut()
        }
        break
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setZoomLevel(100)
        }
        break
      case 'r':
      case 'R':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleRotate()
        }
        break
      case 'p':
      case 'P':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handlePrint()
        }
        break
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setShowSearch(!showSearch)
        }
        break
      case 't':
      case 'T':
        if (e.ctrlKey || e.metaKey && imageUrls.length > 1) {
          e.preventDefault()
          setShowThumbnails(!showThumbnails)
        }
        break
      case 'Escape':
        if (showSearch) {
          setShowSearch(false)
        } else if (isMaximized) {
          handleRestore()
        } else {
          onClose?.()
        }
        break
      case 'F11':
        e.preventDefault()
        if (isMaximized) {
          handleRestore()
        } else {
          handleMaximize()
        }
        break
      case 'F1':
      case '?':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          setShowHelp(!showHelp)
        }
        break
    }
  }, [currentPage, imageUrls.length, showSearch, showThumbnails, isMaximized, onClose])

  // Setup keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Reset page readiness when image src context changes
  useEffect(() => {
    setPageReady(false)
    setImgError(null)
  }, [currentPage, zoomLevel, rotation])



  // Helpers for PDF overlay
  const updateOverlaySizeFor = useCallback((page: number) => {
    const el = pdfPageRefs.current[page]
    if (!el) return
    const r = el.getBoundingClientRect()
    setPageSizes(ps => ({ ...ps, [page]: { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) } }))
  }, [])

  // Continuous scroll uses layout-based centering; overlay sizes update on each page render

  const pctPoint = (page: number, clientX: number, clientY: number) => {
    const el = pdfPageRefs.current[page]
    if (!el) return { x: 0, y: 0 }
    const box = el.getBoundingClientRect()
    const x = (clientX - box.left) / box.width
    const y = (clientY - box.top) / box.height
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
  }

  const handleSvgPointerDown = (page: number) => (e: React.PointerEvent<SVGSVGElement>) => {
    // In PDF mode, let the text layer handle selection for highlight/underline
    if (isPdfMode && (tool === 'highlight' || tool === 'underline')) {
      return
    }

    // For drawing/erasing/placing items, prevent default and capture pointer
    e.preventDefault()
    e.stopPropagation()
    try { (e.currentTarget as any).setPointerCapture?.(e.pointerId) } catch {}

    // Erase tool: click to remove the top-most annotation under cursor
    if (tool === 'erase') {
      const removed = eraseAt(page, e.clientX, e.clientY)
      return
    }

    if (tool === 'draw') {
      const p = pctPoint(page, e.clientX, e.clientY)
      drawingRef.current = { page, kind: 'draw', points: [p] }
    } else if (tool === 'shape') {
      const p = pctPoint(page, e.clientX, e.clientY)
      drawingRef.current = { page, kind: 'shape', points: [], start: p }
    } else if (tool === 'text' || tool === 'comment') {
      const p = pctPoint(page, e.clientX, e.clientY)
      const id = `txt-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setAnnots(prev => ({
        ...prev,
        [page]: [
          ...(prev[page] || []),
          { id, type: tool === 'text' ? 'text' : 'note', x: p.x, y: p.y, content: tool === 'text' ? 'Text' : 'Note' }
        ]
      }))
      setLastCreatedId(id)
    }
  }

  const handleSvgPointerMove = (page: number) => (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drawingRef.current
    if (!d || d.page !== page) return
    if (d.kind === 'draw') {
      d.points.push(pctPoint(page, e.clientX, e.clientY))
      // force re-render by updating sizes state
      setPageSizes(ps => ({ ...ps }))
    } else if (d.kind === 'shape') {
      const p = pctPoint(page, e.clientX, e.clientY)
      // keep only the latest point as the current cursor
      d.points = [p]
      setPageSizes(ps => ({ ...ps }))
    }
  }

  const handleSvgPointerUp = (page: number) => () => {
    const d = drawingRef.current
    if (!d || d.page !== page) return
    if (d.kind === 'draw' && d.points.length > 1) {
      const id = `stk-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setAnnots(prev => ({ ...prev, [page]: [ ...(prev[page]||[]), { id, type: 'stroke', path: d.points, color: penColor } ] }))
    } else if (d.kind === 'shape' && d.start) {
      const last = d.points[d.points.length - 1]
      const end = last || d.start
      const x1 = Math.min(d.start.x, end.x)
      const y1 = Math.min(d.start.y, end.y)
      const w = Math.abs(end.x - d.start.x)
      const h = Math.abs(end.y - d.start.y)
      const id = `rect-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setAnnots(prev => ({ ...prev, [page]: [ ...(prev[page]||[]), { id, type: 'rect', x: x1, y: y1, w, h } ] }))
    }
    drawingRef.current = null
  }

  // Simple hit-test and erase logic
  const eraseAt = (page: number, clientX: number, clientY: number): boolean => {
    const size = pageSizes[page]
    const el = pdfPageRefs.current[page]
    if (!size || !el) return false
    const box = el.getBoundingClientRect()
    const px = clientX - box.left
    const py = clientY - box.top

    const items = annots[page] || []
    let removed = false
    const hitT = 8 // px tolerance

    // traverse from top-most to bottom
    for (let i = items.length - 1; i >= 0; i--) {
      const a = items[i]
      if (a.type === 'rect' || a.type === 'highlight') {
        const x = a.x * size.w
        const y = a.y * size.h
        const w = a.w * size.w
        const h = a.h * size.h
        if (px >= x && px <= x + w && py >= y && py <= y + h) {
          setAnnots(prev => ({ ...prev, [page]: items.filter((_, idx) => idx !== i) }))
          removed = true
          break
        }
      } else if (a.type === 'underline') {
        const x = a.x * size.w
        const y = (a.y + a.h) * size.h
        const w = a.w * size.w
        if (px >= x && px <= x + w && Math.abs(py - y) <= hitT) {
          setAnnots(prev => ({ ...prev, [page]: items.filter((_, idx) => idx !== i) }))
          removed = true
          break
        }
      } else if (a.type === 'strike') {
        const x = a.x * size.w
        const y = (a.y + a.h / 2) * size.h
        const w = a.w * size.w
        if (px >= x && px <= x + w && Math.abs(py - y) <= hitT) {
          setAnnots(prev => ({ ...prev, [page]: items.filter((_, idx) => idx !== i) }))
          removed = true
          break
        }
      } else if (a.type === 'stroke' && Array.isArray(a.path) && a.path.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        a.path.forEach((p: any) => {
          const X = p.x * size.w, Y = p.y * size.h
          if (X < minX) minX = X
          if (Y < minY) minY = Y
          if (X > maxX) maxX = X
          if (Y > maxY) maxY = Y
        })
        if (px >= minX - hitT && px <= maxX + hitT && py >= minY - hitT && py <= maxY + hitT) {
          setAnnots(prev => ({ ...prev, [page]: items.filter((_, idx) => idx !== i) }))
          removed = true
          break
        }
      }
    }
    return removed
  }

  // Capture selection rectangles for highlight/underline/strike
  useEffect(() => {
    if (!isPdfMode) return
    const onUp = () => {
      if (!(tool === 'highlight' || tool === 'underline' || tool === 'strike')) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      const rects = Array.from(range.getClientRects())
      if (!rects.length) return

      const toAddByPage: Record<number, any[]> = {}
      rects.forEach(r => {
        Object.entries(pdfPageRefs.current).forEach(([k, el]) => {
          const page = Number(k)
          if (!el) return
          const box = el.getBoundingClientRect()
          const left = Math.max(box.left, r.left)
          const top = Math.max(box.top, r.top)
          const right = Math.min(box.right, r.right)
          const bottom = Math.min(box.bottom, r.bottom)
          const w = right - left
          const h = bottom - top
          if (w > 2 && h > 1) {
            const item = { x: (left - box.left) / box.width, y: (top - box.top) / box.height, w: w / box.width, h: h / box.height }
            const idPrefix = tool === 'highlight' ? 'hl' : tool === 'underline' ? 'ul' : 'st'
            const newItem = { id: `${idPrefix}-${Date.now()}-${Math.random()}`, type: tool, ...item }
            if (!toAddByPage[page]) toAddByPage[page] = []
            toAddByPage[page].push(newItem)
          }
        })
      })

      if (Object.keys(toAddByPage).length) {
        setAnnots(prev => {
          const next = { ...prev }
          for (const [pageStr, items] of Object.entries(toAddByPage)) {
            const page = Number(pageStr)
            next[page] = [ ...(next[page] || []), ...(items as any[]) ]
          }
          return next
        })
      }
    }
    document.addEventListener('mouseup', onUp)
    return () => document.removeEventListener('mouseup', onUp)
  }, [tool, isPdfMode])

  // Focus newly created text/note immediately for editing
  useEffect(() => {
    if (!lastCreatedId) return
    const el = document.querySelector(`[data-annot-id="${lastCreatedId}"]`) as HTMLElement | null
    if (el) {
      el.focus()
      const sel = window.getSelection()
      if (sel) {
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    setLastCreatedId(null)
  }, [lastCreatedId])

  // Bridge: listen for external tool changes coming from the global bottom toolbar
  useEffect(() => {
    const onSetTool = (e: Event) => {
      const ce = e as CustomEvent
      const t = ce?.detail?.tool as Tool | undefined
      if (!t) return
      setTool(t)
    }
    window.addEventListener('pdf-set-tool', onSetTool as EventListener)
    return () => {
      window.removeEventListener('pdf-set-tool', onSetTool as EventListener)
    }
  }, [])

  // Listen for color changes from the global color sidebar
  useEffect(() => {
    const onSetColor = (e: Event) => {
      const ce = e as CustomEvent
      const c = ce?.detail?.color as string | undefined
      if (!c) return
      setPenColor(c)
    }
    window.addEventListener('pdf-set-color', onSetColor as EventListener)
    return () => window.removeEventListener('pdf-set-color', onSetColor as EventListener)
  }, [])

  // Wheel handling via native listener (passive:false) to intercept Ctrl+wheel and avoid browser zoom
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const step = 10
        setZoomLevel(prev => Math.min(300, Math.max(25, prev + (e.deltaY < 0 ? step : -step))))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel as EventListener)
    }
  }, [])

  // Keep overlay size in sync for image mode when zoom/rotation/page changes
  useEffect(() => {
    if (isPdfMode) return
    const id = requestAnimationFrame(() => {
      try { updateOverlaySizeFor(currentPage) } catch {}
    })
    return () => cancelAnimationFrame(id)
  }, [zoomLevel, rotation, currentPage, isPdfMode])

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: 300,
          height: 40,
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          cursor: 'pointer',
          zIndex: 100,
        }}
        onClick={handleRestore}
      >
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          PDF Viewer ({imageUrls.length} pages)
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: 'white',
        border: '2px solid #007bff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'visible',
        zIndex: 100,
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* Header with controls */}
      <div
        style={{
          height: '40px',
          backgroundColor: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          color: 'white',
          cursor: 'move',
        }}
        onMouseDown={(e) => {
          if (isMaximized) return
          
          const startX = e.clientX - position.x
          const startY = e.clientY - position.y

          const handleMouseMove = (e: MouseEvent) => {
            setPosition({
              x: e.clientX - startX,
              y: e.clientY - startY,
            })
          }

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            PDF Viewer
          </span>
          {(() => { const pageCount = isPdfMode ? (numPages || imageUrls.length) : imageUrls.length; return pageCount > 1 ? (
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              Page {currentPage + 1} of {pageCount}
            </span>
          ) : null })()}
          <span style={{ fontSize: '11px', opacity: 0.7 }}>
            {zoomLevel}%
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>

          {!isPdfMode && (
            <>
              {/* Rotate */}
              <button
                onClick={handleRotate}
                title="Rotate 90°"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <RotateCw size={12} />
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                title="Print"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Printer size={12} />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                title="Download Current Page"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Download size={12} />
              </button>
            </>
          )}

          {/* Thumbnails Toggle */}
          {imageUrls.length > 1 && (
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              title="Thumbnails"
              style={{
                background: showThumbnails ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={12} />
            </button>
          )}

          {/* Window Controls */}
          {isMaximized ? (
            <button
              onClick={handleRestore}
              title="Restore"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Square size={12} />
            </button>
          ) : (
            <button
              onClick={handleMaximize}
              title="Maximize"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Maximize2 size={12} />
            </button>
          )}
          
          <button
            onClick={handleMinimize}
            title="Minimize"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Minimize2 size={12} />
          </button>
          
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'rgba(255,0,0,0.3)',
              border: 'none',
              color: 'white',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>



      {/* Resize handle (bottom-right) */}
      {!isMaximized && !isMinimized && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsResizing(true)
            resizeStateRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              startW: size.width,
              startH: size.height,
            }
            const onMove = (ev: MouseEvent) => {
              const s = resizeStateRef.current
              if (!s) return
              const dx = ev.clientX - s.startX
              const dy = ev.clientY - s.startY
              const minW = 360
              const minH = 240
              const maxW = Math.max(minW, window.innerWidth - position.x - 20)
              const maxH = Math.max(minH, window.innerHeight - position.y - 20)
              const nextW = Math.min(maxW, Math.max(minW, s.startW + dx))
              const nextH = Math.min(maxH, Math.max(minH, s.startH + dy))
              setSize({ width: nextW, height: nextH })
            }
            const onUp = () => {
              setIsResizing(false)
              resizeStateRef.current = null
              document.removeEventListener('mousemove', onMove)
              document.removeEventListener('mouseup', onUp)
            }
            document.addEventListener('mousemove', onMove)
            document.addEventListener('mouseup', onUp)
          }}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(0,123,255,0.5) 50%, rgba(0,123,255,0.8) 100%)',
            zIndex: 500
          }}
          title="Resize"
        />
      )}

      {/* Search Bar */}
      {showSearch && (
        <div
          style={{
            height: '36px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px',
          }}
        >
          <Search size={14} color="#6c757d" />
          <input
            type="text"
            placeholder="Search in PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: '1px solid #ced4da',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // TODO: Implement search functionality
                console.log('Search for:', searchQuery)
              }
            }}
          />
          <span style={{ fontSize: '11px', color: '#6c757d' }}>
            Press Enter to search
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          height: `calc(100% - ${40 + (showSearch ? 36 : 0)}px)`,
          display: 'flex',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Thumbnail Panel */}
        {showThumbnails && imageUrls.length > 1 && (
          <div
            style={{
              width: '180px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #dee2e6',
              overflow: 'auto',
              padding: '8px',
            }}
          >
            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '500', color: '#6c757d' }}>
              Thumbnails
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {imageUrls.map((url, index) => (
                <div
                  key={index}
                  onClick={() => { if (isPdfMode) { const el = pdfPageRefs.current[index]; el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } setCurrentPage(index) }}
                  style={{
                    cursor: 'pointer',
                    border: currentPage === index ? '2px solid #007bff' : '1px solid #dee2e6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    backgroundColor: currentPage === index ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.borderColor = '#007bff'
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== index) {
                      e.currentTarget.style.borderColor = '#dee2e6'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  <img
                    src={url}
                    alt={`Page ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      textAlign: 'center',
                      color: currentPage === index ? '#007bff' : '#6c757d',
                      fontWeight: currentPage === index ? '500' : 'normal',
                    }}
                  >
                    Page {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Content */}
        <div
          ref={scrollerRef}
          onScroll={() => {
            const scroller = scrollerRef.current
            if (!scroller || !isPdfMode) return
            const scrollerRect = scroller.getBoundingClientRect()
            let bestIndex = 0
            let bestScore = Number.POSITIVE_INFINITY
            Object.entries(pdfPageRefs.current).forEach(([k, el]) => {
              const index = Number(k)
              if (!el) return
              const rect = el.getBoundingClientRect()
              const scrollerMidY = (scrollerRect.top + scrollerRect.bottom) / 2
              const pageMidY = (rect.top + rect.bottom) / 2
              const score = Math.abs(pageMidY - scrollerMidY)
              if (score < bestScore) { bestScore = score; bestIndex = index }
            })
            setCurrentPage(bestIndex)
          }}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '16px',
          }}
>
          {isPdfMode ? (
            <Document file={documentFile!} onLoadSuccess={({ numPages }) => { console.log('[PDF] onLoadSuccess pages:', numPages); setNumPages(numPages)} } onLoadError={(e:any)=>{console.error('PDF load error:', e)}} loading={<div style={{ padding: 24 }}>Loading PDF…</div>}>
              {Array.from({ length: numPages || 0 }, (_, index) => (
                <div
                  key={index}
                  ref={(el) => { pdfPageRefs.current[index] = el }}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ position: 'relative', margin: '16px 0', background: 'white', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Page pageNumber={index + 1} scale={zoomLevel / 100} rotate={rotation} renderTextLayer renderAnnotationLayer={false} onRenderSuccess={() => updateOverlaySizeFor(index)} />
                  {/* SVG Overlay for annotations */}
                  <svg
                    ref={(el) => { svgRefs.current[index] = el as SVGSVGElement | null }}
                    onPointerDown={handleSvgPointerDown(index)}
                    onPointerMove={handleSvgPointerMove(index)}
                    onPointerUp={handleSvgPointerUp(index)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: (tool==='draw'||tool==='shape'||tool==='text'||tool==='comment'||tool==='erase') ? 'auto' : 'none', cursor: (tool==='draw'||tool==='shape') ? 'crosshair' : (tool==='text'||tool==='comment') ? 'text' : (tool==='erase') ? 'not-allowed' : 'default', touchAction: 'none' }}
                  >
                    {(annots[index] || []).filter(a => a.type==='stroke').map(a => (
                      <polyline key={a.id} fill="none" stroke={a.color || '#111111'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={a.path.map((p: any) => `${p.x*(pageSizes[index]?.w||0)},${p.y*(pageSizes[index]?.h||0)}`).join(' ')} />
                    ))}
                    {(annots[index] || []).filter(a => a.type==='rect').map(a => (
                      <rect key={a.id} x={a.x*(pageSizes[index]?.w||0)} y={a.y*(pageSizes[index]?.h||0)} width={a.w*(pageSizes[index]?.w||0)} height={a.h*(pageSizes[index]?.h||0)} stroke="#2563eb" strokeWidth={2} fill="none" />
                    ))}
                    {(annots[index] || []).filter(a => a.type==='highlight').map(a => (
                      <rect key={a.id} x={a.x*(pageSizes[index]?.w||0)} y={a.y*(pageSizes[index]?.h||0)} width={a.w*(pageSizes[index]?.w||0)} height={a.h*(pageSizes[index]?.h||0)} fill="rgba(255,235,59,0.4)" />
                    ))}
                    {(annots[index] || []).filter(a => a.type==='underline').map(a => (
                      <line key={a.id} x1={a.x*(pageSizes[index]?.w||0)} x2={(a.x+a.w)*(pageSizes[index]?.w||0)} y1={(a.y+a.h)*(pageSizes[index]?.h||0) - 2} y2={(a.y+a.h)*(pageSizes[index]?.h||0) - 2} stroke="#111" strokeWidth={2} />
                    ))}
                    {(annots[index] || []).filter(a => a.type==='strike').map(a => (
                      <line key={a.id} x1={a.x*(pageSizes[index]?.w||0)} x2={(a.x+a.w)*(pageSizes[index]?.w||0)} y1={a.y*(pageSizes[index]?.h||0) + ((a.h*(pageSizes[index]?.h||0))/2)} y2={a.y*(pageSizes[index]?.h||0) + ((a.h*(pageSizes[index]?.h||0))/2)} stroke="#111" strokeWidth={2} />
                    ))}
                    {/* live draw preview while dragging */}
                    {drawingRef.current && drawingRef.current.page===index && drawingRef.current.kind==='draw' && drawingRef.current.points.length>0 && (
                      <polyline fill="none" stroke={penColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={drawingRef.current.points.map((p: any) => `${p.x*(pageSizes[index]?.w||0)},${p.y*(pageSizes[index]?.h||0)}`).join(' ')} />
                    )}
                    {/* live shape preview while dragging */}
                    {drawingRef.current && drawingRef.current.page===index && drawingRef.current.kind==='shape' && drawingRef.current.start && (
                      (() => { const start = drawingRef.current!.start!; const last = (drawingRef.current!.points[0]) || start; const W = pageSizes[index]?.w || 0; const H = pageSizes[index]?.h || 0; const x=Math.min(start.x,last.x)*W; const y=Math.min(start.y,last.y)*H; const w=Math.abs(last.x-start.x)*W; const h=Math.abs(last.y-start.y)*H; return <rect x={x} y={y} width={w} height={h} stroke="#2563eb" strokeDasharray="4 3" fill="none" /> })()
                    )}
                  </svg>
                  {/* Text and Notes overlays */}
                  {(annots[index] || []).filter(a => a.type==='text' || a.type==='note').map(a => {
                    const W = pageSizes[index]?.w || 0; const H = pageSizes[index]?.h || 0; const left = a.x*W; const top = a.y*H; const style: React.CSSProperties = a.type==='note' ? { position:'absolute', left, top, background:'#fff3bf', border:'1px solid #ffe066', borderRadius:6, padding:6, minWidth:80, boxShadow:'0 1px 4px rgba(0,0,0,0.2)', fontSize:12, cursor: tool==='erase' ? 'not-allowed' : 'text', zIndex: 20 } : { position:'absolute', left, top, background:'#fff', border:'1px solid #dee2e6', borderRadius:6, padding:6, minWidth:80, boxShadow:'0 1px 4px rgba(0,0,0,0.2)', fontSize:12, cursor: tool==='erase' ? 'not-allowed' : 'text', zIndex: 20 }
                    return (
                      <div key={a.id} data-annot-id={a.id} contentEditable suppressContentEditableWarning style={style} onMouseDown={(e)=>{
                        if (tool==='erase') { e.preventDefault(); e.stopPropagation(); setAnnots(prev=>({ ...prev, [index]: (prev[index]||[]).filter(it=> it.id!==a.id) })); }
                      }} onBlur={(e)=>{
                        const text = (e.target as HTMLDivElement).innerText; setAnnots(prev=>({ ...prev, [index]: (prev[index]||[]).map(it=> it.id===a.id ? { ...it, content:text } : it) }))
                      }}>{a.content}</div>
                    )
                  })}
                </div>
              ))}
            </Document>
          ) : imageUrls.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                fontSize: '16px',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <BookOpen size={48} color="#6c757d" />
              <span>No PDF pages loaded</span>
            </div>
          ) : (
            <div
              ref={(el) => { pdfPageRefs.current[currentPage] = el }}
              style={{
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'inline-block',
                position: 'relative'
              }}
            >
              <img
                src={imageUrls[currentPage]}
                alt={`PDF Page ${currentPage + 1}`}
                style={{
                  width: `${zoomLevel}%`,
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                }}
                onLoad={() => {
                  const el = scrollerRef.current
                  if (el) {
                    if (pendingScrollRef.current === 'top') {
                      el.scrollTop = 0
                    } else if (pendingScrollRef.current === 'bottom') {
                      el.scrollTop = el.scrollHeight
                    }
                  }
                  pendingScrollRef.current = null
                  setImgError(null)
                  setPageReady(true)
                  // Update overlay size for image mode
                  try { updateOverlaySizeFor(currentPage) } catch {}
                }}
                onError={(e) => {
                  // Keep the image in the DOM; log for debugging but do not hide it.
                  console.error('Image failed to load for page', currentPage, imageUrls[currentPage], e)
                  setImgError('Failed to load page image')
                  setPageReady(false)
                }}
              />

              {/* SVG Overlay for annotations in image mode */}
              <svg
                ref={(el) => { svgRefs.current[currentPage] = el as SVGSVGElement | null }}
                onPointerDown={handleSvgPointerDown(currentPage)}
                onPointerMove={handleSvgPointerMove(currentPage)}
                onPointerUp={handleSvgPointerUp(currentPage)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: (tool==='draw'||tool==='shape'||tool==='text'||tool==='comment'||tool==='erase') ? 'auto' : 'none', cursor: (tool==='draw'||tool==='shape') ? 'crosshair' : (tool==='text'||tool==='comment') ? 'text' : (tool==='erase') ? 'not-allowed' : 'default', touchAction: 'none' }}
              >
                {(annots[currentPage] || []).filter(a => a.type==='stroke').map(a => (
                  <polyline key={a.id} fill="none" stroke={a.color || '#111111'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={a.path.map((p: any) => `${p.x*(pageSizes[currentPage]?.w||0)},${p.y*(pageSizes[currentPage]?.h||0)}`).join(' ')} />
                ))}
                {(annots[currentPage] || []).filter(a => a.type==='rect').map(a => (
                  <rect key={a.id} x={a.x*(pageSizes[currentPage]?.w||0)} y={a.y*(pageSizes[currentPage]?.h||0)} width={a.w*(pageSizes[currentPage]?.w||0)} height={a.h*(pageSizes[currentPage]?.h||0)} stroke="#2563eb" strokeWidth={2} fill="none" />
                ))}
                {(annots[currentPage] || []).filter(a => a.type==='highlight').map(a => (
                  <rect key={a.id} x={a.x*(pageSizes[currentPage]?.w||0)} y={a.y*(pageSizes[currentPage]?.h||0)} width={a.w*(pageSizes[currentPage]?.w||0)} height={a.h*(pageSizes[currentPage]?.h||0)} fill="rgba(255,235,59,0.4)" />
                ))}
                {(annots[currentPage] || []).filter(a => a.type==='underline').map(a => (
                  <line key={a.id} x1={a.x*(pageSizes[currentPage]?.w||0)} x2={(a.x+a.w)*(pageSizes[currentPage]?.w||0)} y1={(a.y+a.h)*(pageSizes[currentPage]?.h||0) - 2} y2={(a.y+a.h)*(pageSizes[currentPage]?.h||0) - 2} stroke="#111" strokeWidth={2} />
                ))}
                {/* live draw preview while dragging */}
                {drawingRef.current && drawingRef.current.page===currentPage && drawingRef.current.kind==='draw' && drawingRef.current.points.length>0 && (
                  <polyline fill="none" stroke={penColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={drawingRef.current.points.map((p: any) => `${p.x*(pageSizes[currentPage]?.w||0)},${p.y*(pageSizes[currentPage]?.h||0)}`).join(' ')} />
                )}
                {/* live shape preview while dragging */}
                {drawingRef.current && drawingRef.current.page===currentPage && drawingRef.current.kind==='shape' && drawingRef.current.start && (
                  (() => { const start = drawingRef.current!.start!; const last = (drawingRef.current!.points[0]) || start; const W = pageSizes[currentPage]?.w || 0; const H = pageSizes[currentPage]?.h || 0; const x=Math.min(start.x,last.x)*W; const y=Math.min(start.y,last.y)*H; const w=Math.abs(last.x-start.x)*W; const h=Math.abs(last.y-start.y)*H; return <rect x={x} y={y} width={w} height={h} stroke="#2563eb" strokeDasharray="4 3" fill="none" /> })()
                )}
              </svg>

              {/* Text and Notes overlays for image mode */}
              {(annots[currentPage] || []).filter(a => a.type==='text' || a.type==='note').map(a => {
                const W = pageSizes[currentPage]?.w || 0; const H = pageSizes[currentPage]?.h || 0; const left = a.x*W; const top = a.y*H; const style: React.CSSProperties = a.type==='note' ? { position:'absolute', left, top, background:'#fff3bf', border:'1px solid #ffe066', borderRadius:6, padding:6, minWidth:80, boxShadow:'0 1px 4px rgba(0,0,0,0.2)', fontSize:12, cursor: tool==='erase' ? 'not-allowed' : 'text', zIndex: 20 } : { position:'absolute', left, top, background:'#fff', border:'1px solid #dee2e6', borderRadius:6, padding:6, minWidth:80, boxShadow:'0 1px 4px rgba(0,0,0,0.2)', fontSize:12, cursor: tool==='erase' ? 'not-allowed' : 'text', zIndex: 20 }
                return (
                  <div key={a.id} data-annot-id={a.id} contentEditable suppressContentEditableWarning style={style} onMouseDown={(e)=>{
                    if (tool==='erase') { e.preventDefault(); e.stopPropagation(); setAnnots(prev=>({ ...prev, [currentPage]: (prev[currentPage]||[]).filter(it=> it.id!==a.id) })); }
                  }} onBlur={(e)=>{
                    const text = (e.target as HTMLDivElement).innerText; setAnnots(prev=>({ ...prev, [currentPage]: (prev[currentPage]||[]).map(it=> it.id===a.id ? { ...it, content:text } : it) }))
                  }}>{a.content}</div>
                )
              })}

              {/* Loading or Error Overlays */}
              {!pageReady && !imgError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    minWidth: 200,
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 10px, #ffffff 10px, #ffffff 20px)',
                    color: '#6c757d',
                    fontSize: 14,
                    borderRadius: '4px'
                  }}
                >
                  Loading page...
                </div>
              )}
              {imgError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    minWidth: 260,
                    minHeight: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff5f5',
                    color: '#b00020',
                    fontSize: 13,
                    border: '1px solid #ffc9c9',
                    borderRadius: '4px',
                    padding: 12,
                    textAlign: 'center'
                  }}
                >
                  {imgError}. Please check the console logs for details.
                </div>
              )}

            </div>
          )}
        </div>
      </div>


      {/* Help Dialog */}
      {showHelp && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              maxHeight: '80%',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>PDF Viewer Help</h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <X size={20} color="#666" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Navigation Shortcuts */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>Navigation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Next page:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>→ ↓</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Previous page:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>← ↑</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>First page:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Home</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Last page:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>End</code>
                  </div>
                </div>
              </div>

              {/* View Controls */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>View Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Zoom in:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl +</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Zoom out:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl -</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Reset zoom:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl 0</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Rotate:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl R</code>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Print:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl P</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Search:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl F</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Thumbnails:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Ctrl T</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Help:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>F1 or ?</code>
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>Window</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Maximize/Restore:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>F11</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Close dialog:</span>
                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Escape</code>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Accessibility Features</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
                <li>All buttons have descriptive tooltips</li>
                <li>Full keyboard navigation support</li>
                <li>High contrast UI elements</li>
                <li>Screen reader compatible</li>
                <li>Keyboard focus indicators</li>
              </ul>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

