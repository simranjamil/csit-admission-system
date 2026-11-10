import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { RULE_BY_KEY } from "../rules/rule-definitions.js";
 
const RULE_KEY = "TEST_PASS";
const PASSED = "PASSED";
const FAILED = "FAILED";
const ABSENT = "ABSENT";
const NOT_EVALUATED = "NOT_EVALUATED";
 
const def = RULE_BY_KEY.get(RULE_KEY);
const summarize = (config) => (def ? def.summarize(config) : JSON.stringify(config));
const num = (v) => (v === null || v === undefined ? null : Number(v));
 
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
 
// The version must belong to the TEST_PASS rule of this same session.
async function getVersion(db, sessionId, ruleVersionId) {
  const version = await db.ruleVersion.findFirst({
    where: { id: ruleVersionId, rule: { sessionId, ruleKey: RULE_KEY } },
  });
  if (!version) throw new HttpError(404, "That rule version does not belong to this session");
  return version;
}
 
// ONE place that reads the TEST_PASS config. Open src/modules/rules/rule-definitions.js,
// find TEST_PASS and use its real field name here.
function isPassed(percentage, config) {
  const pass = Number(config?.passPercentage);
  if (!Number.isFinite(pass)) {
    throw new HttpError(409, "The TEST_PASS rule has no pass percentage. Check the Rules page");
  }
  return config.inclusive ? percentage >= pass : percentage > pass;
}

 
// Every student with a result, plus eligible students who are absent. One shape for the list and the CSV.
async function loadRows(db, sessionId, filters = {}, withCategories = false) {
  const apps = await db.application.findMany({
    where: { sessionId },
    include: {
      student: true,
      programTiming: { include: { program: true } },
      testAttempts: {
        take: 1,
        include: {
          program: true,
          ruleVersion: { select: { version: true } },
          ...(withCategories ? { categoryScores: true } : {}),
        },
      },
    },
    orderBy: [{ rollNo: "asc" }, { id: "asc" }],
  });
 
  // Only a program with at least one result file can have absent students.
  const jobs = await db.importJob.findMany({
    where: { sessionId, sourceType: "RESULTS" },
    select: { programId: true },
    distinct: ["programId"],
  });
  const imported = new Set(jobs.map((j) => j.programId));
 
  const without = apps.filter((a) => a.testAttempts.length === 0 && !a.isDummy);
  const evals = await db.eligibilityEvaluation.findMany({
    where: { applicationId: { in: without.map((a) => a.id) } },
    distinct: ["applicationId"],
    orderBy: [{ applicationId: "asc" }, { evaluatedAt: "desc" }, { id: "desc" }],
    select: { applicationId: true, decision: true },
  });
  const eligible = new Set(evals.filter((e) => e.decision === "ELIGIBLE").map((e) => e.applicationId));
 
  let rows = [];
  for (const a of apps) {
    const t = a.testAttempts[0];
    let status;
    if (t) status = t.result ?? NOT_EVALUATED;
    else if (a.programTiming && imported.has(a.programTiming.programId) && eligible.has(a.id)) status = ABSENT;
    else continue;
    rows.push({
      applicationId: a.id,
      rollNo: a.rollNo ?? "",
      cnic: a.student?.cnic ?? a.student?.passport ?? "",
      name: a.student?.name ?? "",
      isDummy: a.isDummy,
      program: t?.program?.code ?? a.programTiming?.program.code ?? "-",
      timing: a.programTiming?.timing ?? "-",
      marks: t ? num(t.obtainedMarks) + " / " + num(t.totalMarks) : "",
      percentage: t ? num(t.percentage) : null,
      status,
      ruleVersion: t?.ruleVersion?.version ?? null,
      categories:
        withCategories && t
          ? t.categoryScores.map((c) => ({ name: c.categoryName, obtained: num(c.obtainedMarks), total: num(c.totalMarks) }))
          : [],
    });
  }
 
  // a late student with no resolved roll yet has no timing, so a Timing filter leaves it out
  if (filters.timing) rows = rows.filter((r) => r.timing.toLowerCase() === filters.timing.toLowerCase());
  if (filters.program) rows = rows.filter((r) => r.program === filters.program.toUpperCase());
  if (filters.status) rows = rows.filter((r) => r.status === filters.status);
  return rows;
}
 
export async function listRuleVersions(sessionId) {
  await getSession(prisma, sessionId);
  const rule = await prisma.rule.findUnique({
    where: { sessionId_ruleKey: { sessionId, ruleKey: RULE_KEY } },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!rule || rule.versions.length === 0) {
    throw new HttpError(409, "The pass mark rule (TEST_PASS) is not set. Open the Rules page first");
  }
  return rule.versions.map((v, i) => ({
    id: v.id,
    version: v.version,
    summary: summarize(v.config),
    reason: v.reason,
    isCurrent: i === 0,
    createdAt: v.effectiveFrom,
  }));
}
 
export async function listTestResults(sessionId, filters) {
  const session = await getSession(prisma, sessionId);
  const rows = await loadRows(prisma, sessionId, filters);
  const count = (s) => rows.filter((r) => r.status === s).length;
  const open = await prisma.sessionProgram.findMany({
    where: { sessionId },
    include: { programTiming: { include: { program: true } } },
  });
  return {
    session: { id: session.id, name: session.name, year: session.year, status: session.status },
    readOnly: session.status === "CLOSED",
    timings: [...new Set(open.map((o) => o.programTiming.timing))].sort(),
    programs: [...new Set(open.map((o) => o.programTiming.program.code))].sort(),
    counts: {
      total: rows.length,
      passed: count(PASSED),
      failed: count(FAILED),
      absent: count(ABSENT),
      notEvaluated: count(NOT_EVALUATED),
    },
    rows,
  };
}
 
export async function previewRun(sessionId, ruleVersionId) {
  await getSession(prisma, sessionId);
  const version = await getVersion(prisma, sessionId, ruleVersionId);
  const attempts = await prisma.testAttempt.findMany({
    where: { application: { sessionId } },
    select: { percentage: true, result: true },
  });
  let passed = 0;
  let changed = 0;
  for (const t of attempts) {
    const ok = isPassed(num(t.percentage), version.config);
    if (ok) passed += 1;
    if (t.result && t.result !== (ok ? PASSED : FAILED)) changed += 1;
  }
  return {
    total: attempts.length,
    passed,
    failed: attempts.length - passed,
    notEvaluated: attempts.filter((t) => !t.result).length,
    changed, // results whose saved result would be different
    rule: { version: version.version, summary: summarize(version.config) },
  };
}
 
export async function runRule(data, actor, ip) {
  return prisma.$transaction(
    async (tx) => {
      const session = await getSession(tx, data.sessionId);
      if (session.status === "CLOSED") throw new HttpError(409, "This session is closed, so a rule cannot be applied");
      const version = await getVersion(tx, session.id, data.ruleVersionId);
      const attempts = await tx.testAttempt.findMany({
        where: { application: { sessionId: session.id } },
        select: { id: true, percentage: true },
      });
      if (attempts.length === 0) throw new HttpError(409, "No results yet. Import the result files first");
 
      const passIds = [];
      const failIds = [];
      for (const t of attempts) (isPassed(num(t.percentage), version.config) ? passIds : failIds).push(t.id);
 
      if (passIds.length) {
        await tx.testAttempt.updateMany({ where: { id: { in: passIds } }, data: { result: PASSED, ruleVersionId: version.id } });
      }
      if (failIds.length) {
        await tx.testAttempt.updateMany({ where: { id: { in: failIds } }, data: { result: FAILED, ruleVersionId: version.id } });
      }
 
      await logAudit(tx, {
        userId: actor.id,
        action: "testresults.run",
        entityType: "session",
        entityId: session.id,
        description: "applied " + summarize(version.config) + " (v" + version.version + ") to test results of session " + session.year,
        metadata: { ruleVersionId: version.id, total: attempts.length, passed: passIds.length, failed: failIds.length },
        ipAddress: ip,
      });
      return { total: attempts.length, passed: passIds.length, failed: failIds.length, version: version.version };
    },
    { timeout: 60000 }
  );
}
 
const STATUS_TEXT = { PASSED: "Passed", FAILED: "Failed", ABSENT: "Absent", NOT_EVALUATED: "Not evaluated" };
const HEAD = ["Roll no", "CNIC", "Name", "Marks", "Percentage", "Program", "Timing", "Result", "Rule version"];
 
// Quotes every cell, and stops Excel from running text that starts with = + - @ as a formula.
function cell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
 
// The CSV has one extra column for every test category found in the filtered rows.
export async function exportCsv(sessionId, filters, actor, ip) {
  const session = await getSession(prisma, sessionId);
  const rows = await loadRows(prisma, sessionId, filters, true);
  const categories = [...new Set(rows.flatMap((r) => r.categories.map((c) => c.name)))].sort();
  const lines = [[...HEAD, ...categories].map(cell).join(",")];
  for (const r of rows) {
    const scores = new Map(r.categories.map((c) => [c.name, c.obtained + " / " + c.total]));
    lines.push(
      [
        r.rollNo,
        r.cnic,
        r.name,
        r.marks,
        r.percentage === null ? "" : r.percentage,
        r.program,
        r.timing,
        STATUS_TEXT[r.status],
        r.ruleVersion ? "v" + r.ruleVersion : "",
        ...categories.map((n) => scores.get(n) ?? ""),
      ]
        .map(cell)
        .join(",")
    );
  }
  await logAudit(prisma, {
    userId: actor.id,
    action: "testresults.export",
    entityType: "session",
    entityId: sessionId,
    description: "downloaded test results of session " + session.year,
    metadata: { rows: rows.length, ...filters },
    ipAddress: ip,
  });
  const part = (s) => (s ? "-" + s.toLowerCase().replace(/[^a-z0-9]/g, "") : "");
  return {
    filename: "test-results-" + session.year + part(filters.timing) + part(filters.program) + part(filters.status) + ".csv",
    csv: "\uFEFF" + lines.join("\r\n"), // BOM so Excel reads UTF-8 names correctly
  };
}
