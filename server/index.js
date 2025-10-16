const express = require('express');
const cors = require('cors');
require('dotenv').config();

const predictRoute = require('./routes/predictONNX'); // Updated to use ONNX version
const extractRoute = require('./routes/extract');
// LLM explanation service removed

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Cardia API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/predict', predictRoute);
app.use('/extract', extractRoute);
// /explain route removed as DeepSeek dependency is dropped

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🩺 Welcome to Cardia API',
    description: 'Heart Health Prediction API - Phase 2 with OCR & ONNX',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      predict: 'POST /predict',
      extract: 'POST /extract',
  // explain: 'POST /explain' // removed
    },
    documentation: 'https://github.com/your-repo/cardia',
    disclaimer: 'This API is for educational purposes only and should not replace professional medical advice.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /predict',
      'POST /extract',
  // 'POST /explain'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong!',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🩺 Cardia API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
⏰ Started at: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available endpoints:
• GET  /           - API information
• GET  /health     - Health check
• POST /predict    - Heart risk prediction (ONNX model)
• POST /extract    - Extract parameters from medical reports (OCR)

Ready to receive predictions! 🚀
  `);
});

module.exports = app;