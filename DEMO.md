# TLDraw PDF Viewer Demo

This document provides step-by-step instructions for demonstrating all features of the TLDraw PDF Viewer.

## 🎥 Demo Checklist

### Prerequisites
1. ✅ Project set up with all dependencies installed
2. ✅ Development server running (`npm run dev`)
3. ✅ Browser opened to `http://localhost:3000`

### Demo Steps

#### 1. Initial Load & Interface
- [ ] **Show Virtual Classroom interface** - Point out the header with "Virtual Classroom - TLDraw PDF Viewer"
- [ ] **Explain the empty state** - When no PDF is loaded, show the overlay with instructions
- [ ] **Load sample PDF** - Click "Load Sample PDF" button to demonstrate PDF loading

#### 2. PDF Viewer Shape Creation
- [ ] **Show PDF shape appears** - Demonstrate that the PDF viewer appears as a TLDraw shape
- [ ] **Point out the container** - Show that PDF pages are contained within a bordered container
- [ ] **Show sample PDF content** - Explain the sample document with features list and diagram area

#### 3. Toolbar Controls Demo
- [ ] **Hover to reveal toolbar** - Move mouse over PDF viewer to show toolbar appears
- [ ] **Maximize functionality** - Click maximize button (⤢) and show PDF fills screen
- [ ] **Restore functionality** - Click restore button (⊞) to return to original size
- [ ] **Minimize functionality** - Click minimize button (⤥) to collapse to title bar
- [ ] **Restore from minimize** - Click on minimized title bar to restore
- [ ] **Close functionality** - Click close button (✕) to remove PDF viewer

#### 4. Annotation Capabilities
- [ ] **Select drawing tool** - Use TLDraw's pen tool from the left toolbar
- [ ] **Draw on PDF** - Draw annotations directly on the PDF content
- [ ] **Use different tools** - Try highlighter, text, arrows, shapes
- [ ] **Show text annotations** - Add text annotations on top of PDF
- [ ] **Demonstrate shapes** - Add rectangles, circles, arrows pointing to content

#### 5. Multi-Page Navigation (if available)
- [ ] **Show page controls** - Point out page navigation in top-left corner
- [ ] **Navigate pages** - Use up/down arrows to move between pages
- [ ] **Show page counter** - Demonstrate "1/3" page indicator
- [ ] **Scroll navigation** - Show scrolling through pages in container

#### 6. Annotation Persistence
- [ ] **Add annotations** - Draw several annotations on the PDF
- [ ] **Maximize PDF** - Show annotations remain when maximizing
- [ ] **Restore size** - Show annotations are still intact when restoring
- [ ] **Minimize/restore** - Demonstrate annotations persist through minimize/restore cycle

#### 7. TLDraw Integration
- [ ] **Use TLDraw tools normally** - Show all TLDraw tools work as expected
- [ ] **Add shapes outside PDF** - Create shapes on the canvas outside PDF viewer
- [ ] **Select and move PDF viewer** - Show PDF viewer can be selected and moved like any shape
- [ ] **Resize PDF viewer** - Drag corners to resize (when not maximized)
- [ ] **Show zoom functionality** - Zoom in/out using TLDraw controls

#### 8. Upload Functionality (optional)
- [ ] **Click Upload PDF** - Use the upload button in header
- [ ] **Select image files** - Choose image files to simulate PDF pages
- [ ] **Show new PDF viewer** - Demonstrate new PDF viewer shape is created
- [ ] **Multiple PDF sets** - Show dropdown appears for switching between PDF sets

## 🎯 Key Demo Points to Emphasize

### ✨ Unique Features
1. **Seamless TLDraw Integration** - PDF viewer is a native TLDraw shape
2. **Full Annotation Support** - All drawing tools work on PDF content
3. **Professional Controls** - Maximize, minimize, close like desktop applications
4. **Persistent State** - Annotations survive all resize/minimize operations
5. **Multi-page Support** - Handle documents with multiple pages
6. **Modular Design** - Easy to integrate into existing applications

### 🔧 Technical Highlights
1. **Custom Shape API** - Follows TLDraw v2 shape conventions
2. **TypeScript Support** - Full type safety and IntelliSense
3. **Responsive Design** - Works on different screen sizes
4. **Performance** - Optimized for smooth annotation experience
5. **Virtual Classroom Ready** - Designed for educational use cases

## 🎬 Demo Script Example

> "Let me show you the TLDraw PDF Viewer in action. This is a custom component that brings PDF viewing capabilities directly into TLDraw with full annotation support.

> First, I'll load a sample PDF document... *clicks Load Sample PDF*

> Notice how the PDF appears as a native TLDraw shape with its own container. You can see we have a sample document with some text content and shapes for testing annotations.

> Now let me show you the controls. When I hover over the PDF viewer, you'll see a toolbar appears with maximize, minimize, and close buttons... *hovers to show toolbar*

> I can maximize this to full screen... *clicks maximize* ...and restore it back to the original size... *clicks restore*

> The real power is in the annotation capabilities. I can select any TLDraw tool and draw directly on the PDF content... *selects pen tool and draws*

> I can add text annotations... *adds text* ...shapes... *adds shapes* ...and arrows to point to specific content... *adds arrows*

> Watch what happens when I maximize the PDF with annotations... *maximizes* ...all the annotations stay perfectly positioned and scaled. Same when I restore... *restores* ...and even when I minimize and restore... *minimizes then restores*

> This makes it perfect for virtual classrooms, document review, collaborative editing, and any scenario where you need to annotate PDF content while maintaining the full power of TLDraw's drawing tools."

## 📱 Demo Tips

### Preparation
- Have sample PDF images ready
- Clear any existing shapes from canvas
- Ensure good lighting if recording
- Test all features beforehand

### During Demo
- Move mouse slowly to show interactions
- Pause after each major feature
- Explain what you're doing as you do it
- Show both successful and edge cases

### Common Issues to Avoid
- Don't rush through toolbar hover states
- Make sure annotations are visible (use contrasting colors)
- Test maximize/restore sequence beforehand
- Ensure sample PDF images are loading correctly

## 📺 Recording Setup

If creating a demo video:
1. **Screen Resolution**: 1920x1080 minimum
2. **Recording Area**: Full browser window
3. **Frame Rate**: 30fps minimum
4. **Audio**: Clear narration explaining each step
5. **Duration**: 3-5 minutes for full demo
6. **Editing**: Add callouts for important UI elements

## ✅ Demo Completion Checklist

After the demo, ensure you've shown:
- [x] PDF loading and display
- [x] All toolbar controls (maximize, minimize, restore, close)
- [x] Annotation tools working on PDF
- [x] Annotation persistence through state changes
- [x] Page navigation (if multi-page)
- [x] TLDraw integration and normal shape behavior
- [x] Upload functionality (optional)
- [x] Professional UI and user experience

This comprehensive demo should showcase all the capabilities of the TLDraw PDF Viewer and demonstrate its value for virtual classroom and annotation use cases.
