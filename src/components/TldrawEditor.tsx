import React, { useState, useCallback, useEffect } from 'react'
import { Tldraw, Editor } from '@tldraw/tldraw'
import { SimplePdfViewer } from './SimplePdfViewer'
import { MoveableColorSidebar } from './MoveableColorSidebar'
import '@tldraw/tldraw/tldraw.css'

interface TldrawEditorProps {
  samplePdfImages?: string[]
  showColorSidebar?: boolean
  showPdfViewer?: boolean
  onEditorMount?: (editor: Editor) => void
}

export const TldrawEditor: React.FC<TldrawEditorProps> = ({ 
  samplePdfImages = [],
  showColorSidebar = true,
  showPdfViewer = true,
  onEditorMount
}) => {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2)
  const [showPdfViewerState, setShowPdfViewerState] = useState(showPdfViewer && samplePdfImages.length > 0)

  // Handle editor mount
  const handleMount = useCallback((mountedEditor: Editor) => {
    setEditor(mountedEditor)

    // Remove any lingering pdf-viewer shapes from previous sessions
    try {
      const allShapes = (mountedEditor as any).getCurrentPageShapes?.() || []
      const pdfViewerShapes = allShapes.filter((s: any) => s?.type === 'pdf-viewer')
      if (pdfViewerShapes.length > 0) {
        const ids = pdfViewerShapes.map((s: any) => s.id)
        ;(mountedEditor as any).deleteShapes?.(ids)
      }
    } catch (e) {
      // Non-fatal; just best-effort cleanup
    }

    onEditorMount?.(mountedEditor)
  }, [onEditorMount])

  // Update PDF viewer overlay visibility when props change (overlay kept for demo UX)
  useEffect(() => {
    setShowPdfViewerState(showPdfViewer && samplePdfImages.length > 0)
  }, [showPdfViewer, samplePdfImages])

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    if (editor) {
      ;(editor as any).setStyleForNextShapes?.('color', color as any)
      ;(editor as any).setStyleForSelectedShapes?.('color', color as any)
    }
  }

  const handleToolChange = (tool: string) => {
    setCurrentTool(tool)
    if (editor) {
      // Map our tool names to TLDraw tool names
      const toolMap: Record<string, string> = {
        'select': 'select',
        'draw': 'draw',
        'highlight': 'highlight',
        'text': 'text',
        'rectangle': 'geo',
        'circle': 'geo',
        'arrow': 'arrow',
        'line': 'line',
        'eraser': 'eraser'
      }
      
      const tldrawTool = toolMap[tool] || 'select'
      ;(editor as any).setCurrentTool?.(tldrawTool)
      
      // Set shape type for geo tool
      if (tool === 'rectangle') {
        ;(editor as any).setStyleForNextShapes?.('geo', 'rectangle')
      } else if (tool === 'circle') {
        ;(editor as any).setStyleForNextShapes?.('geo', 'ellipse')
      }
    }
  }

  const handleStrokeWidthChange = (width: number) => {
    setCurrentStrokeWidth(width)
    if (editor) {
      const size = width > 8 ? 'xl' : width > 4 ? 'l' : width > 2 ? 'm' : 's'
      ;(editor as any).setStyleForNextShapes?.('size', size)
      ;(editor as any).setStyleForSelectedShapes?.('size', size)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* We pass shape utils via cast to any, for environments where the prop is supported */}
      <Tldraw 
        onMount={handleMount}
      />
      {showPdfViewerState && (
        <SimplePdfViewer
          imageUrls={samplePdfImages}
          onClose={() => setShowPdfViewerState(false)}
        />
      )}
      {showColorSidebar && (
        <MoveableColorSidebar
          onColorChange={handleColorChange}
          onToolChange={handleToolChange}
          onStrokeWidthChange={handleStrokeWidthChange}
        />
      )}
    </div>
  )
}
