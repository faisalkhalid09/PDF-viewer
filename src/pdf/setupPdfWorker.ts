// Ensure pdf.js worker is properly configured for react-pdf v10 with Vite
// This file is imported for its side effects.
import { pdfjs } from 'react-pdf'
// Vite will turn this into an asset URL
// Note: pdfjs-dist@5 ships the worker as .mjs
// The `?url` suffix makes Vite return the final URL string
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc as unknown as string

