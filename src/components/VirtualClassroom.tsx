import React, { useState } from 'react'
import { TldrawEditor } from './TldrawEditor'
import { FileText, Upload, Plus } from 'lucide-react'

interface VirtualClassroomProps {
  initialPdfImages?: string[]
}

export const VirtualClassroom: React.FC<VirtualClassroomProps> = ({
  initialPdfImages = []
}) => {
  const [pdfImageSets, setPdfImageSets] = useState<string[][]>([initialPdfImages])
  const [currentPdfSet, setCurrentPdfSet] = useState(0)

  const handleAddPdfSet = (imageUrls: string[]) => {
    setPdfImageSets(prev => [...prev, imageUrls])
    setCurrentPdfSet(pdfImageSets.length)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // In a real implementation, you would convert PDF to images here
      // For now, we'll simulate this with placeholder URLs
      const mockImageUrls = Array.from(files).map((file) => 
        URL.createObjectURL(file) // This would be actual converted images in production
      )
      handleAddPdfSet(mockImageUrls)
    }
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Virtual Classroom Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#2563eb',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={24} />
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            Virtual Classroom - TLDraw PDF Viewer
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* PDF Upload */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            <Upload size={18} />
            <span style={{ fontSize: '14px' }}>Upload PDF</span>
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* PDF Set Selector */}
          {pdfImageSets.length > 1 && (
            <select
              value={currentPdfSet}
              onChange={(e) => setCurrentPdfSet(parseInt(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              {pdfImageSets.map((_, index) => (
                <option key={index} value={index} style={{ color: 'black' }}>
                  PDF Set {index + 1}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TLDraw Editor */}
      <div style={{ paddingTop: '60px', height: '100%' }}>
        <TldrawEditor 
          key={currentPdfSet} // Re-mount editor when PDF set changes
          samplePdfImages={pdfImageSets[currentPdfSet] || []}
        />
      </div>

      {/* Instructions Overlay (shows when no PDFs are loaded) */}
      {pdfImageSets[currentPdfSet]?.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            zIndex: 1001,
          }}
        >
          <FileText size={48} style={{ marginBottom: '16px', opacity: 0.7 }} />
          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>
            No PDF Loaded
          </h3>
          <p style={{ marginBottom: '16px', opacity: 0.9 }}>
            Upload a PDF file or use the sample PDF to get started with annotations.
          </p>
          <button
            onClick={() => {
              // Load sample PDF images
              const sampleImages = [
                '/sample-pdf/page-1.svg'
              ]
              setPdfImageSets([sampleImages])
              setCurrentPdfSet(0)
            }}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto',
            }}
          >
            <Plus size={16} />
            Load Sample PDF
          </button>
        </div>
      )}
    </div>
  )
}
