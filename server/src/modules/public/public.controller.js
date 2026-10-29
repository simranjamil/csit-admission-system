import { getPublicSummary } from "./public.service.js";

export async function summary(req, res, next) {
  try {
    res.json(await getPublicSummary());
  } catch (e) {
    next(e);
  }
}
