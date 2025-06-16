export default function requireRole(role) {
  return function (req, res, next) {
    // Assuming user is set in req.user from JWT middleware
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  }
}