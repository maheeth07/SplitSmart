const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforexpensesplitterapplicationjwt12345!');

      // Get user from database (exclude password field)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        const error = new Error('Not authorized to access this route. User not found.');
        error.statusCode = 401;
        return next(error);
      }

      next();
    } catch (error) {
      error.statusCode = 401;
      return next(error);
    }
  }

  if (!token) {
    const error = new Error('Not authorized to access this route. No token provided.');
    error.statusCode = 401;
    return next(error);
  }
};

module.exports = { protect };
