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

// Alias for authorize with same functionality
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

// Check if user account is active (isActive flag)
exports.checkIsActive = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.isActive) {
    return next(new AppError('User account is deactivated', 403));
  }

  next();
};

// Check account status (PendingApproval, Active, Suspended, Rejected)
exports.checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.accountStatus || req.user.accountStatus !== 'Active') {
    const statusMessages = {
      PendingApproval: 'Account is pending approval',
      Suspended: 'Account is suspended',
      Rejected: 'Account has been rejected'
    };

    const message = statusMessages[req.user.accountStatus] || 'Account is not active';
    return next(new AppError(message, 403));
  }

  next();
};

// Combined middleware: check both isActive and accountStatus
exports.requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Check isActive flag
  if (!req.user.isActive) {
    return next(new AppError('User account is deactivated', 403));
  }

  // Check accountStatus
  if (!req.user.accountStatus || req.user.accountStatus !== 'Active') {
    const statusMessages = {
      PendingApproval: 'Account is pending approval',
      Suspended: 'Account is suspended',
      Rejected: 'Account has been rejected'
    };

    const message = statusMessages[req.user.accountStatus] || 'Account is not active';
    return next(new AppError(message, 403));
  }

  next();
};

// Prevent access for suspended or rejected accounts
exports.preventInactiveAccess = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const blockedStatuses = ['Suspended', 'Rejected'];
  
  if (blockedStatuses.includes(req.user.accountStatus)) {
    return next(
      new AppError(
        `Access denied. Account status: ${req.user.accountStatus}`,
        403
      )
    );
  }

  if (!req.user.isActive) {
    return next(new AppError('Access denied. Account is deactivated', 403));
  }

  next();
};

// Restrict to admin only
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin privileges required', 403));
  }

  next();
};

// Restrict to staff only
exports.staffOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'staff') {
    return next(new AppError('Access denied. Staff privileges required', 403));
  }

  next();
};

// Restrict to student only
exports.studentOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'student') {
    return next(new AppError('Access denied. Student privileges required', 403));
  }

  next();
};

// Allow admin or staff
exports.adminOrStaff = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!['admin', 'staff'].includes(req.user.role)) {
    return next(new AppError('Access denied. Admin or Staff privileges required', 403));
  }

  next();
};

// Check if user owns the resource (for student accessing their own data)
exports.checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return next(new AppError('Resource owner information missing', 400));
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return next(new AppError('Access denied. You can only access your own resources', 403));
    }

    next();
  };
};
