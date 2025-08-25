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
    onEditorMount?.(mountedEditor)
  }, [onEditorMount])

  // Update PDF viewer visibility when props change
  useEffect(() => {
    setShowPdfViewerState(showPdfViewer && samplePdfImages.length > 0)
  }, [showPdfViewer, samplePdfImages])

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    if (editor) {
      editor.setStyleForNextShapes('color', color as any)
      editor.setStyleForSelectedShapes('color', color as any)
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
      editor.setCurrentTool(tldrawTool)
      
      // Set shape type for geo tool
      if (tool === 'rectangle') {
        editor.setStyleForNextShapes('geo', 'rectangle')
      } else if (tool === 'circle') {
        editor.setStyleForNextShapes('geo', 'ellipse')
      }
    }
  }

  const handleStrokeWidthChange = (width: number) => {
    setCurrentStrokeWidth(width)
    if (editor) {
      editor.setStyleForNextShapes('size', width > 8 ? 'xl' : width > 4 ? 'l' : width > 2 ? 'm' : 's')
      editor.setStyleForSelectedShapes('size', width > 8 ? 'xl' : width > 4 ? 'l' : width > 2 ? 'm' : 's')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
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
