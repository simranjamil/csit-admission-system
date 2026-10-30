import session from "express-session";
import { prisma } from "./database.js";
import { env } from "./env.js";
 
export const SESSION_COOKIE_NAME = "csit.sid";
const MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours
 
function expiryOf(sess) {
  return sess?.cookie?.expires
    ? new Date(sess.cookie.expires)
    : new Date(Date.now() + MAX_AGE);
}
 
class PrismaSessionStore extends session.Store {
  get(sid, cb) {
    prisma.session
      .findUnique({ where: { sid } })
      .then((row) => {
        if (!row || row.expiresAt < new Date()) return cb(null, null);
        cb(null, JSON.parse(row.data));
      })
      .catch(cb);
  }
 
  set(sid, sess, cb) {
    const data = JSON.stringify(sess);
    const expiresAt = expiryOf(sess);
    prisma.session
      .upsert({
        where: { sid },
        update: { data, expiresAt },
        create: { sid, data, expiresAt },
      })
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
 
  touch(sid, sess, cb) {
    prisma.session
      .updateMany({ where: { sid }, data: { expiresAt: expiryOf(sess) } })
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
 
  destroy(sid, cb) {
    prisma.session
      .deleteMany({ where: { sid } })
      .then(() => cb?.())
      .catch((e) => cb?.(e));
  }
}
 
export const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: env.SESSION_SECRET,
  store: new PrismaSessionStore(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  },
});
