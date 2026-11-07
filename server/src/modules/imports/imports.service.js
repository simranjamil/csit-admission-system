import { createHash } from "node:crypto";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { parseFile, rowSchema } from "./import-parser.js";
 
const STAGE = "IMPORT";
const hashOf = (buffer) => createHash("sha256").update(buffer).digest("hex");
 
// CT-E-02 -> CT-E
const prefixOf = (roll) => {
  const m = /^(.+)-\d+$/.exec(roll);
  return m ? m[1].toUpperCase() : null;
};
const studentKey = (r) => r.cnic || "P:" + r.passport;
 
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
 
const stageDto = (s) => ({ done: s?.status === "DONE", completedAt: s?.completedAt ?? null });
 
function toDto(b) {
  return {
    id: b.id,
    batchName: b.batchName,
    fileName: b.fileName,
    description: b.description,
    rowsTotal: b.rowsTotal,
    rowsImported: b.rowsImported,
    rowsDuplicate: b.rowsDuplicate,
    rowsFailed: b.rowsFailed,
    importedBy: b.importedBy?.fullName ?? null,
    createdAt: b.createdAt,
  };
}
 
async function findStudents(db, rows) {
  const cnics = [...new Set(rows.map((r) => r.cnic).filter(Boolean))];
  const passports = [...new Set(rows.map((r) => r.passport).filter(Boolean))];
  const students = await db.student.findMany({
    where: { OR: [{ cnic: { in: cnics } }, { passport: { in: passports } }] },
    select: { id: true, cnic: true, passport: true },
  });
  const byCnic = new Map(students.filter((s) => s.cnic).map((s) => [s.cnic, s.id]));
  const byPassport = new Map(students.filter((s) => s.passport).map((s) => [s.passport, s.id]));
  const idOf = (r) =>
    (r.cnic ? byCnic.get(r.cnic) : undefined) ?? (r.passport ? byPassport.get(r.passport) : undefined);
  return { students, idOf };
}
 
// Reads the file and sorts every row into: toImport, duplicates, failed.
async function analyze(db, session, buffer) {
  const rows = parseFile(buffer);
 
  const open = await db.sessionProgram.findMany({
    where: { sessionId: session.id, rollPrefix: { not: null } },
    include: { programTiming: true },
  });
  const optionBy = new Map(open.map((o) => [o.rollPrefix.toUpperCase(), o]));
 
  const failed = [];
  const valid = [];
  for (const { line, data, extra } of rows) {
    const parsed = rowSchema.safeParse(data);
    if (!parsed.success) {
      failed.push({ line, message: parsed.error.issues[0].message });
      continue;
    }
    const r = parsed.data;
    const prefix = prefixOf(r.rollNo);
    if (!prefix) {
      failed.push({ line, message: "Roll number " + r.rollNo + " should look like CT-E-02" });
      continue;
    }
    const option = optionBy.get(prefix);
    if (!option) {
      failed.push({ line, message: "Roll prefix " + prefix + " is not open in this session" });
      continue;
    }
    if (r.timing && r.timing.toLowerCase() !== option.programTiming.timing.toLowerCase()) {
      failed.push({ line, message: "Timing " + r.timing + " does not match roll " + r.rollNo });
      continue;
    }
    valid.push({ line, ...r, extra, programTimingId: option.programTimingId });
  }
 
  const { students, idOf } = await findStudents(db, valid);
  const apps = await db.application.findMany({
    where: {
      sessionId: session.id,
      OR: [{ rollNo: { in: valid.map((r) => r.rollNo) } }, { studentId: { in: students.map((s) => s.id) } }],
    },
    select: { rollNo: true, studentId: true, programTimingId: true },
  });
  const takenRoll = new Set(apps.map((a) => (a.rollNo ?? "").toUpperCase()));
  const takenPair = new Set(apps.map((a) => a.studentId + "|" + a.programTimingId));
 
  const toImport = [];
  const duplicates = [];
  const seenRoll = new Set();
  const seenPair = new Set();
  for (const r of valid) {
    const sid = idOf(r);
    const pair = (sid ?? studentKey(r)) + "|" + r.programTimingId;
    if (takenRoll.has(r.rollNo) || (sid !== undefined && takenPair.has(sid + "|" + r.programTimingId))) {
      duplicates.push({ line: r.line, message: "Already imported in this session" });
    } else if (seenRoll.has(r.rollNo) || seenPair.has(pair)) {
      duplicates.push({ line: r.line, message: "Repeated in this file" });
    } else {
      seenRoll.add(r.rollNo);
      seenPair.add(pair);
      toImport.push(r);
    }
  }
  const newStudents = new Set(toImport.filter((r) => idOf(r) === undefined).map(studentKey)).size;
  return { total: rows.length, toImport, duplicates, failed, newStudents };
}
 
function summary(a) {
  return {
    total: a.total,
    newApplications: a.toImport.length,
    newStudents: a.newStudents,
    existingStudents: new Set(a.toImport.map(studentKey)).size - a.newStudents,
    duplicates: a.duplicates.length,
    failed: a.failed.length,
    problems: [...a.failed, ...a.duplicates].sort((x, y) => x.line - y.line).slice(0, 50),
  };
}
 
async function findEarlierImport(db, sessionId, fileHash) {
  return db.importBatch.findFirst({ where: { sessionId, fileHash }, orderBy: { createdAt: "desc" } });
}
 
export async function listBatches(sessionId) {
  await getSession(prisma, sessionId);
  const [batches, stage] = await Promise.all([
    prisma.importBatch.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      include: { importedBy: { select: { fullName: true } } },
    }),
    prisma.workflowStage.findUnique({ where: { sessionId_stageCode: { sessionId, stageCode: STAGE } } }),
  ]);
  return { batches: batches.map(toDto), stage: stageDto(stage) };
}
 
export async function previewImport(sessionId, file) {
  const session = await getSession(prisma, sessionId);
  if (session.status === "CLOSED") throw new HttpError(409, "This session is closed, so it cannot receive imports");
  const analysis = await analyze(prisma, session, file.buffer);
  const earlier = await findEarlierImport(prisma, sessionId, hashOf(file.buffer));
  return {
    fileName: file.originalname,
    ...summary(analysis),
    alreadyImported: earlier
      ? { batchName: earlier.batchName, createdAt: earlier.createdAt, description: earlier.description }
      : null,
  };
}
 
export async function importFile(data, file, actor, ip) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const session = await getSession(tx, data.sessionId);
        if (session.status === "CLOSED") throw new HttpError(409, "This session is closed, so it cannot receive imports");
 
        const fileHash = hashOf(file.buffer);
        const earlier = await findEarlierImport(tx, session.id, fileHash);
        if (earlier) {
          if (!data.allowReimport) {
            throw new HttpError(
              409,
              'This file was already imported as "' + earlier.batchName + '". Tick "Import this file again" to continue'
            );
          }
          if (data.description.length < 3) {
            throw new HttpError(400, "Write a description to import the same file again");
          }
        }
 
        const a = await analyze(tx, session, file.buffer);
        const batch = await tx.importBatch.create({
          data: {
            sessionId: session.id,
            batchName: data.batchName,
            fileName: file.originalname,
            fileHash,
            description: data.description,
            rowsTotal: a.total,
            rowsImported: a.toImport.length,
            rowsDuplicate: a.duplicates.length,
            rowsFailed: a.failed.length,
            importedById: actor.id,
          },
        });
 
        // 1) new students only. Existing students stay exactly as they are.
        const before = await findStudents(tx, a.toImport);
        const uniqueNew = new Map();
        for (const r of a.toImport) {
          if (before.idOf(r) === undefined && !uniqueNew.has(studentKey(r))) {
            uniqueNew.set(studentKey(r), {
              cnic: r.cnic || null,
              passport: r.passport || null,
              name: r.name,
              fatherName: r.fatherName || null,
              gender: r.gender || null,
              mobile: r.mobile || null,
              email: r.email || null,
            });
          }
        }
        await tx.student.createMany({ data: [...uniqueNew.values()], skipDuplicates: true });
 
        // 2) applications (student ids of new and old students)
        const after = await findStudents(tx, a.toImport);
        const created = await tx.application.createMany({
          data: a.toImport.map((r) => ({
            sessionId: session.id,
            studentId: after.idOf(r),
            programTimingId: r.programTimingId,
            formNo: r.formNo || null,
            rollNo: r.rollNo,
            externalStudentId: r.studentId || null,
            degreeTitle: r.degreeTitle || null,
            uniName: r.uniName || null,
            passingYear: r.passingYear,
            obtainedMarks: r.obtained,
            totalMarks: r.total,
            cgpa: r.total === 4 ? r.obtained : null,
            extraData: Object.keys(r.extra).length ? r.extra : undefined,
            importBatchId: batch.id,
          })),
          skipDuplicates: true,
        });
 
        const imported = created.count;
        const skipped = a.toImport.length - imported;
        if (skipped !== 0) {
          await tx.importBatch.update({
            where: { id: batch.id },
            data: { rowsImported: imported, rowsDuplicate: a.duplicates.length + skipped },
          });
        }
 
        // new rows came in, so the import is not "done" any more until Admin says so
        if (imported > 0) {
          await tx.workflowStage.upsert({
            where: { sessionId_stageCode: { sessionId: session.id, stageCode: STAGE } },
            update: { status: "IN_PROGRESS", completedAt: null },
            create: { sessionId: session.id, stageCode: STAGE, status: "IN_PROGRESS" },
          });
        }
 
        await logAudit(tx, {
          userId: actor.id,
          action: "import.create",
          entityType: "import_batch",
          entityId: batch.id,
          description: 'imported "' + data.batchName + '" into session ' + session.year,
          metadata: {
            fileName: file.originalname,
            imported,
            duplicates: a.duplicates.length + skipped,
            failed: a.failed.length,
            again: Boolean(earlier),
          },
          ipAddress: ip,
        });
 
        return {
          ...toDto({ ...batch, importedBy: null }),
          ...summary(a),
          rowsImported: imported,
        };
      },
      { timeout: 60000 }
    );
  } catch (e) {
    if (e?.code === "P2002") throw new HttpError(409, "A batch with this name already exists in this session");
    throw e;
  }
}
 
// Done does not lock anything. More files can be imported afterwards.
export async function setImportDone(sessionId, done, actor, ip) {
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
      action: done ? "import.done" : "import.reopen",
      entityType: "session",
      entityId: session.id,
      description: (done ? "marked import as done" : "reopened import") + " for session " + session.year,
      ipAddress: ip,
    });
    return stageDto(stage);
  });
}
