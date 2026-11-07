import { parseId } from "../../utils/parse-id.js";
import * as service from "./sessions.service.js";
const sid = (req) => parseId(req.params.id, "session id");
export async function list(req, res, next) {
  try {
    res.json(await service.listSessions());
  } catch (e) {
    next(e);
  }
}
export async function create(req, res, next) {
  try {
    res
      .status(201)
      .json(await service.createSession(req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    res.json(await service.updateSession(sid(req), req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
export async function setStatus(req, res, next) {
  try {
    res.json(
      await service.setSessionStatus(
        sid(req),
        req.body.status,
        req.user,
        req.ip,
      ),
    );
  } catch (e) {
    next(e);
  }
}
export async function getOptions(req, res, next) {
  try {
    res.json(await service.getOptions(sid(req)));
  } catch (e) {
    next(e);
  }
}
export async function saveOptions(req, res, next) {
  try {
    res.json(await service.saveOptions(sid(req), req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
