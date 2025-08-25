import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
const pdfjsWorkerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
}

export interface ProcessedFile {
  type: 'pdf' | 'image'
  imageUrls: string[]
  fileName: string
  pageCount?: number
}

/**
 * Process uploaded files - convert PDFs to images or handle image files directly
 */
export async function processUploadedFiles(files: FileList): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = []
  
  for (const file of Array.from(files)) {
    try {
      if (file.type === 'application/pdf') {
        // Handle PDF files
        const pdfResult = await convertPdfToImages(file)
        results.push(pdfResult)
      } else if (file.type.startsWith('image/')) {
        // Handle image files directly
        const imageUrl = URL.createObjectURL(file)
        results.push({
          type: 'image',
          imageUrls: [imageUrl],
          fileName: file.name,
        })
      } else {
        console.warn(`Unsupported file type: ${file.type}`)
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error)
    }
  }
  
  return results
}

/**
 * Convert PDF file to array of image URLs using PDF.js
 */
export async function convertPdfToImages(file: File): Promise<ProcessedFile> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const imageUrls: string[] = []

    console.log(`Processing PDF: ${file.name} with ${pdf.numPages} pages`)

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        
        // Calculate scale to get good quality images
        const viewport = page.getViewport({ scale: 1.5 })
        
        // Create canvas for rendering
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        // Convert canvas to image URL
        const imageUrl = canvas.toDataURL('image/png', 0.9)
        imageUrls.push(imageUrl)
        
        console.log(`Processed page ${pageNum}/${pdf.numPages}`)
      } catch (pageError) {
        console.error(`Failed to process page ${pageNum}:`, pageError)
      }
    }

    return {
      type: 'pdf',
      imageUrls,
      fileName: file.name,
      pageCount: pdf.numPages,
    }
  } catch (error: any) {
    console.error('Failed to convert PDF to images:', error)
    throw new Error(`Failed to process PDF: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Validate if file is supported
 */
export function isFileSupported(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
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
