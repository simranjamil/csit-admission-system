import { createHash } from "node:crypto";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { parseFile, rowSchema } from "./result-parser.js";
import { readName, prefixOf } from "./result-rolls.js";
 
const STAGE = "RESULTS";
const hashOf = (buffer) => createHash("sha256").update(buffer).digest("hex");
const num = (v) => (v === null || v === undefined ? null : Number(v));
const stageDto = (s) => ({ done: s?.status === "DONE", completedAt: s?.completedAt ?? null });
 
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
 
// The program must be part of this session.
async function getProgram(db, session, programId) {
  const link = await db.sessionProgram.findFirst({
    where: { sessionId: session.id, programTiming: { programId } },
    include: { programTiming: { include: { program: true } } },
  });
  if (!link) throw new HttpError(404, "That program is not part of this session");
  return link.programTiming.program;
}
 
// Reads the file and sorts every row into: toAttach, toDummy, duplicates, failed.
async function analyze(db, session, program, buffer) {
  const rows = parseFile(buffer);
  const open = await db.sessionProgram.findMany({
    where: { sessionId: session.id, rollPrefix: { not: null } },
    include: { programTiming: true },
  });
  const programOfPrefix = new Map(open.map((o) => [o.rollPrefix.toUpperCase(), o.programTiming.programId]));
 
  const failed = [];
  const parsed = [];
  for (const { line, data, categories, durationSeconds, takenAt } of rows) {
    const check = rowSchema.safeParse(data);
    if (!check.success) {
      failed.push({ line, message: check.error.issues[0].message });
      continue;
    }
    const name = readName(check.data.roll);
    if (name.error) {
      failed.push({ line, message: name.error });
      continue;
    }
    if (name.dummy && name.programCode !== program.code.toUpperCase()) {
      failed.push({ line, message: name.dummy + " is not a " + program.code + " dummy" });
      continue;
    }
    if (name.rolls) {
      const wrong = name.rolls.find((r) => programOfPrefix.get(prefixOf(r)) !== program.id);
      if (wrong) {
        failed.push({ line, message: "Roll " + wrong + " does not belong to " + program.code });
        continue;
      }
    }
    parsed.push({ line, ...check.data, ...name, categories, durationSeconds, takenAt });
  }
 
  const rolls = parsed.flatMap((r) => r.rolls ?? []);
  const dummies = parsed.filter((r) => r.dummy).map((r) => r.dummy);
  const apps = await db.application.findMany({
    where: {
      sessionId: session.id,
      OR: [{ rollNo: { in: [...rolls, ...dummies] } }, { originalRollNo: { in: dummies } }],
    },
    select: { id: true, rollNo: true, originalRollNo: true, studentId: true, testAttempts: { select: { id: true } } },
  });
  const byRoll = new Map(apps.map((a) => [a.rollNo, a]));
  // a dummy that was already resolved now has a real roll, but keeps its dummy in original_roll_no
  const byOriginal = new Map(apps.filter((a) => a.originalRollNo).map((a) => [a.originalRollNo, a]));
 
  const toAttach = [];
  const toDummy = [];
  const duplicates = [];
  const seen = new Set();
  for (const r of parsed) {
    const keys = r.dummy ? [r.dummy] : r.rolls;
    if (keys.some((k) => seen.has(k))) {
      duplicates.push({ line: r.line, message: "Repeated in this file" });
      continue;
    }
    keys.forEach((k) => seen.add(k));
 
    if (r.dummy) {
      if (byRoll.get(r.dummy) || byOriginal.get(r.dummy)) {
        duplicates.push({ line: r.line, message: r.dummy + " was already imported" });
      } else {
        toDummy.push(r);
      }
      continue;
    }
 
    const found = r.rolls.map((k) => byRoll.get(k));
    const missing = r.rolls.filter((k, i) => !found[i]);
    if (missing.length) {
      failed.push({
        line: r.line,
        message: "Roll " + missing.join(", ") + " is not in this session. A late student must be written as dummy-" + program.code + "-01",
      });
      continue;
    }
    if (new Set(found.map((a) => a.studentId)).size > 1) {
      failed.push({ line: r.line, message: "These rolls belong to different students" });
      continue;
    }
    if (found.some((a) => a.testAttempts.length > 0)) {
      duplicates.push({ line: r.line, message: "Result already imported" });
      continue;
    }
    toAttach.push({ ...r, apps: found });
  }
  return { total: rows.length, toAttach, toDummy, duplicates, failed };
}
 
function summary(a) {
  return {
    total: a.total,
    newResults: a.toAttach.length,
    dummyStudents: a.toDummy.length,
    duplicates: a.duplicates.length,
    failed: a.failed.length,
    problems: [...a.failed, ...a.duplicates].sort((x, y) => x.line - y.line).slice(0, 50),
  };
}
 
function attemptData(r, programId, importJobId, applicationId) {
  return {
    applicationId,
    programId,
    importJobId,
    obtainedMarks: r.obtained,
    totalMarks: r.total,
    percentage: Math.round((r.obtained / r.total) * 10000) / 100,
    durationSeconds: r.durationSeconds,
    takenAt: r.takenAt,
    categoryScores: { create: r.categories },
  };
}

 
function jobDto(j) {
  return {
    id: j.id,
    program: j.program?.code ?? "",
    fileName: j.fileName,
    description: j.description,
    rowsImported: j.rowsImported,
    rowsDummy: j.rowsDummy,
    rowsDuplicate: j.rowsDuplicate,
    rowsFailed: j.rowsFailed,
    importedBy: j.createdBy?.fullName ?? null,
    createdAt: j.createdAt,
  };
}
 
export async function getOverview(sessionId) {
  const session = await getSession(prisma, sessionId);
  const [links, jobs, counts, stage, unresolved] = await Promise.all([
    prisma.sessionProgram.findMany({
      where: { sessionId },
      include: { programTiming: { include: { program: true } } },
    }),
    prisma.importJob.findMany({
      where: { sessionId, sourceType: "RESULTS" },
      orderBy: { createdAt: "desc" },
      include: { program: true, createdBy: { select: { fullName: true } } },
    }),
    prisma.testAttempt.findMany({ where: { application: { sessionId } }, select: { programId: true } }),
    prisma.workflowStage.findUnique({ where: { sessionId_stageCode: { sessionId, stageCode: STAGE } } }),
    prisma.application.count({ where: { sessionId, isDummy: true } }),
  ]);
  const programs = new Map(links.map((l) => [l.programTiming.program.id, l.programTiming.program.code]));
  const results = new Map();
  for (const c of counts) results.set(c.programId, (results.get(c.programId) ?? 0) + 1);
  return {
    readOnly: session.status === "CLOSED",
    unresolvedDummies: unresolved,
    programs: [...programs]
      .map(([id, code]) => ({
        id,
        code,
        imported: jobs.some((j) => j.programId === id),
        results: results.get(id) ?? 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    jobs: jobs.map(jobDto),
    stage: stageDto(stage),
  };
}
 
// Imported marks of one program. Pass or fail is decided on the Test Results page.
export async function listImported(sessionId, programId) {
  const session = await getSession(prisma, sessionId);
  const program = await getProgram(prisma, session, programId);
  const attempts = await prisma.testAttempt.findMany({
    where: { programId, application: { sessionId } },
    include: { application: { include: { student: true, programTiming: true } } },
    orderBy: [{ application: { rollNo: "asc" } }, { id: "asc" }],
  });
  const rows = attempts.map((t) => ({
    applicationId: t.applicationId,
    rollNo: t.application.rollNo ?? "",
    name: t.application.student?.name ?? "",
    isDummy: t.application.isDummy,
    timing: t.application.programTiming?.timing ?? "-",
    marks: num(t.obtainedMarks) + " / " + num(t.totalMarks),
    percentage: num(t.percentage),
  }));
  return {
    program: program.code,
    total: rows.length,
    dummies: rows.filter((r) => r.isDummy).length,
    rows,
  };
}

 
export async function previewImport(sessionId, programId, file) {
  const session = await getSession(prisma, sessionId);
  if (session.status === "CLOSED") throw new HttpError(409, "This session is closed, so it cannot receive results");
  const program = await getProgram(prisma, session, programId);
  const analysis = await analyze(prisma, session, program, file.buffer);
  const earlier = await prisma.importJob.findFirst({
    where: { sessionId, programId, sourceType: "RESULTS", fileHash: hashOf(file.buffer) },
  });
  return {
    fileName: file.originalname,
    program: program.code,
    ...summary(analysis),
    alreadyImported: Boolean(earlier),
  };
}
 
export async function importResults(data, file, actor, ip) {
  return prisma.$transaction(
    async (tx) => {
      const session = await getSession(tx, data.sessionId);
      if (session.status === "CLOSED") throw new HttpError(409, "This session is closed, so it cannot receive results");
      const program = await getProgram(tx, session, data.programId);
 
      const fileHash = hashOf(file.buffer);
      const earlier = await tx.importJob.findFirst({
        where: { sessionId: session.id, programId: program.id, sourceType: "RESULTS", fileHash },
      });
      if (earlier) throw new HttpError(409, "This file was already imported for " + program.code);
 
      const a = await analyze(tx, session, program, file.buffer);
      if (a.toAttach.length + a.toDummy.length === 0) throw new HttpError(409, "Nothing new to import from this file");
 
      const job = await tx.importJob.create({
        data: {
          sessionId: session.id,
          sourceType: "RESULTS",
          programId: program.id,
          fileName: file.originalname,
          fileHash,
          description: data.description,
          rowCount: a.total,
          status: "DONE",
          rowsImported: a.toAttach.length,
          rowsDummy: a.toDummy.length,
          rowsDuplicate: a.duplicates.length,
          rowsFailed: a.failed.length,
          createdById: actor.id,
        },
      });
 
      // 1) normal students: one attempt for every application of the row (CT-E-14-CT-W-44 gives two)
      for (const r of a.toAttach) {
        for (const app of r.apps) {
          await tx.testAttempt.create({ data: attemptData(r, program.id, job.id, app.id) });
        }
      }
 
      // 2) late students (Option A): placeholder student + application, marks saved normally
      for (const r of a.toDummy) {
        const student = await tx.student.create({ data: { name: "DUMMY", isDummy: true } });
        const app = await tx.application.create({
          data: { sessionId: session.id, studentId: student.id, rollNo: r.dummy, isDummy: true },
        });
        await tx.testAttempt.create({ data: attemptData(r, program.id, job.id, app.id) });
      }
 
      await tx.workflowStage.upsert({
        where: { sessionId_stageCode: { sessionId: session.id, stageCode: STAGE } },
        update: { status: "IN_PROGRESS", completedAt: null },
        create: { sessionId: session.id, stageCode: STAGE, status: "IN_PROGRESS" },
      });
 
      await logAudit(tx, {
        userId: actor.id,
        action: "results.import",
        entityType: "import_job",
        entityId: job.id,
        description: "imported " + program.code + " results into session " + session.year,
        metadata: {
          fileName: file.originalname,
          imported: a.toAttach.length,
          dummies: a.toDummy.length,
          duplicates: a.duplicates.length,
          failed: a.failed.length,
        },
        ipAddress: ip,
      });
 
      return { ...summary(a), program: program.code, jobId: job.id };
    },
    { timeout: 120000, maxWait: 10000 }
  );
}
 
// Done does not lock anything. More files can be imported afterwards.
export async function setResultsDone(sessionId, done, actor, ip) {
  return prisma.$transaction(async (tx) => {
    const session = await getSession(tx, sessionId);
    if (session.status === "CLOSED") throw new HttpError(409, "This session is closed");
    const values = { status: done ? "DONE" : "IN_PROGRESS", completedAt: done ? new Date() : null };
    const stage = await tx.workflowStage.upsert({
      where: { sessionId_stageCode: { sessionId: session.id, stageCode: STAGE } },
      update: values,
      create: { sessionId: session.id, stageCode: STAGE, ...values },
    });
    await logAudit(tx, {
      userId: actor.id,
      action: done ? "results.done" : "results.reopen",
      entityType: "session",
      entityId: session.id,
      description: (done ? "marked results as done" : "reopened results") + " for session " + session.year,
      ipAddress: ip,
    });
    return stageDto(stage);
  });
}
