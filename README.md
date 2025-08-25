# TLDraw PDF Viewer

A custom PDF Viewer component for TLDraw v2 with full annotation support, maximize/minimize controls, and modular design for integration into virtual classroom applications.

## 🚀 Features

- **Custom TLDraw Shape**: `PdfViewerShape` that integrates seamlessly with TLDraw v2
- **Multi-page Support**: Display multiple PDF pages in a scrollable container
- **Full Annotation Support**: All TLDraw tools work on top of PDF pages
- **Window Controls**: Maximize, minimize, restore, and close functionality
- **Persistent Annotations**: Annotations remain stable during resize/minimize operations
- **Modular Design**: Easy integration into existing React/TLDraw applications
- **TypeScript Support**: Full type safety with TypeScript
- **Virtual Classroom Ready**: Designed for educational applications

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Basic knowledge of React and TypeScript
- Familiarity with TLDraw v2 (helpful but not required)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd tldraw-pdf-viewer
npm install
```

### 2. Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── PdfViewerComponent.tsx    # Main PDF viewer with controls
│   ├── TldrawEditor.tsx          # TLDraw editor with custom shapes
│   └── VirtualClassroom.tsx      # Integration demo component
├── shapes/
│   └── PdfViewerShape.tsx        # Custom TLDraw shape definition
├── App.tsx                       # Main application component
├── main.tsx                      # Application entry point
└── index.css                     # Global styles

public/
└── sample-pdf/
    └── page-1.svg               # Sample PDF page for demo
```

## 🎯 Usage

### Basic Usage

```tsx
import { TldrawEditor } from './components/TldrawEditor'

const pdfImages = [
  'path/to/pdf-page-1.png',
  'path/to/pdf-page-2.png',
  'path/to/pdf-page-3.png'
]

function App() {
  return <TldrawEditor samplePdfImages={pdfImages} />
}
```

### Integration with Virtual Classroom

```tsx
import { VirtualClassroom } from './components/VirtualClassroom'

const pdfPages = [
  'https://example.com/document/page-1.png',
  'https://example.com/document/page-2.png'
]

function ClassroomApp() {
  return <VirtualClassroom initialPdfImages={pdfPages} />
}
```

## 🔧 Custom Shape API

The `PdfViewerShape` follows TLDraw's custom shape API:

```typescript
export type PdfViewerShape = TLBaseShape<
  'pdf-viewer',
  {
    w: number              // Width
    h: number              // Height  
    color: TLDefaultColorStyle
    imageUrls: string[]    // Array of PDF page image URLs
    isMaximized: boolean   // Maximized state
    isMinimized: boolean   // Minimized state
    originalBounds?: {     // Stored bounds for restore
      w: number
      h: number
      x: number
      y: number
    }
  }
>
```

### Creating PDF Viewer Shapes Programmatically

```typescript
const shape: PdfViewerShape = {
  id: 'pdf-viewer-1',
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
    imageUrls: ['page1.png', 'page2.png'],
    isMaximized: false,
    isMinimized: false,
  }
}

editor.createShape(shape)
```

## 🎮 Controls & Features

### Toolbar Controls

- **Maximize** (⤢): Expands PDF viewer to fill viewport
- **Restore** (⊞): Returns to original size and position
- **Minimize** (⤥): Collapses to title bar only
- **Close** (✕): Removes PDF viewer from canvas

### Page Navigation

- **Previous/Next**: Navigate between PDF pages
- **Page Counter**: Shows current page (e.g., "2/5")
- **Scroll Navigation**: Scroll through pages in container

### Annotation Features

- **Drawing Tools**: Pen, highlighter, shapes work on PDF
- **Text Annotations**: Add text anywhere on PDF pages
- **Sticky Notes**: Place notes and comments
- **Arrows & Lines**: Point to specific content
- **Persistent State**: Annotations stay when resizing/minimizing

## 🔌 Integration Guide

### Step 1: Add to Existing TLDraw App

```typescript
// Import the shape utility
import { PdfViewerShapeUtil } from './shapes/PdfViewerShape'
import { defaultShapeUtils } from '@tldraw/tldraw'

// Add to your shape utils
const customShapeUtils = [PdfViewerShapeUtil]
const shapeUtils = [...defaultShapeUtils, ...customShapeUtils]

// Use in your TLDraw store
const store = createTLStore({ shapeUtils })
```

### Step 2: Register Shape in Editor

```typescript
<Tldraw
  store={store}
  shapeUtils={shapeUtils}
  onMount={(editor) => {
    // Shape is now available for creation
  }}
/>
```

### Step 3: Add PDF Upload Functionality

```typescript
const handlePdfUpload = async (file: File) => {
  // Convert PDF to images (use pdf2pic, PDF.js, etc.)
  const imageUrls = await convertPdfToImages(file)
  
  // Create PDF viewer shape
  const shape: PdfViewerShape = {
    // ... shape configuration
    props: {
      imageUrls,
      // ... other props
    }
  }
  
  editor.createShape(shape)
}
```

## 🛠️ PDF Processing

This component expects PDF pages as image URLs. You'll need to convert PDFs to images using:

### Server-side Options
- **pdf2pic** (Node.js)
- **ImageMagick** with policy modifications
- **Poppler utilities** (pdftoppm)
- **Cloud services** (Cloudinary, AWS, etc.)

### Client-side Options
- **PDF.js** for basic rendering
- **react-pdf** with canvas conversion

### Example PDF Conversion

```typescript
import pdf2pic from 'pdf2pic'

async function convertPdfToImages(pdfPath: string): Promise<string[]> {
  const convert = pdf2pic.fromPath(pdfPath, {
    density: 100,
    saveFilename: "page",
    savePath: "./images/",
    format: "png",
    width: 800,
    height: 1000
  })
  
  const results = await convert.bulk(-1)
  return results.map(r => r.path)
}
```

## 🎨 Customization

### Styling

Customize the PDF viewer appearance in `PdfViewerComponent.tsx`:

```typescript
// Toolbar styling
const toolbarStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '6px',
  // ... your styles
}

// Page container styling  
const pageContainerStyle = {
  backgroundColor: '#f5f5f5',
  // ... your styles
}
```

### Behavior Modification

Extend the shape utility class:

```typescript
export class CustomPdfViewerShapeUtil extends PdfViewerShapeUtil {
  // Override methods for custom behavior
  override onResize = (shape, info) => {
    // Custom resize logic
    return super.onResize(shape, info)
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **PDF Images Not Loading**
   - Check image URLs are accessible
   - Verify CORS headers for external images
   - Ensure proper image formats (PNG, JPG, SVG)

2. **Annotations Not Working**
   - Check `pointerEvents: 'none'` on images
   - Verify TLDraw tools are enabled
   - Ensure shape is not locked

3. **Performance Issues**
   - Optimize image sizes (recommended: 800px width)
   - Use lazy loading for multiple pages
   - Consider image compression

### Debug Mode

Enable TLDraw debug mode:

```typescript
<Tldraw
  store={store}
  shapeUtils={shapeUtils}
  options={{ debugFlags: { debugGeometry: true } }}
/>
```

## 📝 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TLDraw](https://tldraw.dev) for the amazing drawing library
- [React](https://react.dev) and [TypeScript](https://typescriptlang.org)
- [Vite](https://vitejs.dev) for the build system
- [Lucide React](https://lucide.dev) for icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#🐛-troubleshooting)
2. Search existing [GitHub issues](https://github.com/yourusername/tldraw-pdf-viewer/issues)  
3. Create a new issue with detailed reproduction steps

---

**Built with ❤️ for the TLDraw community**
