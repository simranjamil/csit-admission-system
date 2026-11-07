import { isDeepStrictEqual } from "node:util";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../utils/http-error.js";
import { logAudit } from "../audit/audit.service.js";
import { RULE_DEFINITIONS, RULE_BY_KEY } from "./rule-definitions.js";
import { ensureRules } from "./rule-bootstrap.js";
const byAdmin = { approvedBy: { select: { fullName: true } } };
const latest = {
  versions: { orderBy: { version: "desc" }, take: 1, include: byAdmin },
};
function firstIssue(error) {
  const i = error.issues?.[0];
  if (!i) return "Invalid value";
  return (i.path?.length ? i.path.join(".") + ": " : "") + i.message;
}
function toDto(rule, version) {
  const def = RULE_BY_KEY.get(rule.ruleKey);
  return {
    id: rule.id,
    key: rule.ruleKey,
    title: def?.title ?? rule.ruleKey,
    description: def?.description ?? "",
    fields: def?.fields ?? [],
    version: version.version,
    config: version.config,
    summary: def
      ? def.summarize(version.config)
      : JSON.stringify(version.config),
    reason: version.reason,
    updatedAt: version.effectiveFrom,
    updatedBy: version.approvedBy?.fullName ?? null,
  };
}
// Used by Eligibility, Results, Merit and Schedule steps.
// Returns { ruleVersionId, version, config } of the newest version.
export async function getCurrentRule(db, sessionId, ruleKey) {
  const rule = await db.rule.findUnique({
    where: { sessionId_ruleKey: { sessionId, ruleKey } },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  const v = rule?.versions[0];
  if (!v)
    throw new HttpError(
      409,
      "Rule " + ruleKey + " is not set up for this session",
    );
  return { ruleVersionId: v.id, version: v.version, config: v.config };
}
export async function listRules(sessionId) {
  const session = sessionId
    ? await prisma.admissionSession.findUnique({ where: { id: sessionId } })
    : await prisma.admissionSession.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { year: "desc" },
      });
  if (!session)
    throw new HttpError(
      404,
      sessionId ? "Session not found" : "No active session",
    );
  if (session.status !== "CLOSED") {
    // creates any rule this session does not have yet (for example a newly added criterion)
    await prisma
      .$transaction((tx) => ensureRules(tx, session.id))
      .catch((e) => {
        if (e?.code !== "P2002") throw e; // another request created them
        first;
      });
  }
  const rules = await prisma.rule.findMany({
    where: { sessionId: session.id },
    include: latest,
  });
  const order = new Map(RULE_DEFINITIONS.map((d, i) => [d.key, i]));
  return {
    session: {
      id: session.id,
      name: session.name,
      year: session.year,
      status: session.status,
    },
    readOnly: session.status === "CLOSED",
    rules: rules
      .filter((r) => r.versions[0])
      .sort(
        (a, b) => (order.get(a.ruleKey) ?? 99) - (order.get(b.ruleKey) ?? 99),
      )
      .map((r) => toDto(r, r.versions[0])),
  };
}
export async function listVersions(ruleId) {
  const rule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { versions: { orderBy: { version: "desc" }, include: byAdmin } },
  });
  if (!rule) throw new HttpError(404, "Rule not found");
  const def = RULE_BY_KEY.get(rule.ruleKey);
  return {
    id: rule.id,
    title: def?.title ?? rule.ruleKey,
    versions: rule.versions.map((v) => ({
      version: v.version,
      summary: def ? def.summarize(v.config) : JSON.stringify(v.config),
      reason: v.reason,
      createdAt: v.effectiveFrom,
      by: v.approvedBy?.fullName ?? null,
    })),
  };
}
export async function createVersion(ruleId, data, actor, ip) {
  const changedByOther = new HttpError(
    409,
    "This rule was changed by someone else. Close the dialog and try again",
  );
  try {
    return await prisma.$transaction(async (tx) => {
      const rule = await tx.rule.findUnique({
        where: { id: ruleId },
        include: { session: true, ...latest },
      });
      if (!rule || !rule.versions[0])
        throw new HttpError(404, "Rule not found");
      if (rule.session.status === "CLOSED") {
        throw new HttpError(
          409,
          "This session is closed, so its rules are read-only",
        );
      }
      const def = RULE_BY_KEY.get(rule.ruleKey);
      if (!def) throw new HttpError(409, "This rule is no longer supported");
      const current = rule.versions[0];
      if (current.version !== data.baseVersion) throw changedByOther;
      const parsed = def.schema.safeParse(data.config);
      if (!parsed.success) throw new HttpError(400, firstIssue(parsed.error));
      if (isDeepStrictEqual(parsed.data, current.config)) {
        throw new HttpError(400, "Nothing changed. Enter a different value");
      }
      const created = await tx.ruleVersion.create({
        data: {
          ruleId,
          version: current.version + 1,
          config: parsed.data,
          reason: data.reason,
          approvedById: actor.id,
        },
        include: byAdmin,
      });
      await logAudit(tx, {
        userId: actor.id,
        action: "rule.update",
        entityType: "rule",
        entityId: ruleId,
        description:
          "changed " +
          def.title +
          " to " +
          def.summarize(parsed.data) +
          " (session " +
          rule.session.year +
          ")",
        metadata: {
          ruleKey: rule.ruleKey,
          from: current.config,
          to: parsed.data,
          reason: data.reason,
          version: created.version,
        },
        ipAddress: ip,
      });
      return toDto(rule, created);
    });
  } catch (e) {
    if (e?.code === "P2002") throw changedByOther; // two saves at the samemoment;
    throw e;
  }
}
