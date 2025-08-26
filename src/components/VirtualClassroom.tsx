import React, { useState, useCallback, useRef, useEffect } from 'react'
import { TldrawEditor } from './TldrawEditor'
import { FileText, Upload, Plus, AlertCircle, CheckCircle, Loader, Palette, ChevronDown, FolderOpen, Save, Download, Eye, EyeOff } from 'lucide-react'
import { processUploadedFiles, isFileSupported } from '../utils/pdfProcessor'
import { processUploadedFilesWithFallbacks } from '../utils/pdfProcessorFallback'
import { Editor } from '@tldraw/tldraw'

interface VirtualClassroomProps {
  initialPdfImages?: string[]
}

export const VirtualClassroom: React.FC<VirtualClassroomProps> = ({
  initialPdfImages = []
}) => {
  // Fix: Initialize states properly to ensure synchronization
  const [pdfImageSets, setPdfImageSets] = useState<string[][]>(
    initialPdfImages.length > 0 ? [initialPdfImages] : []
  )
  const [pdfNames, setPdfNames] = useState<string[]>(
    initialPdfImages.length > 0 ? ['Sample PDF'] : []
  )
  const [currentPdfSet, setCurrentPdfSet] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [processingError, setProcessingError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showColorSidebar, setShowColorSidebar] = useState(false)
  const [showPdfDropdown, setShowPdfDropdown] = useState(false)
  const [pdfViewerVisible, setPdfViewerVisible] = useState(initialPdfImages.length > 0)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfDropdownRef = useRef<HTMLDivElement>(null)

  const handleAddPdfSet = (imageUrls: string[], fileName: string) => {
    const newIndex = pdfImageSets.length
    console.log('📥 handleAddPdfSet called:', {
      fileName,
      imageCount: imageUrls.length,
      newIndex,
      currentPdfSetsLength: pdfImageSets.length,
      currentPdfNamesLength: pdfNames.length
    })
    setPdfImageSets(prev => {
      const updated = [...prev, imageUrls]
      console.log('📊 Updated pdfImageSets:', updated.map((set, idx) => ({ index: idx, pages: set.length })))
      return updated
    })
    setPdfNames(prev => {
      const updated = [...prev, fileName]
      console.log('📂 Updated pdfNames:', updated)
      return updated
    })
    setCurrentPdfSet(newIndex)
    setPdfViewerVisible(true) // Always show PDF viewer when adding new PDF

    // Note: PdfViewer shape creation removed per request
  }

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setProcessingError('')
    
    // Enhanced progress reporting
    const totalFiles = files.length
    let currentFileIndex = 0

    try {
      setProcessingStatus(`Processing ${totalFiles} file(s)...`)
      
      // Try the main processor first
      let processedFiles
      try {
        console.log('🔄 Trying main PDF processor...')
        processedFiles = await processUploadedFiles(files)
      } catch (mainError) {
        console.warn('⚠️ Main PDF processor failed, trying fallback:', mainError)
        setProcessingStatus('Main processor failed, trying fallback method...')
        
        // If main processor fails, try the fallback
        try {
          console.log('🔄 Trying fallback PDF processor...')
          processedFiles = await processUploadedFilesWithFallbacks(files)
        } catch (fallbackError) {
          console.error('❌ Both processors failed:', fallbackError)
          throw new Error(`All processors failed. Main: ${mainError?.message || 'Unknown'}. Fallback: ${fallbackError?.message || 'Unknown'}`)
        }
      }
      
      if (processedFiles.length === 0) {
        setProcessingError('No supported files found. Please upload PDF or image files.')
        setProcessingStatus('') // Clear processing status
        return // Early return is fine since finally block will handle setIsProcessing(false)
      }

      // Add each processed file as a separate PDF set
      for (const processedFile of processedFiles) {
        currentFileIndex++
        
        if (processedFile.imageUrls.length > 0) {
          const statusMessage = processedFile.pageCount && processedFile.pageCount > 100 
            ? `Loaded ${processedFile.fileName} (${processedFile.imageUrls.length}/${processedFile.pageCount} pages processed)`
            : `Loaded ${processedFile.fileName} (${processedFile.imageUrls.length} pages)`
            
          setProcessingStatus(statusMessage)
          
          // If this is the first PDF and we don't have any existing ones, add as first PDF
          console.log('📄 PDF processing result:', {
            fileName: processedFile.fileName,
            imageCount: processedFile.imageUrls.length,
            currentPdfSetsLength: pdfImageSets.length,
            currentPdfNamesLength: pdfNames.length
          })
          
          if (pdfImageSets.length === 0 || (pdfImageSets.length === 1 && pdfImageSets[0].length === 0)) {
            console.log('✅ Adding as first PDF')
            setPdfImageSets([processedFile.imageUrls])
            setPdfNames([processedFile.fileName])
            setCurrentPdfSet(0)
            setPdfViewerVisible(true)

            // Note: PdfViewer shape creation removed per request
          } else {
            console.log('✅ Adding as additional PDF')
            handleAddPdfSet(processedFile.imageUrls, processedFile.fileName)
          }
          
          // Show success message longer for large PDFs
          const delay = processedFile.pageCount && processedFile.pageCount > 200 ? 1000 : 500
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Handle failed processing - clear processing status when showing error
          setProcessingStatus('')
          setProcessingError(`Failed to process: ${processedFile.fileName}`)
          console.warn(`Processing failed for file: ${processedFile.fileName}`, processedFile)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      const successfulFiles = processedFiles.filter(f => f.imageUrls.length > 0)
      if (successfulFiles.length > 0) {
        setProcessingStatus(`Successfully uploaded ${successfulFiles.length} file(s)!`)
        setTimeout(() => setProcessingStatus(''), 3000)
      }
    } catch (error: any) {
      setProcessingError(`Failed to process files: ${error?.message || 'Unknown error'}`)
      console.error('File upload error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      await processFiles(files)
      // Clear the input
      event.target.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide if leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Filter supported files
      const supportedFiles = Array.from(files).filter(isFileSupported)
      
      if (supportedFiles.length === 0) {
        setProcessingError('No supported files found. Please drop PDF or image files.')
        return
      }

      // Convert back to FileList-like object
      const fileList = {
        length: supportedFiles.length,
        item: (index: number) => supportedFiles[index] || null,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < supportedFiles.length; i++) {
            yield supportedFiles[i]
          }
        }
      } as FileList

      await processFiles(fileList)
    }
  }, [])

  // Close PDF dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target as Node)) {
        setShowPdfDropdown(false)
      }
    }

    if (showPdfDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showPdfDropdown])

  // Workspace save/load functions
  const saveWorkspace = async () => {
    try {
      if (!editorInstance) {
        setProcessingError('Editor not ready. Please wait and try again.')
        return
      }

      const snapshot = editorInstance.store.getSnapshot()
      const workspaceData = {
        snapshot,
        pdfImageSets,
        currentPdfSet,
        pdfNames,
        timestamp: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(workspaceData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tldraw-workspace-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setProcessingStatus('Workspace saved successfully!')
      setTimeout(() => setProcessingStatus(''), 2000)
    } catch (error: any) {
      setProcessingError(`Failed to save workspace: ${error?.message || 'Unknown error'}`)
    }
  }

  const loadWorkspace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const workspaceData = JSON.parse(e.target?.result as string)
        
        if (workspaceData.pdfImageSets) {
          setPdfImageSets(workspaceData.pdfImageSets)
          setCurrentPdfSet(workspaceData.currentPdfSet || 0)
          setPdfNames(workspaceData.pdfNames || [])
          setPdfViewerVisible(true)
        }
        
        if (workspaceData.snapshot && editorInstance) {
          editorInstance.store.loadSnapshot(workspaceData.snapshot)
        }
        
        setProcessingStatus('Workspace loaded successfully!')
        setTimeout(() => setProcessingStatus(''), 2000)
      } catch (error: any) {
        setProcessingError(`Failed to load workspace: ${error?.message || 'Unknown error'}`)
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Clear the input
  }

  const togglePdfViewer = () => {
    setPdfViewerVisible(!pdfViewerVisible)
  }

  return (
    <div 
      style={{ width: '100%', height: '100vh', position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
          zIndex: 100,
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
              background: isProcessing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {isProcessing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            <span style={{ fontSize: '14px' }}>
              {isProcessing ? 'Processing...' : 'Upload PDF'}
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileUpload}
              disabled={isProcessing}
              style={{ display: 'none' }}
            />
          </label>

          {/* Workspace Save/Load */}
          <button
            onClick={saveWorkspace}
            disabled={!editorInstance}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: editorInstance ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              opacity: editorInstance ? 1 : 0.5,
            }}
            title="Save Workspace"
          >
            <Save size={18} />
            Save
          </button>
          
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              color: 'white',
              fontSize: '14px',
            }}
            title="Load Workspace"
          >
            <Download size={18} />
            Load
            <input
              type="file"
              accept=".json"
              onChange={loadWorkspace}
              style={{ display: 'none' }}
            />
          </label>

          {/* PDF Viewer Toggle */}
          {pdfImageSets.some(set => set.length > 0) && (
            <button
              onClick={togglePdfViewer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                border: 'none',
                color: 'white',
                fontSize: '14px',
              }}
              title={pdfViewerVisible ? 'Hide PDF' : 'Show PDF'}
            >
              {pdfViewerVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              {pdfViewerVisible ? 'Hide' : 'Show'} PDF
            </button>
          )}

          {/* PDF Toggle Dropdown */}
          {pdfImageSets.some(set => set.length > 0) && (
            <div ref={pdfDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPdfDropdown(!showPdfDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                }}
                title="Switch between PDFs"
              >
                <FolderOpen size={18} />
                <span>PDFs ({pdfImageSets.filter(set => set.length > 0).length})</span>
                <ChevronDown size={16} style={{ transform: showPdfDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>
              
              {showPdfDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    minWidth: '250px',
                  }}
                >
                  {pdfImageSets.map((pdfSet, index) => {
                    if (pdfSet.length === 0) return null
                    const fileName = pdfNames[index] || `PDF ${index + 1}`
                    const isActive = currentPdfSet === index
                    
                    return (
                      <div
                        key={index}
                    onClick={() => {
                      setCurrentPdfSet(index)
                      setShowPdfDropdown(false)
                    }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#e3f2fd' : 'white',
                          borderBottom: index < pdfImageSets.length - 1 ? '1px solid #f0f0f0' : 'none',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'white'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ 
                            fontWeight: isActive ? '600' : '500', 
                            color: isActive ? '#2563eb' : '#333',
                            fontSize: '14px'
                          }}>
                            {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: isActive ? '#2563eb' : '#666'
                          }}>
                            {pdfSet.length} pages
                          </div>
                        </div>
                      </div>
                    )
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TLDraw Editor */}
      <div style={{ paddingTop: '60px', height: '100%' }}>
        <TldrawEditor 
          samplePdfImages={pdfViewerVisible ? (pdfImageSets[currentPdfSet] || []) : []}
          showColorSidebar={showColorSidebar}
          onEditorMount={setEditorInstance}
          showPdfViewer={pdfViewerVisible}
        />
      </div>

      {/* Processing Status Notification */}
      {(processingStatus || processingError) && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            backgroundColor: processingError ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 200,
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {processingError ? (
            <AlertCircle size={18} />
          ) : isProcessing ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          <span style={{ fontSize: '14px' }}>
            {processingError || processingStatus}
          </span>
          {processingError && (
            <button
              onClick={() => setProcessingError('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '2px',
                marginLeft: '8px',
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(37, 99, 235, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: 'white',
              padding: '40px',
              borderRadius: '16px',
              border: '3px dashed rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <Upload size={64} style={{ marginBottom: '16px', opacity: 0.9 }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>
              Drop PDF Files Here
            </h2>
            <p style={{ fontSize: '16px', opacity: 0.9 }}>
              Release to upload and process PDF files
            </p>
          </div>
        </div>
      )}

      {/* Instructions Overlay (shows when no PDFs are loaded) */}
      {(pdfImageSets.length === 0 || pdfImageSets[currentPdfSet]?.length === 0) && !isDragOver && (
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
            Upload a PDF file, drag & drop files here, or use the sample PDF to get started with annotations.
          </p>
          <button
          onClick={() => {
            // Load sample PDF images
            const sampleImages = [
              '/sample-pdf/page-1.svg'
            ]
            setPdfImageSets([sampleImages])
            setPdfNames(['Sample PDF'])
            setCurrentPdfSet(0)
            setPdfViewerVisible(true)

            // Note: PdfViewer shape creation removed per request
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
