import React, { useState } from 'react'
import { Tldraw } from '@tldraw/tldraw'
import { SimplePdfViewer } from './SimplePdfViewer'
import '@tldraw/tldraw/tldraw.css'

interface TldrawEditorProps {
  samplePdfImages?: string[]
}

export const TldrawEditor: React.FC<TldrawEditorProps> = ({ 
  samplePdfImages = [] 
}) => {
  const [showPdfViewer, setShowPdfViewer] = useState(samplePdfImages.length > 0)

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
      {showPdfViewer && (
        <SimplePdfViewer
          imageUrls={samplePdfImages}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  )
}
