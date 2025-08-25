const express = require('express');
const path = require('path');
const app = express();

// Railway automatically sets PORT environment variable
const port = process.env.PORT || 3000;

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: false
}));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle React Router (serve index.html for all routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TLDraw PDF Viewer is running!`);
  console.log(`📍 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Server ready at: http://localhost:${port}`);
});
