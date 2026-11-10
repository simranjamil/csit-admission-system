import { parseId } from "../../utils/parse-id.js";
import * as service from "./late-admissions.service.js";
 
export async function list(req, res, next) {
  try {
    res.json(await service.listLate(parseId(req.query.sessionId, "session id")));
  } catch (e) {
    next(e);
  }
}
 
export async function match(req, res, next) {
  try {
    res.json({ match: await service.findMatch(parseId(req.query.sessionId, "session id"), req.query.cnic) });
  } catch (e) {
    next(e);
  }
}
 
export async function resolve(req, res, next) {
  try {
    res.json(await service.resolveLate(parseId(req.params.applicationId, "application id"), req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
