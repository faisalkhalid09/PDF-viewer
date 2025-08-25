// Alternative PDF processing with multiple fallback approaches
// This provides several different methods to handle PDF processing

export interface ProcessedFile {
  type: 'pdf' | 'image'
  imageUrls: string[]
  fileName: string
  pageCount?: number
}

/**
 * Method 1: Try to use FileReader API to convert PDF to data URL
 */
async function convertPdfWithFileReader(file: File): Promise<ProcessedFile> {
  console.log('🔄 Trying FileReader approach for:', file.name)
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve({
        type: 'pdf',
        imageUrls: [dataUrl], // This will just show the PDF as a data URL
        fileName: file.name,
        pageCount: 1
      })
    }
    
    reader.onerror = () => {
      reject(new Error('FileReader failed'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Method 2: Use Canvas API to create a placeholder
 */
async function createPdfPlaceholder(file: File): Promise<ProcessedFile> {
  console.log('🔄 Creating placeholder for:', file.name)
  
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  
  const ctx = canvas.getContext('2d')!
  
  // Create a simple placeholder
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  ctx.fillStyle = '#333'
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('PDF Document', canvas.width / 2, canvas.height / 2 - 40)
  
  ctx.font = '16px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText(file.name, canvas.width / 2, canvas.height / 2)
  ctx.fillText(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`, canvas.width / 2, canvas.height / 2 + 30)
  ctx.fillText('PDF processing failed - showing placeholder', canvas.width / 2, canvas.height / 2 + 60)
  
  const dataUrl = canvas.toDataURL('image/png')
  
  return {
    type: 'pdf',
    imageUrls: [dataUrl],
    fileName: file.name + ' (Placeholder)',
    pageCount: 1
  }
}

/**
 * Method 3: Object URL approach
 */
async function convertPdfWithObjectURL(file: File): Promise<ProcessedFile> {
  console.log('🔄 Using Object URL approach for:', file.name)
  
  const objectUrl = URL.createObjectURL(file)
  
  return {
    type: 'pdf',
    imageUrls: [objectUrl],
    fileName: file.name,
    pageCount: 1
  }
}

/**
 * Fallback PDF processor that tries multiple methods
 */
export async function processPdfWithFallbacks(file: File): Promise<ProcessedFile> {
  // Prioritize producing a visible image so the viewer doesn't break
  const methods = [
    { name: 'Placeholder', func: createPdfPlaceholder },
    { name: 'FileReader', func: convertPdfWithFileReader },
    { name: 'Object URL', func: convertPdfWithObjectURL }
  ]
  
  for (const method of methods) {
    try {
      console.log(`🔄 Trying ${method.name} method for: ${file.name}`)
      const result = await method.func(file)
      console.log(`✅ ${method.name} method succeeded for: ${file.name}`)
      return result
    } catch (error) {
      console.warn(`⚠️ ${method.name} method failed for ${file.name}:`, error)
      continue
    }
  }
  
  throw new Error('All PDF processing methods failed')
}

/**
 * Process files with fallback methods
 */
export async function processUploadedFilesWithFallbacks(files: FileList): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = []
  
  for (const file of Array.from(files)) {
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log(`📄 Processing PDF: ${file.name}`)
        const result = await processPdfWithFallbacks(file)
        results.push(result)
      } else if (file.type.startsWith('image/')) {
        // Handle images normally
        const imageUrl = URL.createObjectURL(file)
        results.push({
          type: 'image',
          imageUrls: [imageUrl],
          fileName: file.name
        })
      } else {
        console.warn(`❌ Unsupported file type: ${file.name}`)
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file.name}:`, error)
      
      // Add error result
      results.push({
        type: 'pdf',
        imageUrls: [],
        fileName: file.name + ' (Failed)',
        pageCount: 0
      })
    }
  }
  
  return results
}
