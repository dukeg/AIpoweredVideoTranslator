require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const transcribeRouter = require('./routes/transcribe');
const translateRouter = require('./routes/translate');
const renderRouter = require('./routes/render');
const jobsRouter = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload/output dirs exist
fs.ensureDirSync(path.join(__dirname, '../public/uploads'));
fs.ensureDirSync(path.join(__dirname, '../public/outputs'));
fs.ensureDirSync(path.join(__dirname, '../public/temp'));

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../public/temp'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/outputs', express.static(path.join(__dirname, '../public/outputs')));

// API Routes
app.use('/api/transcribe', transcribeRouter);
app.use('/api/translate', translateRouter);
app.use('/api/render', renderRouter);
app.use('/api/jobs', jobsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      whisper: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      ffmpeg: true
    }
  });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`\n🎬 VideoTranslate AI Server`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Whisper API: ${process.env.OPENAI_API_KEY ? '✓' : '✗ missing OPENAI_API_KEY'}`);
  console.log(`   Claude API:  ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗ missing ANTHROPIC_API_KEY'}\n`);
});

module.exports = app;
