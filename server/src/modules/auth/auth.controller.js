import { SESSION_COOKIE_NAME } from "../../config/session.js";
import { authenticate } from "./auth.service.js";
 
export async function login(req, res, next) {
  try {
    const user = await authenticate(req.body.username, req.body.password);
    if (!user) {
      return res.status(401).json({ message: "Wrong username or password" });
    }
 
    // New session id on every login (prevents session fixation)
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.save((err2) => {
        if (err2) return next(err2);
        res.json(user);
      });
    });
  } catch (e) {
    next(e);
  }
}
 
export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ ok: true });
  });
}
 
export function me(req, res) {
  res.json(req.user);
}
