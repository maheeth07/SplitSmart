const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simulate-delay', 'x-simulate-failure', 'x-simulate-empty']
}));

// Body parser
app.use(express.json());

// Logger middleware (simple console reporting)
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl} - Headers: ${JSON.stringify(req.headers['x-simulate-delay'] ? { 'x-simulate-delay': req.headers['x-simulate-delay'] } : {})}`);
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Expense Splitter Express API is operational and healthy',
    timestamp: new Date(),
  });
});

// Route not found fallback
app.use((req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Custom error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Backend Server] Express engine initialized and running on port ${PORT}`);
});

// Unhandled Promise Rejections catcher
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Rejection] Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
