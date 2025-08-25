import { VirtualClassroom } from './components/VirtualClassroom'

// Sample PDF images - in a real app, these would come from a PDF conversion service
const samplePdfImages = [
  '/sample-pdf/page-1.svg'
]

function App() {
  return (
    <div className="App">
      <VirtualClassroom initialPdfImages={samplePdfImages} />
    </div>
  )
}

export default App
