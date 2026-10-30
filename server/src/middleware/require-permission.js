export const requirePermission =
  (...codes) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const allowed = codes.every((code) => req.user.permissions.includes(code));
    if (!allowed) {
      return res.status(403).json({ message: "You do not have permission" });
    }
    next();
  };
