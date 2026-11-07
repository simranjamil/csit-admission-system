import { HttpError } from "./http-error.js";


export function parseId(value, label = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, "Invalid " + label);
  }
  return id;
}
