import * as XLSX from "xlsx";
import { z } from "zod";
import { HttpError } from "../../utils/http-error.js";
import { HEADER_ALIASES, REQUIRED, MAX_ROWS } from "./result-columns.js";
 
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
 
// The text NULL in a cell means empty.
const clean = (v) => {
  const s = String(v ?? "").trim();
  return /^null$/i.test(s) ? "" : s;
};
 
const marks = (label) =>
  z.string().transform((v, ctx) => {
    const n = Number(v);
    if (v === "" || !Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: label + " must be a positive number" });
      return z.NEVER;
    }
    return n;
  });
 
export const rowSchema = z
  .object({
    roll: z.string().min(1, "Name (roll number) is missing"),
    studentName: z.string().max(150),
    obtained: marks("Obtained marks"),
    total: marks("Total marks"),
  })
  .superRefine((r, ctx) => {
    if (r.total === 0) {
      ctx.addIssue({ code: "custom", path: ["total"], message: "Total marks cannot be 0" });
    } else if (r.obtained > r.total) {
      ctx.addIssue({ code: "custom", path: ["obtained"], message: "Obtained marks are more than total marks" });
    }
  });
 
const numberOrNaN = (v) => (v === "" ? NaN : Number(v));
 
// 0:40:10 -> 2410
function toSeconds(v) {
  const m = /^(\d+):(\d{2}):(\d{2})$/.exec(v);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}
 
// Some files write 19/12/2025 (day/month), others 12/19/2025 (month/day).
// The first number above 12 tells which one the file uses.
function dateOrder(values) {
  for (const v of values) {
    const m = /^(\d{1,2})\/(\d{1,2})\//.exec(v);
    if (!m) continue;
    if (Number(m[1]) > 12) return "dmy";
    if (Number(m[2]) > 12) return "mdy";
  }
  return "dmy";
}


function toDate(v, order) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(v);
  if (!m) return null;
  const day = Number(order === "mdy" ? m[2] : m[1]);
  const month = Number(order === "mdy" ? m[1] : m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let hour = Number(m[4] ?? 0);
  if (m[4] && hour >= 1 && hour <= 7) hour += 12; // no AM/PM in the file, the test is in the daytime
  return new Date(Number(m[3]), month - 1, day, hour, Number(m[5] ?? 0), Number(m[6] ?? 0));
}

 
// Returns [{ line, data, categories, durationSeconds, takenAt }]
export function parseFile(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", raw: true });
  } catch {
    throw new HttpError(400, "This file could not be read");
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }) : [];
  if (raw.length === 0) throw new HttpError(400, "The file has no rows");
  if (raw.length > MAX_ROWS) throw new HttpError(400, "Maximum " + MAX_ROWS + " rows per file");
 
  const headerFor = {};
  const cats = {}; // 1 -> { name, obtained, total } (header names)
  for (const h of Object.keys(raw[0])) {
    const key = norm(h);
    const m = /^category(\d+)(name|obtained|total)$/.exec(key);
    if (m) {
      cats[m[1]] = { ...(cats[m[1]] ?? {}), [m[2]]: h };
      continue;
    }
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key) && !headerFor[field]) headerFor[field] = h;
    }
  }
  const missing = REQUIRED.filter((f) => !headerFor[f]);
  if (missing.length) throw new HttpError(400, "Missing column: " + missing.join(", "));
  const order = dateOrder(raw.map((r) => (headerFor.date ? clean(r[headerFor.date]) : "")));

 
  return raw
    .map((r, i) => {
      const data = {};
      for (const field of Object.keys(HEADER_ALIASES)) {
        data[field] = headerFor[field] ? clean(r[headerFor[field]]) : "";
      }
      const categories = [];
      for (const c of Object.values(cats)) {
        const name = c.name ? clean(r[c.name]) : "";
        const obtained = c.obtained ? numberOrNaN(clean(r[c.obtained])) : NaN;
        const total = c.total ? numberOrNaN(clean(r[c.total])) : NaN;
        if (name && Number.isFinite(obtained) && Number.isFinite(total)) {
          categories.push({ categoryName: name, obtainedMarks: obtained, totalMarks: total });
        }
      }
      return {
        line: i + 2, // line 1 is the header row
        data,
        categories,
        durationSeconds: toSeconds(data.duration),
        takenAt: toDate(data.date, order),
      };
    })
    .filter((r) => r.data.roll !== "" || r.data.obtained !== ""); // skip empty lines
}
