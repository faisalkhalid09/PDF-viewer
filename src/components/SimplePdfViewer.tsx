import React, { useState } from 'react'
import { 
  Maximize2, 
  Minimize2, 
  Square, 
  X, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react'

interface SimplePdfViewerProps {
  imageUrls: string[]
  onClose?: () => void
}

export const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({
  imageUrls,
  onClose
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 600, height: 400 })
  const [originalState, setOriginalState] = useState({ position, size })

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
        overflow: 'hidden',
        zIndex: 100,
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
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 0 ? 0.5 : 1,
                }}
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(imageUrls.length - 1, currentPage + 1))}
                disabled={currentPage === imageUrls.length - 1}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: currentPage === imageUrls.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === imageUrls.length - 1 ? 0.5 : 1,
                }}
              >
                <ChevronDown size={14} />
              </button>
            </>
          )}
          
          {isMaximized ? (
            <button
              onClick={handleRestore}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={handleMaximize}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Maximize2 size={14} />
            </button>
          )}
          
          <button
            onClick={handleMinimize}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Minimize2 size={14} />
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,0,0,0.3)',
              border: 'none',
              color: 'white',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        style={{
          height: 'calc(100% - 40px)',
          overflow: 'auto',
          padding: '16px',
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
          <div>
            <div
              key={currentPage}
              style={{
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrls[currentPage]}
                alt={`PDF Page ${currentPage + 1}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
