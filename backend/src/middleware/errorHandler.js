const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console for development
  console.error(`[Error Middleware] Code: ${err.statusCode || 500} - Message: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered. A resource with these details already exists.';
    error = { message, statusCode: 400 };
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token. Please log in again.', statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    error = { message: 'Your session has expired. Please log in again.', statusCode: 401 };
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const responseMessage = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    error: responseMessage,
    // Include stack trace only if explicitly in development and not standard
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
