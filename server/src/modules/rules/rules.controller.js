import { parseId } from "../../utils/parse-id.js";
import * as service from "./rules.service.js";
export async function list(req, res, next) {
  try {
    const sessionId = req.query.sessionId
      ? parseId(req.query.sessionId, "session id")
      : null;
    res.json(await service.listRules(sessionId));
  } catch (e) {
    next(e);
  }
}
export async function versions(req, res, next) {
  try {
    res.json(await service.listVersions(parseId(req.params.id, "rule id")));
  } catch (e) {
    next(e);
  }
}
export async function create(req, res, next) {
  try {
    const rule = await service.createVersion(
      parseId(req.params.id, "rule id"),
      req.body,
      req.user,
      req.ip,
    );
    res.status(201).json(rule);
  } catch (e) {
    next(e);
  }
}
