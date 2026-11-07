import { RULE_DEFINITIONS } from "./rule-definitions.js";
// copyFromSessionId: use the latest saved value of that session instead of the defaults.
export async function ensureRules(db, sessionId, { actorId = null, 
copyFromSessionId = null } = {}) {
  const have = await db.rule.findMany({ where: { sessionId }, select: { 
ruleKey: true } });
  const haveKeys = new Set(have.map((r) => r.ruleKey));
  const source = new Map();
  if (copyFromSessionId) {
    const rows = await db.rule.findMany({
      where: { sessionId: copyFromSessionId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    for (const r of rows) {
      if (r.versions[0]) source.set(r.ruleKey, r.versions[0].config);
    }
  }
  let created = 0;
  for (const def of RULE_DEFINITIONS) {
    if (haveKeys.has(def.key)) continue;
    const copied = source.get(def.key);
    const usable = copied !== undefined && 
def.schema.safeParse(copied).success;
    await db.rule.create({
      data: {
        sessionId,
        ruleKey: def.key,
        versions: {
          create: {
            version: 1,
            config: usable ? copied : def.defaults,
            reason: usable ? "Copied from the previous session" : "Default value",
            approvedById: actorId,
          },
        },
      },
    });
    created += 1;
  }
  return created;
}