import argon2 from "argon2";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
 
const ADMIN_ROLE = "Admin";
const userInclude = { userRoles: { include: { role: true } } };
 
function toDto(u) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.userRoles
      .map((ur) => ({ id: ur.role.id, name: ur.role.name }))
      .sort((a, b) => a.id - b.id),
  };
}
 
const isAdminUser = (u) => u.userRoles.some((ur) => ur.role.name === ADMIN_ROLE);
 
async function loadRoles(db, roleIds) {
  const ids = [...new Set(roleIds)];
  const roles = await db.role.findMany({ where: { id: { in: ids } } });
  if (roles.length !== ids.length) {
    throw new HttpError(400, "One or more selected roles do not exist");
  }
  return roles;
}
 
async function assertAnotherActiveAdmin(db, excludeUserId) {
  const count = await db.user.count({
    where: {
      id: { not: excludeUserId },
      isActive: true,
      userRoles: { some: { role: { name: ADMIN_ROLE } } },
    },
  });
  if (count === 0) {
    throw new HttpError(400, "At least one active Admin must remain");
  }
}
 
async function assertUnique(db, { username, email, excludeId }) {
  if (username) {
    const found = await db.user.findUnique({ where: { username } });
    if (found && found.id !== excludeId) {
      throw new HttpError(409, "Username is already taken");
    }
  }
  if (email) {
    const found = await db.user.findUnique({ where: { email } });
    if (found && found.id !== excludeId) {
      throw new HttpError(409, "Email is already in use");
    }
  }
}
 
// Two requests at the same time can still hit the database unique rule.
function mapUniqueError(e) {
  if (e?.code === "P2002") {
    return new HttpError(409, "Username or email already exists");
  }
  return e;
}
 
export async function listUsers() {
  const users = await prisma.user.findMany({
    include: userInclude,
    orderBy: { username: "asc" },
  });
  return users.map(toDto);
}
 
export async function listRoles() {
  return prisma.role.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, description: true },
  });
}
 
export async function createUser(data, actor, ip) {
  const passwordHash = await argon2.hash(data.password);
  const email = data.email || null;
  const roleIds = [...new Set(data.roleIds)];
 
  try {
    return await prisma.$transaction(async (tx) => {
      const roles = await loadRoles(tx, roleIds);
      await assertUnique(tx, { username: data.username, email });
 
      const created = await tx.user.create({
        data: {
          username: data.username,
          fullName: data.fullName,
          email,
          passwordHash,
          userRoles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
        include: userInclude,
      });
 
      await logAudit(tx, {
        userId: actor.id,
        action: "user.create",
        entityType: "user",
        entityId: created.id,
        description: "created user " + created.username,
        metadata: { roles: roles.map((r) => r.name) },
        ipAddress: ip,
      });
 
      return toDto(created);
    });
  } catch (e) {
    throw mapUniqueError(e);
  }
}
 
export async function updateUser(id, data, actor, ip) {
  const passwordHash = data.password ? await argon2.hash(data.password) : null;
  const email = data.email || null;
  const roleIds = [...new Set(data.roleIds)];
 
  try {
    return await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        include: userInclude,
      });
      if (!target) throw new HttpError(404, "User not found");
 
      const roles = await loadRoles(tx, roleIds);
      await assertUnique(tx, { email, excludeId: id });
 
      const wasActiveAdmin = target.isActive && isAdminUser(target);
      const willBeAdmin = roles.some((r) => r.name === ADMIN_ROLE);
      if (wasActiveAdmin && !willBeAdmin) {
        if (id === actor.id) {
          throw new HttpError(400, "You cannot remove your own Admin role");
        }
        await assertAnotherActiveAdmin(tx, id);
      }
 
      await tx.userRole.deleteMany({ where: { userId: id } });
      const updated = await tx.user.update({
        where: { id },
        data: {
          fullName: data.fullName,
          email,
          ...(passwordHash ? { passwordHash } : {}),
          userRoles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
        include: userInclude,
      });
 
      await logAudit(tx, {
        userId: actor.id,
        action: "user.update",
        entityType: "user",
        entityId: id,
        description: "updated user " + updated.username,
        metadata: {
          roles: roles.map((r) => r.name),
          passwordChanged: Boolean(passwordHash),
        },
        ipAddress: ip,
      });
 
      return toDto(updated);
    });
  } catch (e) {
    throw mapUniqueError(e);
  }
}
 
export async function setUserActive(id, isActive, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id },
      include: userInclude,
    });
    if (!target) throw new HttpError(404, "User not found");
 
    if (!isActive && id === actor.id) {
      throw new HttpError(400, "You cannot disable your own account");
    }
    if (!isActive && target.isActive && isAdminUser(target)) {
      await assertAnotherActiveAdmin(tx, id);
    }
 
    const updated = await tx.user.update({
      where: { id },
      data: { isActive },
      include: userInclude,
    });
 
    await logAudit(tx, {
      userId: actor.id,
      action: isActive ? "user.enable" : "user.disable",
      entityType: "user",
      entityId: id,
      description: (isActive ? "enabled" : "disabled") + " user " + updated.username,
      ipAddress: ip,
    });
 
    return toDto(updated);
  });
}
