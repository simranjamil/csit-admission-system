import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// ==========================================
// 1. PROGRAM CONFIGURATION
// ==========================================

const PROGRAMS = [
  {
    code: "CT",
    name: "MS Computer Science & Information Technology (CT)",
  },
  {
    code: "DS",
    name: "MS Data Science (DS)",
  },
  {
    code: "GDS",
    name: "MS Geospatial Data Science (GDS)",
  },
  {
    code: "IS",
    name: "MS Information Security (IS)",
  },
];

const TIMINGS = ["Evening", "Weekend"];

// ==========================================
// 2. AUTHENTICATION SEEDING
// ==========================================

async function seedAuth() {
  const modules = {};

  for (const m of [
    { code: "interview", name: "Interview" },
    { code: "examination", name: "Examination" },
    { code: "admission", name: "Admission" },
    { code: "results", name: "Results" },
  ]) {
    modules[m.code] = await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: m,
    });
  }

  // Permissions
  const permissionList = [
    {
      code: "user.manage",
      module: "interview",
      description: "Create and manage users",
    },
    {
      code: "import.run",
      module: "interview",
      description: "Import student and result files",
    },
    {
      code: "schedule.approve",
      module: "interview",
      description: "Approve interview schedule",
    },
    {
      code: "interview.submit",
      module: "interview",
      description: "Submit interviews",
    },
    {
      code: "merit.run",
      module: "admission",
      description: "Generate merit lists",
    },
    {
      code: "admission.decide",
      module: "admission",
      description: "Admit, reject or waitlist",
    },
  ];

  const permissions = {};

  for (const p of permissionList) {
    permissions[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        description: p.description,
        moduleId: modules[p.module].id,
      },
      create: {
        code: p.code,
        description: p.description,
        moduleId: modules[p.module].id,
      },
    });
  }

  // Roles
  const roleList = [
    {
      name: "Admin",
      description: "Full access",
      homePath: "/admin",
      permissions: permissionList.map((p) => p.code),
    },
    {
      name: "Interviewer",
      description: "Takes interviews",
      homePath: "/interviewer",
      permissions: ["interview.submit"],
    },
  ];

  const roles = {};

  for (const r of roleList) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        homePath: r.homePath,
      },
      create: {
        name: r.name,
        description: r.description,
        homePath: r.homePath,
      },
    });

    for (const code of r.permissions) {
      const key = {
        roleId: roles[r.name].id,
        permissionId: permissions[code].id,
      };

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: key },
        update: {},
        create: key,
      });
    }
  }

  // Default users
  const users = [
    {
      username: "admin",
      fullName: "Dr. Admin",
      password: "Admin@12345",
      role: "Admin",
    },
    {
      username: "sana.khan",
      fullName: "Sana Khan",
      password: "Sana@12345",
      role: "Interviewer",
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        fullName: u.fullName,
        passwordHash: await argon2.hash(u.password),
      },
    });

    const key = {
      userId: user.id,
      roleId: roles[u.role].id,
    };

    await prisma.userRole.upsert({
      where: { userId_roleId: key },
      update: {},
      create: key,
    });
  }

  console.log("Authentication seed done");
}

// ==========================================
// 3. MAIN SEED FUNCTION
// ==========================================

async function main() {
  // Create admission session
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

  // Create programs and timings
  for (const p of PROGRAMS) {
    const program = await prisma.program.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });

    for (const t of TIMINGS) {
      const timing = await prisma.programTiming.upsert({
        where: {
          programId_timing: {
            programId: program.id,
            timing: t,
          },
        },
        update: {},
        create: {
          programId: program.id,
          timing: t,
        },
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

  // Seed authentication data
  await seedAuth();

  console.log("Seed done");
}

// ==========================================
// 4. EXECUTION
// ==========================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
