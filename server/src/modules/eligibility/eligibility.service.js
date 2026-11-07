import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { RULE_BY_KEY } from "../rules/rule-definitions.js";
import { checkEligibility } from "../rules/rule-evaluators.js";
 
const RULE_KEY = "MIN_CGPA";
const ELIGIBLE = "ELIGIBLE";
const NOT_ELIGIBLE = "NOT_ELIGIBLE";
const NEEDS_REVIEW = "NEEDS_REVIEW";
const NOT_EVALUATED = "NOT_EVALUATED";
 
const def = RULE_BY_KEY.get(RULE_KEY);
 
async function getSession(db, id) {
  const session = await db.admissionSession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}
 
// The version must belong to the MIN_CGPA rule of this same session.
async function getVersion(db, sessionId, ruleVersionId) {
  const version = await db.ruleVersion.findFirst({
    where: { id: ruleVersionId, rule: { sessionId, ruleKey: RULE_KEY } },
  });
  if (!version) throw new HttpError(404, "That rule version does not belong to this session");
  return version;
}
 
// forRun: true skips placeholder (dummy) students, they are handled in a later step.
async function loadApplications(db, sessionId, filters = {}, forRun = false) {
  const timingWhere = {};
  if (filters.timing) timingWhere.timing = { equals: filters.timing, mode: "insensitive" };
  if (filters.program) timingWhere.program = { code: filters.program.toUpperCase() };
  const hasTiming = Object.keys(timingWhere).length > 0;
 
  return db.application.findMany({
    where: {
      sessionId,
      ...(forRun ? { isDummy: false } : {}),
      ...(hasTiming ? { programTiming: timingWhere } : {}),
    },
    include: { student: true, programTiming: { include: { program: true } } },
    orderBy: [{ rollNo: "asc" }, { id: "asc" }],
  });
}
 
// Latest evaluation row of every application.
async function latestEvaluations(db, applicationIds) {
  const rows = await db.eligibilityEvaluation.findMany({
    where: { applicationId: { in: applicationIds } },
    distinct: ["applicationId"],
    orderBy: [{ applicationId: "asc" }, { evaluatedAt: "desc" }, { id: "desc" }],
    include: { ruleVersion: { select: { version: true } } },
  });
  return new Map(rows.map((r) => [r.applicationId, r]));
}
 
const num = (v) => (v === null || v === undefined ? null : Number(v));
 
// One application against one rule version.
function evaluate(app, config) {
  const r = checkEligibility({ obtained: num(app.obtainedMarks), total: num(app.totalMarks) }, config);
  const decision = r.needsReview ? NEEDS_REVIEW : r.eligible ? ELIGIBLE : NOT_ELIGIBLE;
  return { decision, reason: r.reason };
}
 
function marksText(app) {
  if (app.obtainedMarks === null || app.totalMarks === null) return "";
  return num(app.obtainedMarks) + " / " + num(app.totalMarks);
}
 
function toRow(app, ev) {
  return {
    applicationId: app.id,
    rollNo: app.rollNo ?? "",
    cnic: app.student?.cnic ?? app.student?.passport ?? "",
    name: app.student?.name ?? "",
    marks: marksText(app),
    program: app.programTiming?.program.code ?? "-",
    timing: app.programTiming?.timing ?? "-",
    status: ev ? ev.decision : NOT_EVALUATED,
    reason: ev?.reason ?? "",
    ruleVersion: ev?.ruleVersion?.version ?? null,
  };
}
 
export async function listRuleVersions(sessionId) {
  await getSession(prisma, sessionId);
  const rule = await prisma.rule.findUnique({
    where: { sessionId_ruleKey: { sessionId, ruleKey: RULE_KEY } },
    include: { versions: { orderBy: { version: "desc" } } },
  });
  if (!rule) throw new HttpError(409, "Rules are not set up for this session. Open the Rules page once");
  return rule.versions.map((v, i) => ({
    id: v.id,
    version: v.version,
    summary: def.summarize(v.config),
    reason: v.reason,
    isCurrent: i === 0,
    createdAt: v.effectiveFrom,
  }));
}
 
export async function listEligibility(sessionId, filters) {
  const session = await getSession(prisma, sessionId);
  const apps = await loadApplications(prisma, sessionId, filters);
  const evals = await latestEvaluations(prisma, apps.map((a) => a.id));
 
  let rows = apps.map((a) => toRow(a, evals.get(a.id)));
  if (filters.status) rows = rows.filter((r) => r.status === filters.status);
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
      eligible: count(ELIGIBLE),
      notEligible: count(NOT_ELIGIBLE),
      needsReview: count(NEEDS_REVIEW),
      notEvaluated: count(NOT_EVALUATED),
    },
    rows,
  };
}
 
export async function previewRun(sessionId, ruleVersionId) {
  await getSession(prisma, sessionId);
  const version = await getVersion(prisma, sessionId, ruleVersionId);
  const apps = await loadApplications(prisma, sessionId, {}, true);
  const evals = await latestEvaluations(prisma, apps.map((a) => a.id));
 
  let eligible = 0;
  let needsReview = 0;
  let changed = 0;
  for (const app of apps) {
    const { decision } = evaluate(app, version.config);
    if (decision === ELIGIBLE) eligible += 1;
    if (decision === NEEDS_REVIEW) needsReview += 1;
    const old = evals.get(app.id)?.decision;
    if (old && old !== decision) changed += 1;
  }
  return {
    total: apps.length,
    eligible,
    needsReview,
    notEligible: apps.length - eligible - needsReview,
    changed, // students whose saved result would be different
    rule: { version: version.version, summary: def.summarize(version.config) },
  };
}
 
export async function runEligibility(data, actor, ip) {
  return prisma.$transaction(
    async (tx) => {
      const session = await getSession(tx, data.sessionId);
      if (session.status === "CLOSED") {
        throw new HttpError(409, "This session is closed, so eligibility cannot be run");
      }
      const version = await getVersion(tx, session.id, data.ruleVersionId);
      const apps = await loadApplications(tx, session.id, {}, true);
      if (apps.length === 0) throw new HttpError(409, "No applications yet. Import the forms first");
 
      let eligible = 0;
      let needsReview = 0;
      const rows = apps.map((app) => {
        const { decision, reason } = evaluate(app, version.config);
        if (decision === ELIGIBLE) eligible += 1;
        if (decision === NEEDS_REVIEW) needsReview += 1;
        return { applicationId: app.id, ruleVersionId: version.id, decision, reason };
      });
      const notEligible = apps.length - eligible - needsReview;
 
      await tx.eligibilityEvaluation.createMany({ data: rows });
 
      await logAudit(tx, {
        userId: actor.id,
        action: "eligibility.run",
        entityType: "session",
        entityId: session.id,
        description:
          "applied " + def.summarize(version.config) + " (v" + version.version + ") to session " + session.year,
        metadata: { ruleVersionId: version.id, total: apps.length, eligible, notEligible, needsReview },
        ipAddress: ip,
      });
 
      return { total: apps.length, eligible, notEligible, needsReview, version: version.version };
    },
    { timeout: 60000 }
  );
}
 
const STATUS_TEXT = {
  [ELIGIBLE]: "Eligible",
  [NOT_ELIGIBLE]: "Not eligible",
  [NEEDS_REVIEW]: "Needs review",
  [NOT_EVALUATED]: "Not evaluated",
};
const HEAD = ["Roll no", "CNIC", "Name", "Marks", "Program", "Timing", "Status", "Reason", "Rule version"];
 
// Quotes every cell, and stops Excel from running text that starts with = + - @ as a formula.
function cell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
 
export async function exportCsv(sessionId, filters, actor, ip) {
  const data = await listEligibility(sessionId, filters);
  const lines = [HEAD.map(cell).join(",")];
  for (const r of data.rows) {
    lines.push(
      [
        r.rollNo,
        r.cnic,
        r.name,
        r.marks,
        r.program,
        r.timing,
        STATUS_TEXT[r.status],
        r.reason,
        r.ruleVersion ? "v" + r.ruleVersion : "",
      ]
        .map(cell)
        .join(",")
    );
  }
 
  await logAudit(prisma, {
    userId: actor.id,
    action: "eligibility.export",
    entityType: "session",
    entityId: sessionId,
    description: "downloaded eligibility list of session " + data.session.year,
    metadata: { rows: data.rows.length, ...filters },
    ipAddress: ip,
  });
 
  const part = (s) => (s ? "-" + s.toLowerCase().replace(/[^a-z0-9]/g, "") : "");
  return {
    filename: "eligibility-" + data.session.year + part(filters.timing) + part(filters.program) + ".csv",
    csv: "\uFEFF" + lines.join("\r\n"), // BOM so Excel reads UTF-8 names correctly
  };
}
