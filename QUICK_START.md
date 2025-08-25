# Quick Start Guide - TLDraw PDF Viewer

## 🎯 Current Status

The application is now working with a **simplified PDF viewer** that overlays on top of the TLDraw canvas. This approach avoids the custom shape registration issues and provides a functional demo.

## 🚀 How to Run

1. **Navigate to project directory:**
   ```bash
   cd "D:\NEw project\tldraw-pdf-viewer"
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser to:** `http://localhost:3000`

## ✅ What Works Now

### ✨ **PDF Viewer Features**
- ✅ **Floating PDF viewer** window that overlays on TLDraw canvas
- ✅ **Draggable window** with title bar (drag to move around)
- ✅ **Maximize/Restore** functionality 
- ✅ **Minimize/Restore** functionality
- ✅ **Close** button to hide PDF viewer
- ✅ **Page navigation** for multi-page documents
- ✅ **Sample PDF** loading with "Load Sample PDF" button

### ✨ **TLDraw Integration**
- ✅ **Full TLDraw editor** with all native tools working
- ✅ **PDF viewer floats above** TLDraw canvas
- ✅ **Annotations work** on the TLDraw canvas below PDF
- ✅ **No conflicts** between PDF viewer and TLDraw

### ✨ **Virtual Classroom UI**
- ✅ **Header bar** with upload controls
- ✅ **File upload** functionality (simulated)
- ✅ **Instructions overlay** when no PDF is loaded
- ✅ **Professional styling** and responsive design

## 🎮 How to Test

### Step 1: Load Sample PDF
1. When you first open the app, you'll see "No PDF Loaded" overlay
2. Click **"Load Sample PDF"** button
3. A floating PDF viewer window will appear

### Step 2: Test Window Controls
1. **Drag the window** by clicking and dragging the blue title bar
2. **Maximize** - Click the maximize button (⤢) to fill the screen
3. **Restore** - Click the restore button (⊞) to return to original size
4. **Minimize** - Click minimize button (⤥) to collapse to title bar
5. **Close** - Click X button to close the PDF viewer

### Step 3: Test TLDraw Integration
1. Use TLDraw tools from the left sidebar (pen, shapes, text, etc.)
2. Draw on the canvas around/behind the PDF viewer
3. The PDF viewer floats above but doesn't interfere with annotations

### Step 4: Test File Upload (Optional)
1. Click **"Upload PDF"** in the top header
2. Select image files (simulates PDF conversion)
3. New PDF viewer will appear with uploaded images

## 🔄 Next Steps (Future Development)

### Phase 1: Custom Shape Integration ✋ **PAUSED DUE TO API ISSUES**
- The original plan was to create a custom TLDraw shape
- Currently blocked by TLDraw v2 API registration issues
- Will revisit when TLDraw API stabilizes

### Phase 2: Annotation Overlay 🎯 **NEXT PRIORITY**
- Add transparent annotation layer over PDF content
- Allow direct drawing on PDF pages
- Sync annotations with TLDraw state

### Phase 3: Enhanced Features 🚀 **PLANNED**
- PDF to image conversion integration
- Real file upload processing  
- Persistence and save/load functionality
- Collaboration features

## 🐛 Known Limitations

1. **Annotations don't overlay PDF directly** - Currently annotations are on the canvas behind/around the PDF viewer
2. **No PDF conversion** - Uses sample SVG files instead of real PDF processing
3. **No persistence** - State resets on page refresh
4. **Single window only** - Can't have multiple PDF viewers open simultaneously

## 🎯 Recommended Demo Flow

1. **Show initial state** - Point out clean TLDraw interface
2. **Load sample PDF** - Demonstrate PDF viewer appearing
3. **Test all controls** - Show maximize, minimize, drag, close
4. **Use TLDraw tools** - Draw shapes and annotations on canvas
5. **Show integration** - Demonstrate how PDF and TLDraw work together
6. **Upload simulation** - Test file upload functionality

## 💡 Technical Notes

- **SimplePdfViewer.tsx** - Standalone floating window component
- **TldrawEditor.tsx** - Basic TLDraw editor with PDF overlay
- **VirtualClassroom.tsx** - Main container with header and controls
- **No custom shapes** - Avoids TLDraw API registration issues
- **Pure React state** - All window management in component state

This version provides a solid foundation and working demo while we work on resolving the TLDraw custom shape API issues!
