import { HttpError } from "../../utils/http-error.js";
import * as service from "./users.service.js";
 
function parseId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, "Invalid user id");
  }
  return id;
}
 
export async function list(req, res, next) {
  try {
    res.json(await service.listUsers());
  } catch (e) {
    next(e);
  }
}
 
export async function roles(req, res, next) {
  try {
    res.json(await service.listRoles());
  } catch (e) {
    next(e);
  }
}
 
export async function create(req, res, next) {
  try {
    const user = await service.createUser(req.body, req.user, req.ip);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
}
 
export async function update(req, res, next) {
  try {
    const user = await service.updateUser(parseId(req), req.body, req.user, req.ip);
    res.json(user);
  } catch (e) {
    next(e);
  }
}
 
export async function setStatus(req, res, next) {
  try {
    const user = await service.setUserActive(
      parseId(req),
      req.body.isActive,
      req.user,
      req.ip
    );
    res.json(user);
  } catch (e) {
    next(e);
  }
}
