import { SESSION_COOKIE_NAME } from "../config/session.js";
import { getUserContext } from "../modules/auth/auth.service.js";
 
export async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
 
    const user = await getUserContext(userId);
    if (!user || !user.isActive) {
      return req.session.destroy(() => {
        res.clearCookie(SESSION_COOKIE_NAME);
        res.status(401).json({ message: "Not authenticated" });
      });
    }
 
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
