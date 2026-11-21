const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authorization = req.header('Authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : authorization;
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.user.userId || !req.user.role) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

module.exports = { verifyToken, requireRole };