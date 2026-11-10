import { parseId } from "../../utils/parse-id.js";
import * as service from "./test-results.service.js";
 
const STATUSES = ["PASSED", "FAILED", "ABSENT", "NOT_EVALUATED"];
 
const sid = (req) => parseId(req.query.sessionId, "session id");
const filtersOf = (q) => ({
  timing: String(q.timing ?? "").trim() || null,
  program: String(q.program ?? "").trim() || null,
  status: STATUSES.includes(q.status) ? q.status : null,
});
 
export async function list(req, res, next) {
  try {
    res.json(await service.listTestResults(sid(req), filtersOf(req.query)));
  } catch (e) {
    next(e);
  }
}
 
export async function ruleVersions(req, res, next) {
  try {
    res.json(await service.listRuleVersions(sid(req)));
  } catch (e) {
    next(e);
  }
}
 
export async function preview(req, res, next) {
  try {
    res.json(await service.previewRun(req.body.sessionId, req.body.ruleVersionId));
  } catch (e) {
    next(e);
  }
}
 
export async function run(req, res, next) {
  try {
    res.json(await service.runRule(req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
 
export async function exportList(req, res, next) {
  try {
    const { filename, csv } = await service.exportCsv(sid(req), filtersOf(req.query), req.user, req.ip);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="' + filename + '"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
}
