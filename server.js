const express = require('express');
const path = require('path');
const app = express();

// Get port from Railway environment or default to 4173
const port = process.env.PORT || 4173;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router (serve index.html for all routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`TLDraw PDF Viewer running on port ${port}`);
  console.log(`Server: http://localhost:${port}`);
});
