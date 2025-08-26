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
  Search,
  Highlighter,
  MessageSquarePlus,
  Underline as UnderlineIcon,
  PenTool,
  Type as TypeIcon
} from 'lucide-react'

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

  // Prefer explicit pdfUrl prop, or try to resolve from the first image URL via a global map set by the processor
  const resolvedPdfUrl: string | null = React.useMemo(() => {
    if (pdfUrl) return pdfUrl
    const first = imageUrls?.[0]
    try {
      const map = (window as any).__pdfUrlByFirstImageUrl as Record<string, string> | undefined
      if (first && map && map[first]) return map[first]
    } catch {}
    return null
  }, [pdfUrl, imageUrls])

  const isPdfMode = !!resolvedPdfUrl

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



  // Wheel scroll handler to change pages at top/bottom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) return // don't hijack zoom gestures
    const el = scrollerRef.current
    if (!el || imageUrls.length <= 1) return

    const atTop = el.scrollTop <= 0
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2

    if (e.deltaY > 0) {
      // Scrolling down
      if (atBottom || el.scrollHeight <= el.clientHeight) {
        if (currentPage < imageUrls.length - 1) {
          e.preventDefault()
          pendingScrollRef.current = 'top'
          setCurrentPage(p => Math.min(imageUrls.length - 1, p + 1))
        }
      }
    } else if (e.deltaY < 0) {
      // Scrolling up
      if (atTop || el.scrollHeight <= el.clientHeight) {
        if (currentPage > 0) {
          e.preventDefault()
          pendingScrollRef.current = 'bottom'
          setCurrentPage(p => Math.max(0, p - 1))
        }
      }
    }
  }, [currentPage, imageUrls.length])

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
          {imageUrls.length > 1 && (
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              Page {currentPage + 1} of {imageUrls.length}
            </span>
          )}
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


      {/* Outer Left Sidebar (dummy) */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: -56,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRight: 'none',
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          padding: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          zIndex: 200,
        }}
      >
        <button title="High-light Text" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Highlighter size={16} />
        </button>
        <button title="Add Comments/Notes" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquarePlus size={16} />
        </button>
        <button title="Underline or Strike-through" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UnderlineIcon size={16} />
        </button>
        <button title="Draw or Sketch" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PenTool size={16} />
        </button>
        <button title="Insert Shapes" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Square size={16} />
        </button>
        <button title="Text Boxes" style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f8f9fa', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TypeIcon size={16} />
        </button>
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
            background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(0,123,255,0.5) 50%, rgba(0,123,255,0.8) 100%)'
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
                  onClick={() => setCurrentPage(index)}
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
          onWheel={isPdfMode ? undefined : handleWheel}
          style={{
            flex: 1,
            overflow: isPdfMode ? 'hidden' : 'auto',
            padding: isPdfMode ? 0 : '16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
>
          {isPdfMode ? (
            <iframe
              src={resolvedPdfUrl!}
              title="PDF Document"
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            />
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
                }}
                onError={(e) => {
                  // Keep the image in the DOM; log for debugging but do not hide it.
                  console.error('Image failed to load for page', currentPage, imageUrls[currentPage], e)
                  setImgError('Failed to load page image')
                  setPageReady(false)
                }}
              />

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

