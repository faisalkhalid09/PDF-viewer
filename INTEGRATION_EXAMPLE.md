# Integration Example

This document shows how to integrate the TLDraw PDF Viewer into your existing React/TLDraw application.

## Quick Integration

### 1. Copy Required Files

Copy these files to your project:
- `src/shapes/PdfViewerShape.tsx`
- `src/components/PdfViewerComponent.tsx`

### 2. Install Dependencies

```bash
npm install @tldraw/tldraw lucide-react
```

### 3. Add Shape to Your TLDraw Editor

```tsx
import { Tldraw, createTLStore, defaultShapeUtils } from '@tldraw/tldraw'
import { PdfViewerShapeUtil } from './shapes/PdfViewerShape'

const customShapeUtils = [PdfViewerShapeUtil]
const shapeUtils = [...defaultShapeUtils, ...customShapeUtils]
const store = createTLStore({ shapeUtils })

export function MyTldrawEditor() {
  return (
    <Tldraw
      store={store}
      shapeUtils={shapeUtils}
      onMount={(editor) => {
        // PDF viewer shape is now available
        console.log('PDF viewer shape registered!')
      }}
    />
  )
}
```

### 4. Create PDF Viewer Shapes

```tsx
import { PdfViewerShape } from './shapes/PdfViewerShape'

function addPdfViewer(editor: Editor, imageUrls: string[]) {
  const shape: PdfViewerShape = {
    id: `pdf-viewer-${Date.now()}`,
    type: 'pdf-viewer',
    x: 100,
    y: 100,
    rotation: 0,
    index: 'a1',
    parentId: 'page:page',
    isLocked: false,
    opacity: 1,
    meta: {},
    props: {
      w: 600,
      h: 400,
      color: 'black',
      imageUrls,
      isMaximized: false,
      isMinimized: false,
    }
  }

  editor.createShape(shape)
  editor.zoomToFit()
}
```

## Advanced Integration with File Upload

```tsx
import React, { useRef } from 'react'
import { Editor } from '@tldraw/tldraw'
import { convertPdfToImages } from './utils/pdfConverter'

export function PdfUploader({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Convert PDF to images (implement this based on your needs)
      const imageUrls = await convertPdfToImages(file)
      
      // Create PDF viewer shape
      const shape: PdfViewerShape = {
        id: `pdf-viewer-${Date.now()}`,
        type: 'pdf-viewer',
        x: 100,
        y: 100,
        rotation: 0,
        index: 'a1',
        parentId: 'page:page',
        isLocked: false,
        opacity: 1,
        meta: {},
        props: {
          w: 600,
          h: 400,
          color: 'black',
          imageUrls,
          isMaximized: false,
          isMinimized: false,
        }
      }

      editor.createShape(shape)
      editor.zoomToFit()
    } catch (error) {
      console.error('Failed to upload PDF:', error)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Upload PDF
      </button>
    </div>
  )
}
```

## PDF Conversion Utilities

### Client-side with PDF.js

```tsx
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export async function convertPdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const imageUrls: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    imageUrls.push(canvas.toDataURL())
  }

  return imageUrls
}
```

### Server-side with pdf2pic (Node.js)

```typescript
import pdf2pic from 'pdf2pic'
import path from 'path'

export async function convertPdfToImages(pdfPath: string): Promise<string[]> {
  const outputDir = path.join(process.cwd(), 'uploads', 'pdf-images')
  
  const convert = pdf2pic.fromPath(pdfPath, {
    density: 100,
    saveFilename: "page",
    savePath: outputDir,
    format: "png",
    width: 800,
    height: 1000
  })

  const results = await convert.bulk(-1, { responseType: "image" })
  return results.map(result => `/uploads/pdf-images/${result.name}`)
}
```

## Customizing the PDF Viewer

### Custom Toolbar

```tsx
// Extend the PdfViewerComponent to add custom buttons
import { PdfViewerComponent } from './components/PdfViewerComponent'

const CustomPdfViewerComponent = (props) => {
  const handleCustomAction = () => {
    // Your custom action
    console.log('Custom action triggered!')
  }

  return (
    <div style={{ position: 'relative' }}>
      <PdfViewerComponent {...props} />
      
      {/* Custom toolbar overlay */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '6px',
        padding: '4px'
      }}>
        <button
          onClick={handleCustomAction}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            padding: '6px',
            cursor: 'pointer'
          }}
        >
          Custom
        </button>
      </div>
    </div>
  )
}
```

### Custom Shape Properties

```tsx
// Extend the shape with custom properties
export type CustomPdfViewerShape = TLBaseShape<
  'custom-pdf-viewer',
  PdfViewerShape['props'] & {
    allowAnnotations: boolean
    theme: 'light' | 'dark'
    customData?: Record<string, any>
  }
>

export class CustomPdfViewerShapeUtil extends BaseBoxShapeUtil<CustomPdfViewerShape> {
  static override type = 'custom-pdf-viewer' as const
  
  // Override default props
  getDefaultProps(): CustomPdfViewerShape['props'] {
    return {
      ...super.getDefaultProps(),
      allowAnnotations: true,
      theme: 'light'
    }
  }

  // Custom component with theme support
  component(shape: CustomPdfViewerShape) {
    const { theme, allowAnnotations } = shape.props
    
    return (
      <HTMLContainer
        style={{
          backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white',
          pointerEvents: allowAnnotations ? 'all' : 'none'
        }}
      >
        <PdfViewerComponent {...this.getComponentProps(shape)} />
      </HTMLContainer>
    )
  }
}
```

## Event Handling

```tsx
export function TldrawWithPdfHandling() {
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleMount = (editor: Editor) => {
    setEditor(editor)

    // Listen for PDF viewer shape changes
    editor.sideEffects.registerBeforeChangeHandler('shape', (prev, next) => {
      if (next.type === 'pdf-viewer') {
        console.log('PDF viewer shape changed:', prev, next)
        
        // Custom handling for state changes
        if (next.props.isMaximized !== prev?.props.isMaximized) {
          console.log('PDF viewer maximization changed')
        }
      }
      
      return next
    })
  }

  return (
    <Tldraw
      store={store}
      shapeUtils={shapeUtils}
      onMount={handleMount}
    />
  )
}
```

## TypeScript Setup

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

## Styling Integration

Add to your global CSS:

```css
/* PDF viewer specific styles */
.pdf-toolbar-button:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.pdf-scroll::-webkit-scrollbar {
  width: 8px;
}

.pdf-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

/* Ensure TLDraw annotations work over PDF */
.pdf-page img {
  pointer-events: none;
}
```

This integration example should help you add the PDF viewer to your existing TLDraw application!
