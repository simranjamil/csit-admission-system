import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMS = [
  { code: "CT", name: "MS Computer Science & Information Technology (CT)" },
  { code: "DS", name: "MS Data Science (DS)" },
  { code: "GDS", name: "MS Geospatial Data Science (GDS)" },
  { code: "IS", name: "MS Information Security (IS)" },
];
const TIMINGS = ["Evening", "Weekend"];

async function main() {
  const session = await prisma.admissionSession.upsert({
    where: { year: 2026 },
    update: { status: "ACTIVE" },
    create: {
      name: "Session 2026",
      year: 2026,
      status: "ACTIVE",
      startDate: new Date("2026-10-01"),
    },
  });

  for (const p of PROGRAMS) {
    const program = await prisma.program.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });

    for (const t of TIMINGS) {
      const timing = await prisma.programTiming.upsert({
        where: { programId_timing: { programId: program.id, timing: t } },
        update: {},
        create: { programId: program.id, timing: t },
      });

      await prisma.sessionProgram.upsert({
        where: {
          sessionId_programTimingId: {
            sessionId: session.id,
            programTimingId: timing.id,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          programTimingId: timing.id,
          seats: 40,
          rollPrefix: `${p.code}-${t[0]}`,
        },
      });
    }
  }

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());