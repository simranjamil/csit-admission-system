import argon2 from "argon2";
import { prisma } from "../../config/database.js";
 
// Used when the username does not exist, so response time stays the same.
const DUMMY_HASH = await argon2.hash("not-a-real-password");
 
const userInclude = {
  userRoles: {
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
    },
  },
};
 
function toUserContext(u) {
  const roles = u.userRoles.map((ur) => ur.role).sort((a, b) => a.id - b.id);
  const permissions = [
    ...new Set(
      roles.flatMap((r) => r.rolePermissions.map((rp) => rp.permission.code))
    ),
  ];
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    isActive: u.isActive,
    roles: roles.map((r) => r.name),
    permissions,
    redirectTo: roles.find((r) => r.homePath !== "/")?.homePath ?? "/",
  };
}
 
export async function getUserContext(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
  return user ? toUserContext(user) : null;
}
 
export async function authenticate(username, password) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: userInclude,
  });
 
  const passwordOk = await argon2.verify(
    user?.passwordHash ?? DUMMY_HASH,
    password
  );
  if (!user || !user.isActive || !passwordOk) return null;
 
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return toUserContext(user);
}

