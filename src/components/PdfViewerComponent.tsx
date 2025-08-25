import React, { useState, useEffect, useRef } from 'react'
import { Box } from '@tldraw/tldraw'
import { 
  Maximize2, 
  Minimize2, 
  Square, 
  X, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react'
import { PdfViewerShape } from '../shapes/PdfViewerShape'

interface PdfViewerComponentProps {
  shape: PdfViewerShape
  bounds?: Box
  onMaximize: (shape: PdfViewerShape) => void
  onMinimize: (shape: PdfViewerShape) => void
  onRestore: (shape: PdfViewerShape) => void
  onClose: (shape: PdfViewerShape) => void
}

export const PdfViewerComponent: React.FC<PdfViewerComponentProps> = ({
  shape,
  onMaximize,
  onMinimize,
  onRestore,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const { imageUrls, isMaximized, isMinimized } = shape.props

  // Auto-hide toolbar after 3 seconds of no interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsToolbarVisible(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isToolbarVisible])

  const handleMouseEnter = () => {
    setIsToolbarVisible(true)
  }

  const handleToolbarAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    action()
  }

  const scrollToPage = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const pageElement = scrollContainerRef.current.children[pageIndex] as HTMLElement
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPage(pageIndex)
      }
    }
  }

  // Handle scroll to update current page
  const handleScroll = () => {
    if (scrollContainerRef.current && imageUrls.length > 1) {
      const container = scrollContainerRef.current
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const pageHeight = containerHeight / Math.max(1, imageUrls.length)
      
      const newCurrentPage = Math.floor(scrollTop / pageHeight)
      if (newCurrentPage !== currentPage && newCurrentPage >= 0 && newCurrentPage < imageUrls.length) {
        setCurrentPage(newCurrentPage)
      }
    }
  }

  if (isMinimized) {
    return (
      <div
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={handleToolbarAction(() => onRestore(shape))}
        onMouseEnter={handleMouseEnter}
      >
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          PDF Viewer ({imageUrls.length} pages)
        </span>
        <button
          onClick={handleToolbarAction(() => onClose(shape))}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsToolbarVisible(false)}
    >
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '6px',
          padding: '4px',
          display: 'flex',
          gap: '4px',
          zIndex: 10,
          opacity: isToolbarVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isToolbarVisible ? 'auto' : 'none',
        }}
      >
        {isMaximized ? (
          <button
            onClick={handleToolbarAction(() => onRestore(shape))}
            style={toolbarButtonStyle}
            title="Restore"
          >
            <Square size={16} color="white" />
          </button>
        ) : (
          <button
            onClick={handleToolbarAction(() => onMaximize(shape))}
            style={toolbarButtonStyle}
            title="Maximize"
          >
            <Maximize2 size={16} color="white" />
          </button>
        )}
        
        <button
          onClick={handleToolbarAction(() => onMinimize(shape))}
          style={toolbarButtonStyle}
          title="Minimize"
        >
          <Minimize2 size={16} color="white" />
        </button>
        
        <button
          onClick={handleToolbarAction(() => onClose(shape))}
          style={toolbarButtonStyle}
          title="Close"
        >
          <X size={16} color="white" />
        </button>
      </div>

      {/* Page Navigation */}
      {imageUrls.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '6px',
            padding: '8px 12px',
            zIndex: 10,
            opacity: isToolbarVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: isToolbarVisible ? 'auto' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToolbarAction(() => scrollToPage(Math.max(0, currentPage - 1)))}
              disabled={currentPage === 0}
              style={{
                ...toolbarButtonStyle,
                opacity: currentPage === 0 ? 0.5 : 1,
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronUp size={16} color="white" />
            </button>
            
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
              {currentPage + 1} / {imageUrls.length}
            </span>
            
            <button
              onClick={handleToolbarAction(() => scrollToPage(Math.min(imageUrls.length - 1, currentPage + 1)))}
              disabled={currentPage === imageUrls.length - 1}
              style={{
                ...toolbarButtonStyle,
                opacity: currentPage === imageUrls.length - 1 ? 0.5 : 1,
                cursor: currentPage === imageUrls.length - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronDown size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* PDF Pages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
        }}
      >
        {imageUrls.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              fontSize: '16px',
            }}
          >
            No PDF pages loaded
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            {imageUrls.map((imageUrl, index) => (
              <div
                key={index}
                style={{
                  marginBottom: index < imageUrls.length - 1 ? '16px' : '0',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={imageUrl}
                  alt={`PDF Page ${index + 1}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    pointerEvents: 'none', // Allow TLDraw annotations to work
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const toolbarButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease',
}

// Add hover effect via CSS-in-JS alternative
const addHoverEffect = () => {
  const style = document.createElement('style')
  style.textContent = `
    .pdf-toolbar-button:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
  `
  if (!document.querySelector('style[data-pdf-toolbar]')) {
    style.setAttribute('data-pdf-toolbar', 'true')
    document.head.appendChild(style)
  }
}

// Initialize hover effects
if (typeof window !== 'undefined') {
  addHoverEffect()
}
