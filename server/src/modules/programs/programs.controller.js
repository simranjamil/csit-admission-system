import { parseId } from "../../utils/parse-id.js";
import * as service from "./programs.service.js";
export async function list(req, res, next) {
  try {
    res.json(await service.listPrograms());
  } catch (e) {
    next(e);
  }
}
export async function create(req, res, next) {
  try {
    res
      .status(201)
      .json(await service.createProgram(req.body, req.user, req.ip));
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    res.json(
      await service.updateProgram(
        parseId(req.params.id, "program id"),
        req.body,
        req.user,
        req.ip,
      ),
    );
  } catch (e) {
    next(e);
  }
}
