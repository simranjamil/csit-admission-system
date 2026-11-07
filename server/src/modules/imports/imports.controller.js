import { parseId } from "../../utils/parse-id.js";
import * as service from "./imports.service.js";
 
export async function list(req, res, next) {
  try {
    res.json(await service.listBatches(parseId(req.query.sessionId, "session id")));
  } catch (e) {
    next(e);
  }
}
 
export async function preview(req, res, next) {
  try {
    res.json(await service.previewImport(req.body.sessionId, req.file));
  } catch (e) {
    next(e);
  }
}
 
export async function create(req, res, next) {
  try {
    res.status(201).json(await service.importFile(req.body, req.file, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
 
export async function done(req, res, next) {
  try {
    res.json(await service.setImportDone(req.body.sessionId, req.body.done, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
