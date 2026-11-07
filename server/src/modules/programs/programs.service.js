import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
// " weekend " -> "Weekend"
function cleanTiming(s) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}
function uniqueTimings(list) {
  const seen = new Map();
  for (const raw of list) {
    const t = cleanTiming(raw);
    seen.set(t.toLowerCase(), t);
  }
  return [...seen.values()];
}
function toDto(program, timings) {
  return {
    id: program.id,
    code: program.code,
    name: program.name,
    isActive: program.isActive,
    timings: timings
      .filter((t) => t.programId === program.id)
      .sort((a, b) => a.id - b.id)
      .map((t) => ({ id: t.id, timing: t.timing, isActive: t.isActive })),
  };
}
async function loadOne(db, id) {
  const [program, timings] = await Promise.all([
    db.program.findUnique({ where: { id } }),
    db.programTiming.findMany({ where: { programId: id } }),
  ]);
  return toDto(program, timings);
}
export async function listPrograms() {
  const [programs, timings] = await Promise.all([
    prisma.program.findMany({ orderBy: { code: "asc" } }),
    prisma.programTiming.findMany(),
  ]);
  return programs.map((p) => toDto(p, timings));
}
export async function createProgram(data, actor, ip) {
  try {
    return await prisma.$transaction(async (tx) => {
      const exists = await tx.program.findFirst({ where: { code: data.code } });
      if (exists)
        throw new HttpError(
          409,
          "Program code " + data.code + " already exists",
        );
      const created = await tx.program.create({
        data: { code: data.code, name: data.name, isActive: true },
      });
      await tx.programTiming.createMany({
        data: uniqueTimings(data.timings).map((timing) => ({
          programId: created.id,
          timing,
          isActive: true,
        })),
      });
      await logAudit(tx, {
        userId: actor.id,
        action: "program.create",
        entityType: "program",
        entityId: created.id,
        description: "created program " + created.code,
        ipAddress: ip,
      });
      return loadOne(tx, created.id);
    });
  } catch (e) {
    if (e?.code === "P2002")
      throw new HttpError(409, "Program code already exists");
    throw e;
  }
}
export async function updateProgram(id, data, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const program = await tx.program.findUnique({ where: { id } });
    if (!program) throw new HttpError(404, "Program not found");
    const wanted = uniqueTimings(data.timings);
    const wantedKeys = new Set(wanted.map((t) => t.toLowerCase()));
    const existing = await tx.programTiming.findMany({
      where: { programId: id },
    });
    const existingBy = new Map(
      existing.map((t) => [t.timing.toLowerCase(), t]),
    );
    for (const timing of wanted) {
      const old = existingBy.get(timing.toLowerCase());
      if (!old) {
        await tx.programTiming.create({
          data: { programId: id, timing, isActive: true },
        });
      } else if (!old.isActive) {
        await tx.programTiming.update({
          where: { id: old.id },
          data: {
            isActive: true,
          },
        });
      }
    }
    for (const old of existing) {
      if (old.isActive && !wantedKeys.has(old.timing.toLowerCase())) {
        await tx.programTiming.update({
          where: { id: old.id },
          data: {
            isActive: false,
          },
        });
      }
    }
    await tx.program.update({
      where: { id },
      data: { name: data.name, isActive: data.isActive },
    });
    await logAudit(tx, {
      userId: actor.id,
      action: "program.update",
      entityType: "program",
      entityId: id,
      description: "updated program " + program.code,
      metadata: { timings: wanted, isActive: data.isActive },
      ipAddress: ip,
    });
    return loadOne(tx, id);
  });
}
