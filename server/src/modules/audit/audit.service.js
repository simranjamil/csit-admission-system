export function logAudit(
  db,
  { userId, action, entityType, entityId, description, metadata, ipAddress }
) {
  return db.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      description,
      metadata: metadata ?? undefined,
      ipAddress: ipAddress ?? null,
    },
  });
}
