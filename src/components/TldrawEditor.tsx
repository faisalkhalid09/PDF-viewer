import React, { useState, useCallback, useEffect } from 'react'
import { Tldraw, Editor } from '@tldraw/tldraw'
import { SimplePdfViewer } from './SimplePdfViewer'
import { MoveableColorSidebar } from './MoveableColorSidebar'
import '@tldraw/tldraw/tldraw.css'
import { PdfBottomBarBridge } from './pdf/PdfBottomBarBridge'

interface TldrawEditorProps {
  samplePdfImages?: string[]
  currentPdfBase64?: string | null
  showColorSidebar?: boolean
  showPdfViewer?: boolean
  onEditorMount?: (editor: Editor) => void
}

export const TldrawEditor: React.FC<TldrawEditorProps> = ({ 
  samplePdfImages = [],
  currentPdfBase64 = null,
  showColorSidebar = true,
  showPdfViewer = true,
  onEditorMount
}) => {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2)
  const [showPdfViewerState, setShowPdfViewerState] = useState(showPdfViewer && (samplePdfImages.length > 0 || !!currentPdfBase64))

  // Handle editor mount
  const handleMount = useCallback((mountedEditor: Editor) => {
    console.log('[TldrawEditor] onMount called')
    setEditor(mountedEditor)

    // Remove any lingering pdf-viewer shapes from previous sessions
    try {
      const allShapes = (mountedEditor as any).getCurrentPageShapes?.() || []
      console.log('[TldrawEditor] current page shapes:', allShapes?.length)
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
    setShowPdfViewerState(showPdfViewer && (samplePdfImages.length > 0 || !!currentPdfBase64))
  }, [showPdfViewer, samplePdfImages, currentPdfBase64])

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    if (editor) {
      ;(editor as any).setStyleForNextShapes?.('color', color as any)
      ;(editor as any).setStyleForSelectedShapes?.('color', color as any)
    }
    // Also forward the color to the PDF viewer so the pen matches the TLDraw color picker
    try {
      window.dispatchEvent(new CustomEvent('pdf-set-color', { detail: { color } }))
    } catch {}
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

  // Also forward TLDraw's built-in color style changes to the PDF viewer
  useEffect(() => {
    if (!editor) return
    let prev: any = null
    const timer = window.setInterval(() => {
      try {
        const next = (editor as any).getStyleForNextShapes?.('color')
        if (next && next !== prev) {
          prev = next
          const color = typeof next === 'string' ? next : String(next)
          window.dispatchEvent(new CustomEvent('pdf-set-color', { detail: { color } }))
        }
      } catch {}
    }, 250)
    return () => window.clearInterval(timer)
  }, [editor])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {/* We pass shape utils via cast to any, for environments where the prop is supported */}
      <Tldraw 
        onMount={handleMount}
      />
      {showPdfViewerState && (
        <SimplePdfViewer
          imageUrls={samplePdfImages}
          pdfUrl={currentPdfBase64 ? `data:application/pdf;base64,${currentPdfBase64}` : undefined}
          onClose={() => setShowPdfViewerState(false)}
        />
      )}
      {/* Bridge PDF tools to the global bottom toolbar when the viewer is open */}
      <PdfBottomBarBridge active={showPdfViewerState} editor={editor} />
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
