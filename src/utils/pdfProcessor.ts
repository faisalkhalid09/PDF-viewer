// PDF processing using react-pdf with proper worker configuration
// Configure PDF.js worker so documents load reliably in dev and prod

// Import the PDF rendering function from react-pdf
import { pdfjs } from 'react-pdf'
// Configure worker from the same pdfjs-dist version that react-pdf uses
// Recommended by react-pdf: https://github.com/wojtekmaj/react-pdf
console.log('🚀 Initializing PDF.js worker configuration...')

try {
  // Compute worker URL using the module resolver so it matches pdfjs.version
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  // Some builds expose workerPort; keep it null unless explicitly provided
  if ('workerPort' in pdfjs.GlobalWorkerOptions) {
    // @ts-ignore - workerPort may not exist on all builds
    pdfjs.GlobalWorkerOptions.workerPort = null
  }

  console.log('✅ PDF.js worker configured', { workerSrc, pdfjsVersion: (pdfjs as any).version })
} catch (workerError) {
  console.warn('⚠️ Failed to configure PDF.js worker. PDFs may not load:', workerError)
}

export interface ProcessedFile {
  type: 'pdf' | 'image'
  imageUrls: string[]
  fileName: string
  pageCount?: number
  pdfUrl?: string // Blob URL to the original PDF so we can render selectable text
}

/**
 * Process uploaded files - convert PDFs to images or handle image files directly
 */
export async function processUploadedFiles(files: FileList): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = []
  
  for (const file of Array.from(files)) {
    try {
      // Enhanced file type detection - check extension and magic bytes
      const isPdfFile = await isPdfFileDetailed(file)
      const isOffice = /\.(docx?|pptx?)$/i.test(file.name)
      
      if (isPdfFile) {
        // Handle PDF files with retry logic
        console.log(`Processing PDF file: ${file.name} (${file.type || 'unknown MIME type'}, size: ${file.size} bytes)`)
        
        // Prepare a Blob URL for the original PDF so we can render it natively/selectable
        const pdfBlobUrl = URL.createObjectURL(file)
        ;(window as any).__lastUploadedPdfUrl = pdfBlobUrl
        
        // Check if this looks like a Microsoft Edge PDF
        const isLikelyEdgePdf = file.type === '' || file.type === 'application/octet-stream' || 
                               file.name.includes('(Complete)') || 
                               (file.type === 'application/pdf' && file.size > 0)
        
        if (isLikelyEdgePdf) {
          console.log(`Detected potential Microsoft Edge PDF: ${file.name}`)
        }
        
        const pdfResult = await convertPdfToImagesWithRetry(file)
        // Attach the source PDF URL
        pdfResult.pdfUrl = pdfBlobUrl
        results.push(pdfResult)
      } else if (isOffice) {
        // Mock pipeline: assume DOCX/PPTX were pre-converted to images elsewhere.
        console.log(`Mock-converting Office file to images: ${file.name}`)
        const mockImages = await convertOfficeToImagesMock(file)
        results.push({
          type: 'pdf',
          imageUrls: mockImages,
          fileName: file.name.replace(/\.(docx?|pptx?)$/i, '.pdf'),
          pageCount: mockImages.length
        })
      } else if (file.type.startsWith('image/')) {
        // Handle image files directly
        const imageUrl = URL.createObjectURL(file)
        results.push({
          type: 'image',
          imageUrls: [imageUrl],
          fileName: file.name,
        })
      } else {
        console.warn(`Unsupported file: ${file.name} (type: ${file.type || 'unknown'}, size: ${file.size} bytes)`)
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error)
      console.error('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      })
      
      // Add more detailed error information
      let errorDetails = 'Unknown error'
      if (error instanceof Error) {
        errorDetails = error.message
        console.error('Error stack:', error.stack)
      }
      
      // Add the error to results so user knows what failed
      results.push({
        type: 'pdf',
        imageUrls: [],
        fileName: file.name + ` (Failed: ${errorDetails})`,
        pageCount: 0
      })
    }
  }
  
  return results
}

/**
 * Enhanced PDF file detection using both MIME type and magic bytes
 */
async function isPdfFileDetailed(file: File): Promise<boolean> {
  // Check MIME type first
  if (file.type === 'application/pdf') {
    return true
  }
  
  // Check file extension for Edge PDFs that might not have correct MIME type
  if (file.name.toLowerCase().endsWith('.pdf')) {
    console.log(`File ${file.name} has .pdf extension but MIME type is: ${file.type || 'unknown'}`)
    
    // Check magic bytes (PDF files start with %PDF-)
    try {
      const buffer = await file.slice(0, 8).arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const header = String.fromCharCode(...bytes)
      
      if (header.startsWith('%PDF-')) {
        console.log(`Confirmed PDF by magic bytes: ${header.substring(0, 8)}`)
        return true
      } else {
        console.warn(`File ${file.name} has .pdf extension but invalid PDF header: ${header}`)
      }
    } catch (error) {
      console.error('Error checking PDF magic bytes:', error)
    }
  }
  
return false
}

/**
 * Mock converter for Office documents. In this project we assume the files are
 * pre-converted externally and we just receive a set of page images.
 * To keep the demo working, we return the sample svg as a single-page image.
 */
async function convertOfficeToImagesMock(file: File): Promise<string[]> {
  console.log('Using mock Office → images conversion for:', file.name)
  // You can expand this to infer multiple pages or different sample assets.
  return ['/sample-pdf/page-1.svg']
}

/**
 * Convert PDF file to images with retry logic for problematic PDFs
 */
async function convertPdfToImagesWithRetry(file: File, maxRetries: number = 2): Promise<ProcessedFile> {
  let lastError: any = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${file.name}`)
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      return await convertPdfToImages(file)
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt + 1} failed for ${file.name}:`, error)
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
  
  throw lastError
}

/**
 * Convert PDF file to array of image URLs using react-pdf approach
 */
export async function convertPdfToImages(file: File): Promise<ProcessedFile> {
  console.log(`🔄 Processing PDF: ${file.name} using react-pdf approach`)
  
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Load the PDF document using pdfjs from react-pdf
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      // Use conservative settings for maximum compatibility
      verbosity: pdfjs.VerbosityLevel.ERRORS,
      disableStream: true,
      disableAutoFetch: true,
      disableRange: false
    })
    
    const pdf = await loadingTask.promise
    console.log(`✅ Successfully loaded PDF: ${file.name} with ${pdf.numPages} pages`)
    
    const imageUrls: string[] = []
    const processedPages: (string | null)[] = []
    
    // Dynamic batch size based on PDF size for performance
    let batchSize = pdf.numPages <= 10 ? pdf.numPages : Math.min(5, pdf.numPages)
    
    console.log(`📄 Processing ${pdf.numPages} pages in batches of ${batchSize}...`)
    
    // Process pages in batches
    for (let i = 0; i < pdf.numPages; i += batchSize) {
      const endIndex = Math.min(i + batchSize, pdf.numPages)
      const batchPromises: Promise<string | null>[] = []
      
      // Process batch of pages
      for (let pageNum = i + 1; pageNum <= endIndex; pageNum++) {
        batchPromises.push(renderPdfPage(pdf, pageNum))
      }
      
      const batchResults = await Promise.all(batchPromises)
      processedPages.push(...batchResults)
      
      // Progress reporting
      const processed = Math.min(i + batchSize, pdf.numPages)
      const percentage = Math.round((processed / pdf.numPages) * 100)
      console.log(`⏳ Processed ${processed}/${pdf.numPages} pages (${percentage}%)`)
      
      // Small delay between batches for large PDFs
      if (pdf.numPages > 20 && i + batchSize < pdf.numPages) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    // Filter successful pages
    const successfulImages = processedPages.filter((url): url is string => url !== null)
    
    if (successfulImages.length === 0) {
      throw new Error('Failed to process any pages from the PDF')
    }
    
    if (successfulImages.length < pdf.numPages) {
      console.warn(`⚠️ Successfully processed ${successfulImages.length}/${pdf.numPages} pages`)
    }
    
    console.log(`🎉 PDF processing complete: ${successfulImages.length} pages converted`)
    
    // Map the first image URL back to the source PDF URL for components that only receive images
    try {
      const first = successfulImages[0]
      const srcUrl = (window as any).__lastUploadedPdfUrl
      if (first && srcUrl) {
        (window as any).__pdfUrlByFirstImageUrl = {
          ...(window as any).__pdfUrlByFirstImageUrl,
          [first]: srcUrl
        }
      }
    } catch {}

    return {
      type: 'pdf',
      imageUrls: successfulImages,
      fileName: file.name,
      pageCount: pdf.numPages,
      pdfUrl: (window as any).__lastUploadedPdfUrl || undefined,
    }
    
  } catch (error: any) {
    console.error('❌ Failed to convert PDF to images:', error)
    
    // Enhanced error messages
    let errorMessage = 'Failed to process PDF'
    
    if (error.name === 'PasswordException') {
      errorMessage = 'PDF is password-protected'
    } else if (error.name === 'InvalidPDFException') {
      errorMessage = 'PDF file is corrupted or invalid'
    } else if (error.name === 'MissingPDFException') {
      errorMessage = 'PDF file is missing or empty'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    throw new Error(`${errorMessage}: ${file.name}`)
  }
}

/**
 * Render a single PDF page to canvas and return as image URL
 */
async function renderPdfPage(pdf: any, pageNum: number): Promise<string | null> {
  let page: any = null
  let canvas: HTMLCanvasElement | null = null

  // Helper: ensure an image URL decodes successfully
  const ensureImageDecodes = async (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = (e) => reject(new Error('Image decode failed'))
      img.decoding = 'sync' as any
      img.src = url
    })
  }

  try {
    // Get the page
    page = await pdf.getPage(pageNum)

    // Calculate optimal scale for rendering
    const baseViewport = page.getViewport({ scale: 1 })
    const maxWidth = 1600 // Good balance of quality vs performance
    const scale = Math.min(1.5, maxWidth / baseViewport.width)

    const viewport = page.getViewport({ scale })

    console.log(`🖼️ Rendering page ${pageNum}: baseSize=${Math.round(baseViewport.width)}x${Math.round(baseViewport.height)}, scale=${scale.toFixed(2)}, target=${Math.round(viewport.width)}x${Math.round(viewport.height)}`)

    // Create canvas
    canvas = document.createElement('canvas')
    // Use default 2d context to avoid GPU/driver white-screen issues on some systems
    const context = canvas.getContext('2d')!

    canvas.height = viewport.height
    canvas.width = viewport.width

    // Set white background
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'display'
    }

    await page.render(renderContext).promise

    // Prefer data URLs first so saved workspaces have serializable image URLs
    const attempts: Array<{ kind: 'blob' | 'data'; format: 'image/jpeg' | 'image/png'; quality?: number }> = [
      { kind: 'data', format: 'image/jpeg', quality: 0.85 },
      { kind: 'data', format: 'image/png' },
      { kind: 'blob', format: 'image/jpeg', quality: 0.85 },
      { kind: 'blob', format: 'image/png' },
    ]

    for (const attempt of attempts) {
      try {
        let url: string
        if (attempt.kind === 'blob' && 'toBlob' in canvas) {
          url = await new Promise<string>((resolve, reject) => {
            canvas!.toBlob((blob) => {
              if (!blob) {
                reject(new Error('toBlob returned null blob'))
                return
              }
              const objectUrl = URL.createObjectURL(blob)
              resolve(objectUrl)
            }, attempt.format, attempt.quality)
          })
        } else if (attempt.kind === 'data') {
          url = canvas!.toDataURL(attempt.format, attempt.quality)
        } else {
          // If toBlob isn't supported, skip to data URL attempt
          continue
        }

        const decoded = await ensureImageDecodes(url)
        console.log(`✅ Page ${pageNum} encoded as ${attempt.kind}:${attempt.format} (${decoded.width}x${decoded.height})`)
        return url
      } catch (encodeErr) {
        console.warn(`↩️ Fallback for page ${pageNum} after failed ${attempt.kind}:${attempt.format}`, encodeErr)
        // Revoke failed blob URL if any
        // Note: We cannot easily detect blob vs data URL string here without tracking, but safe to try
        try {
          if (attempt.kind === 'blob') {
            // Only revoke if this was a blob URL; data URLs should not be revoked
            // We don't have the url here if ensureImageDecodes failed after creation above unless we store it
            // So instead, we will safely ignore revoke here; the GC will reclaim on page refresh.
          }
        } catch {}
        continue
      }
    }

    console.error(`❌ All encoding strategies failed for page ${pageNum}`)
    return null

  } catch (pageError: any) {
    console.error(`❌ Failed to render page ${pageNum}:`, pageError)
    return null
  } finally {
    // Cleanup
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
      canvas = null
    }

    if (page && typeof page.cleanup === 'function') {
      try {
        page.cleanup()
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Validate if file is supported (enhanced version)
 */
export async function isFileSupportedAsync(file: File): Promise<boolean> {
  const isPdf = await isPdfFileDetailed(file)
  return isPdf || file.type.startsWith('image/')
}

/**
 * Validate if file is supported (synchronous fallback)
 */
export function isFileSupported(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf') ||
    /\.(docx?|pptx?)$/i.test(file.name) ||
    file.type.startsWith('image/')
  )
}

/**
 * Get file type display name
 */
export function getFileTypeDisplayName(file: File): string {
  if (file.type === 'application/pdf') {
    return 'PDF Document'
  } else if (file.type.startsWith('image/')) {
    return 'Image File'
  } else {
    return 'Unknown File'
  }
}
