import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { ensureRules } from "../rules/rule-bootstrap.js";
const toDate = (v) => (v ? new Date(v + "T00:00:00.000Z") : null);
const toDay = (d) => (d ? d.toISOString().slice(0, 10) : null);
// CT + Evening -> CT-E, which matches roll numbers such as CT-E-14
const defaultPrefix = (program, timing) =>
  (program.code + "-" + timing.timing.charAt(0)).toUpperCase();
function toDto(s, counts = {}) {
  return {
    id: s.id,
    name: s.name,
    year: s.year,
    status: s.status,
    startDate: toDay(s.startDate),
    endDate: toDay(s.endDate),
    applications: counts.applications ?? 0,
    options: counts.options ?? 0,
  };
}
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
export async function listSessions() {
  const [sessions, apps, opts] = await Promise.all([
    prisma.admissionSession.findMany({ orderBy: { year: "desc" } }),
    prisma.application.groupBy({ by: ["sessionId"], _count: { _all: true } }),
    prisma.sessionProgram.groupBy({
      by: ["sessionId"],
      _count: { _all: true },
    }),
  ]);
  const appsBy = new Map(apps.map((a) => [a.sessionId, a._count._all]));
  const optsBy = new Map(opts.map((o) => [o.sessionId, o._count._all]));
  return sessions.map((s) =>
    toDto(s, { applications: appsBy.get(s.id), options: optsBy.get(s.id) }),
  );
}
export async function createSession(data, actor, ip) {
  try {
    return await prisma.$transaction(async (tx) => {
      const sourceId = data.copyFromSessionId ?? null;
      if (sourceId) await getSession(tx, sourceId);
      const created = await tx.admissionSession.create({
        data: {
          name: data.name,
          year: data.year,
          status: "DRAFT",
          startDate: toDate(data.startDate),
          endDate: toDate(data.endDate),
        },
      });
      let copiedOptions = 0;
      if (sourceId) {
        const options = await tx.sessionProgram.findMany({
          where: { sessionId: sourceId },
        });
        if (options.length) {
          await tx.sessionProgram.createMany({
            data: options.map((o) => ({
              sessionId: created.id,
              programTimingId: o.programTimingId,
              seats: o.seats,
              rollPrefix: o.rollPrefix,
            })),
          });
        }
        copiedOptions = options.length;
      }
      await ensureRules(tx, created.id, {
        actorId: actor.id,
        copyFromSessionId: sourceId,
      });
      await logAudit(tx, {
        userId: actor.id,
        action: "session.create",
        entityType: "session",
        entityId: created.id,
        description: "created session " + created.year,
        metadata: { copiedFrom: sourceId, copiedOptions },
        ipAddress: ip,
      });
      return toDto(created, { options: copiedOptions });
    });
  } catch (e) {
    if (e?.code === "P2002")
      throw new HttpError(
        409,
        "A session for " + data.year + " already exists",
      );
    throw e;
  }
}
export async function updateSession(id, data, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const session = await getSession(tx, id);
    if (session.status === "CLOSED")
      throw new HttpError(409, "A closed session cannot be edited");
    const updated = await tx.admissionSession.update({
      where: { id },
      data: {
        name: data.name,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
      },
    });
    await logAudit(tx, {
      userId: actor.id,
      action: "session.update",
      entityType: "session",
      entityId: id,
      description: "updated session " + updated.year,
      ipAddress: ip,
    });
    return toDto(updated);
  });
}
export async function setSessionStatus(id, status, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const target = await getSession(tx, id);
    if (target.status === status) return toDto(target);
    let closedOthers = 0;
    if (status === "ACTIVE") {
      const result = await tx.admissionSession.updateMany({
        where: { status: "ACTIVE", id: { not: id } },
        data: { status: "CLOSED" },
      });
      closedOthers = result.count;
    }
    const updated = await tx.admissionSession.update({
      where: { id },
      data: {
        status,
      },
    });
    await logAudit(tx, {
      userId: actor.id,
      action: status === "ACTIVE" ? "session.activate" : "session.close",
      entityType: "session",
      entityId: id,
      description:
        (status === "ACTIVE" ? "made session " : "closed session ") +
        updated.year +
        (status === "ACTIVE" ? " active" : ""),
      metadata: { closedOthers },
      ipAddress: ip,
    });
    return toDto(updated);
  });
}
// All program-timings that can be opened, with this session's seats and prefix.
async function buildOptions(db, session) {
  const [programs, timings, open, appCounts] = await Promise.all([
    db.program.findMany(),
    db.programTiming.findMany(),
    db.sessionProgram.findMany({ where: { sessionId: session.id } }),
    db.application.groupBy({
      by: ["programTimingId"],
      where: { sessionId: session.id },
      _count: { _all: true },
    }),
  ]);
  const programById = new Map(programs.map((p) => [p.id, p]));
  const openBy = new Map(open.map((o) => [o.programTimingId, o]));
  const appsBy = new Map(
    appCounts.map((a) => [a.programTimingId, a._count._all]),
  );
  const options = timings
    .map((t) => ({ t, p: programById.get(t.programId) }))
    // show active ones, plus anything already open here even if deactivated later
    .filter(({ t, p }) => p && ((t.isActive && p.isActive) || openBy.has(t.id)))
    .map(({ t, p }) => {
      const o = openBy.get(t.id);
      return {
        programTimingId: t.id,
        programCode: p.code,
        programName: p.name,
        timing: t.timing,
        isOpen: Boolean(o),
        seats: o?.seats ?? null,
        rollPrefix: o?.rollPrefix ?? null,
        defaultPrefix: defaultPrefix(p, t),
        applications: appsBy.get(t.id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.programCode.localeCompare(b.programCode) ||
        a.timing.localeCompare(b.timing),
    );
  return {
    session: {
      id: session.id,
      name: session.name,
      year: session.year,
      status: session.status,
    },
    readOnly: session.status === "CLOSED",
    options,
  };
}
export async function getOptions(sessionId) {
  return buildOptions(prisma, await getSession(prisma, sessionId));
}
export async function saveOptions(sessionId, input, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const session = await getSession(tx, sessionId);
    if (session.status === "CLOSED") {
      throw new HttpError(
        409,
        "This session is closed, so its options are read-only",
      );
    }
    const wanted = input.options;
    const ids = wanted.map((o) => o.programTimingId);
    if (new Set(ids).size !== ids.length)
      throw new HttpError(400, "A program timing is listed twice");
    const [timings, current, appCounts] = await Promise.all([
      tx.programTiming.findMany({ where: { id: { in: ids } } }),
      tx.sessionProgram.findMany({ where: { sessionId } }),
      tx.application.groupBy({
        by: ["programTimingId"],
        where: { sessionId },
        _count: { _all: true },
      }),
    ]);
    if (timings.length !== ids.length)
      throw new HttpError(400, "One or more program timings do not exist");
    const programs = await tx.program.findMany({
      where: { id: { in: timings.map((t) => t.programId) } },
    });
    const timingBy = new Map(timings.map((t) => [t.id, t]));
    const programBy = new Map(programs.map((p) => [p.id, p]));
    const currentBy = new Map(current.map((o) => [o.programTimingId, o]));
    const appsBy = new Map(
      appCounts.map((a) => [a.programTimingId, a._count._all]),
    );
    const rows = wanted.map((o) => {
      const t = timingBy.get(o.programTimingId);
      return {
        programTimingId: o.programTimingId,
        seats: o.seats,
        rollPrefix:
          o.rollPrefix || defaultPrefix(programBy.get(t.programId), t),
      };
    });
    const prefixes = rows.map((r) => r.rollPrefix);
    if (new Set(prefixes).size !== prefixes.length) {
      throw new HttpError(
        400,
        "Each open option needs a different roll prefix",
      );
    }
    const removed = current.filter((o) => !ids.includes(o.programTimingId));
    for (const o of removed) {
      const n = appsBy.get(o.programTimingId) ?? 0;
      if (n > 0)
        throw new HttpError(
          409,
          "Cannot close an option that already has " + n + " applications",
        );
    }
    const added = rows.filter((r) => !currentBy.has(r.programTimingId));
    for (const r of added) {
      const t = timingBy.get(r.programTimingId);
      if (!t.isActive || !programBy.get(t.programId).isActive) {
        throw new HttpError(400, "An inactive program timing cannot be opened");
      }
    }
    const changed = rows.filter((r) => {
      const old = currentBy.get(r.programTimingId);
      return old && (old.seats !== r.seats || old.rollPrefix !== r.rollPrefix);
    });
    for (const r of changed) {
      const old = currentBy.get(r.programTimingId);
      if (
        old.rollPrefix !== r.rollPrefix &&
        (appsBy.get(r.programTimingId) ?? 0) > 0
      ) {
        throw new HttpError(
          409,
          "Roll prefix cannot change after applications are imported",
        );
      }
    }
    if (removed.length) {
      await tx.sessionProgram.deleteMany({
        where: { id: { in: removed.map((o) => o.id) } },
      });
    }
    for (const r of changed) {
      await tx.sessionProgram.update({
        where: { id: currentBy.get(r.programTimingId).id },
        data: { seats: r.seats, rollPrefix: r.rollPrefix },
      });
    }
    if (added.length) {
      await tx.sessionProgram.createMany({
        data: added.map((r) => ({ sessionId, ...r })),
      });
    }
    if (added.length || removed.length || changed.length) {
      await logAudit(tx, {
        userId: actor.id,
        action: "session.options",
        entityType: "session",
        entityId: sessionId,
        description: "updated open programs of session " + session.year,
        metadata: {
          added: added.length,
          removed: removed.length,
          changed: changed.length,
        },
        ipAddress: ip,
      });
    }
    return buildOptions(tx, session);
  });
}
