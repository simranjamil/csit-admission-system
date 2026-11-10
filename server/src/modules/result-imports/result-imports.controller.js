import { parseId } from "../../utils/parse-id.js";
import * as service from "./result-imports.service.js";
  
export async function overview(req, res, next) {
  try {
    res.json(await service.getOverview(parseId(req.query.sessionId, "session id")));
  } catch (e) {
    next(e);
  }
}
 
export async function rows(req, res, next) {
  try {
    res.json(
      await service.listImported(parseId(req.query.sessionId, "session id"), parseId(req.query.programId, "program id"))
    );
  } catch (e) {
    next(e);
  }
}

 
export async function preview(req, res, next) {
  try {
    res.json(await service.previewImport(req.body.sessionId, req.body.programId, req.file));
  } catch (e) {
    next(e);
  }
}
 
export async function create(req, res, next) {
  try {
    res.status(201).json(await service.importResults(req.body, req.file, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
 
export async function done(req, res, next) {
  try {
    res.json(await service.setResultsDone(req.body.sessionId, req.body.done, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
