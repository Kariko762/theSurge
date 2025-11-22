const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ensureDataDir } = require('./utils/fileHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/config', require('./routes/config'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/telemetry', require('./routes/telemetry'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize data directory and start server
async function startServer() {
  try {
    // Ensure data directory exists
    await ensureDataDir();
    console.log('✓ Data directory initialized');

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ============================================');
      console.log(`   THE SURGE - Backend API Server`);
      console.log('   ============================================');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server:      http://localhost:${PORT}`);
      console.log(`   Health:      http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('   API Endpoints:');
      console.log('   - POST   /api/auth/login');
      console.log('   - POST   /api/auth/logout');
      console.log('   - GET    /api/auth/session');
      console.log('   - GET    /api/users');
      console.log('   - GET    /api/events');
      console.log('   - GET    /api/config');
      console.log('   - GET    /api/missions');
      console.log('   - GET    /api/telemetry');
      console.log('   - POST   /api/telemetry/track');
      console.log('   ============================================');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
