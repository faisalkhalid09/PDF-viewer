import React from 'react'
import { VirtualClassroom } from './components/VirtualClassroom'

// Sample PDF images - in a real app, these would come from a PDF conversion service
const samplePdfImages: string[] = [
  // Empty array - user will upload their own PDFs
]

function App() {
  console.log('🚀 TLDraw PDF Viewer App starting...')
  
  return (
    <div className="App">
      <VirtualClassroom initialPdfImages={samplePdfImages} />
    </div>
  )
}

export default App
