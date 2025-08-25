const { spawn } = require('child_process');

// Get port from Railway environment or default to 3000
const port = process.env.PORT || 3000;

console.log(`🚀 Starting TLDraw PDF Viewer on port ${port}...`);

// Start the serve command
const serveProcess = spawn('npx', ['serve', '-s', 'dist', '-p', port.toString()], {
  stdio: 'inherit',
  shell: true
});

serveProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serveProcess.on('close', (code) => {
  console.log(`📛 Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  serveProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  serveProcess.kill('SIGTERM');
});
