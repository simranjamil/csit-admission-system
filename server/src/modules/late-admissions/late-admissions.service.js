import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
 
const num = (v) => (v === null || v === undefined ? null : Number(v));
 
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
 
// Unresolved rows first. A resolved row keeps its dummy roll in original_roll_no.
export async function listLate(sessionId) {
  const session = await getSession(prisma, sessionId);
  const apps = await prisma.application.findMany({
    where: { sessionId, OR: [{ isDummy: true }, { originalRollNo: { not: null } }] },
    include: { student: true, testAttempts: { take: 1 } },
    orderBy: [{ isDummy: "desc" }, { id: "asc" }],
  });
  const rows = apps.map((a) => {
    const t = a.testAttempts[0];
    return {
      applicationId: a.id,
      dummyRoll: a.isDummy ? a.rollNo : a.originalRollNo,
      marks: t ? num(t.obtainedMarks) + "/" + num(t.totalMarks) : "-",
      result: !t ? "-" : t.result === "PASSED" ? "Passed" : t.result === "FAILED" ? "Failed" : "Not applied",
      resolved: !a.isDummy,
      realRoll: a.isDummy ? null : a.rollNo,
      name: a.isDummy ? null : a.student?.name ?? null,
    };
  });
  return {
    readOnly: session.status === "CLOSED",
    unresolved: rows.filter((r) => !r.resolved).length,
    rows,
  };
}
 
// Used by the "Same student as" dropdown.
export async function findMatch(sessionId, cnic) {
  const digits = String(cnic ?? "").replace(/\D/g, "");
  if (digits.length !== 13) return null;
  const student = await prisma.student.findFirst({
    where: { cnic: digits, isDummy: false },
    include: { applications: { where: { sessionId }, select: { rollNo: true } } },
  });
  if (!student) return null;
  return {
    id: student.id,
    name: student.name,
    rolls: student.applications.map((a) => a.rollNo).filter(Boolean),
  };
}
 
export async function resolveLate(applicationId, data, actor, ip) {
  try {
    return await prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({
        where: { id: applicationId },
        include: { testAttempts: { take: 1 } },
      });
      if (!app) throw new HttpError(404, "Application not found");
      const session = await getSession(tx, app.sessionId);
      if (session.status === "CLOSED") throw new HttpError(409, "This session is closed");
      if (!app.isDummy) throw new HttpError(409, "This student is already resolved");
      const attempt = app.testAttempts[0];
      if (!attempt) throw new HttpError(409, "This dummy has no test result");
      const dummyRoll = app.rollNo;


      // 1) the real roll: its prefix must be open in this session and belong to the program of the test
      const prefix = /^(.+)-\d+$/.exec(data.realRollNo)?.[1];
      const link = prefix
        ? await tx.sessionProgram.findFirst({
            where: { sessionId: session.id, rollPrefix: { equals: prefix, mode: "insensitive" } },
            include: { programTiming: true },
          })
        : null;
      if (!link) throw new HttpError(400, "Roll prefix " + (prefix ?? data.realRollNo) + " is not open in this session");
      if (link.programTiming.programId !== attempt.programId) {
        throw new HttpError(400, "This roll belongs to a different program than the test " + dummyRoll);
      }
      const rollTaken = await tx.application.findFirst({
        where: { sessionId: session.id, rollNo: data.realRollNo },
      });
      if (rollTaken) throw new HttpError(409, "Roll number " + data.realRollNo + " is already used");


      // 2) the student: an existing one (chosen, or found by CNIC or passport) or the placeholder itself
      let target = null;
      if (data.existingStudentId) {
        target = await tx.student.findUnique({ where: { id: data.existingStudentId } });
        if (!target || target.isDummy) throw new HttpError(404, "The selected student was not found");
        if (data.cnic && target.cnic && target.cnic !== data.cnic) {
          throw new HttpError(409, "This CNIC does not match the selected student");
        }
      } else {
        const keys = [];
        if (data.cnic) keys.push({ cnic: data.cnic });
        if (data.passport) keys.push({ passport: data.passport });
        target = keys.length
          ? await tx.student.findFirst({ where: { isDummy: false, OR: keys } })
          : null;
      }


      const placeholderId = app.studentId;
      if (target) {
        const same = await tx.application.findFirst({
          where: { sessionId: session.id, studentId: target.id, programTimingId: link.programTimingId },
        });
        if (same) throw new HttpError(409, "This student already has an application for this program and timing");
      } else {
        await tx.student.update({
          where: { id: placeholderId },
          data: {
            name: data.name,
            fatherName: data.fatherName || null,
            gender: data.gender || null,
            cnic: data.cnic || null,
            passport: data.passport || null,
            mobile: data.mobile || null,
            email: data.email || null,
            isDummy: false,
          },
        });
      }


      // 3) the application becomes the real one. Test marks and attempts stay as they are.
      await tx.application.update({
        where: { id: app.id },
        data: {
          ...(target ? { studentId: target.id } : {}),
          rollNo: data.realRollNo,
          originalRollNo: dummyRoll,
          isDummy: false,
          programTimingId: link.programTimingId,
          formNo: data.formNo || null,
          externalStudentId: data.externalStudentId || null,
          uniName: data.uniName || null,
          degreeTitle: data.degreeTitle || null,
          passingYear: data.passingYear ?? null,
          obtainedMarks: data.obtainedMarks,
          totalMarks: data.totalMarks,
          cgpa: data.totalMarks === 4 ? data.obtainedMarks : null,
        },
      });


      // 4) the placeholder is no longer needed when the application moved to an existing student
      if (target) {
        const left = await tx.application.count({ where: { studentId: placeholderId } });
        if (left === 0) await tx.student.deleteMany({ where: { id: placeholderId, isDummy: true } });
      }


      await logAudit(tx, {
        userId: actor.id,
        action: "late.resolve",
        entityType: "application",
        entityId: app.id,
        description: "resolved " + dummyRoll + " as " + data.realRollNo,
        metadata: { dummyRoll, realRollNo: data.realRollNo, linkedToExisting: Boolean(target) },
        ipAddress: ip,
      });


      return { applicationId: app.id, dummyRoll, realRollNo: data.realRollNo, linkedToExisting: Boolean(target) };
    });
  } catch (e) {
    if (e?.code === "P2002") throw new HttpError(409, "This CNIC, passport or roll number is already used");
    throw e;
  }
}
