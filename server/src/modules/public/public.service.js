import { prisma } from "../../config/database.js";

export async function getPublicSummary() {
  const session = await prisma.admissionSession.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { year: "desc" },
  });

  if (!session) return { session: null, programs: [] };

  const rows = await prisma.sessionProgram.findMany({
    where: {
      sessionId: session.id,
      programTiming: { isActive: true, program: { isActive: true } },
    },
    include: { programTiming: { include: { program: true } } },
    orderBy: [
      { programTiming: { program: { code: "asc" } } },
      { programTiming: { timing: "asc" } },
    ],
  });

  const map = new Map();
  for (const r of rows) {
    const p = r.programTiming.program;
    if (!map.has(p.id)) {
      map.set(p.id, { id: p.id, code: p.code, name: p.name, timings: [] });
    }
    map.get(p.id).timings.push({
      timingId: r.programTimingId,
      timing: r.programTiming.timing,
      seats: r.seats,
    });
  }

  return {
    session: {
      id: session.id,
      name: session.name,
      year: session.year,
      status: session.status,
    },
    programs: [...map.values()],
  };
}