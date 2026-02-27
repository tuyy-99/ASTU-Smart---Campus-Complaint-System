const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new AppError('User no longer exists', 401));
      }

      if (!user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }

      // Enforce account status for all authenticated operations.
      // Admin and staff accounts should normally be 'Active'.
      if (user.accountStatus && user.accountStatus !== 'Active') {
        const message =
          user.accountStatus === 'PendingApproval'
            ? 'Account is pending approval'
            : user.accountStatus === 'Suspended'
              ? 'Account is suspended'
              : user.accountStatus === 'Rejected'
                ? 'Account has been rejected'
                : 'Account is not active';
        return next(new AppError(message, 401));
      }

      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Invalid or expired token', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};
