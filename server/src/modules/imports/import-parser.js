import * as XLSX from "xlsx";
import { z } from "zod";
import { HttpError } from "../../utils/http-error.js";
import { HEADER_ALIASES, REQUIRED, MAX_ROWS } from "./import-columns.js";
 
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
 
// The text NULL in a cell means empty.
const clean = (v) => {
  const s = String(v ?? "").trim();
  return /^null$/i.test(s) ? "" : s;
};
 
const marks = (label) =>
  z.string().transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: label + " must be a positive number" });
      return z.NEVER;
    }
    return n;
  });
 
export const rowSchema = z
  .object({
    rollNo: z.string().min(1, "Roll number is missing").max(30).transform((v) => v.toUpperCase()),
    name: z.string().min(2, "Name is too short").max(100),
    cnic: z.string().transform((v, ctx) => {
      const digits = v.replace(/\D/g, "");
      if (v !== "" && digits.length !== 13) {
        ctx.addIssue({ code: "custom", message: "CNIC must have 13 digits" });
        return z.NEVER;
      }
      return digits;
    }),
    passport: z.string().max(30),
    fatherName: z.string().max(100),
    gender: z.string().max(10),
    mobile: z.string().max(30),
    email: z
      .string()
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "Invalid email"),
    formNo: z.string().max(20),
    studentId: z.string().max(30),
    uniName: z.string().max(150),
    degreeTitle: z.string().max(150),
    timing: z.string().max(20),
    passingYear: z.string().transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1950 || n > 2100) {
        ctx.addIssue({ code: "custom", message: "Passing year is not valid" });
        return z.NEVER;
      }
      return n;
    }),
    obtained: marks("Obtained marks"),
    total: marks("Total marks"),
  })
  .superRefine((r, ctx) => {
    if (!r.cnic && !r.passport) {
      ctx.addIssue({ code: "custom", path: ["cnic"], message: "CNIC or passport is missing" });
    }
    if (r.obtained !== null && r.total !== null && r.obtained > r.total) {
      ctx.addIssue({ code: "custom", path: ["obtained"], message: "Obtained marks are more than total marks" });
    }
  });
 
// Returns [{ line, data, extra }]. data has our field names, extra has every other column.
export function parseFile(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new HttpError(400, "This file could not be read");
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }) : [];
  if (raw.length === 0) throw new HttpError(400, "The file has no rows");
  if (raw.length > MAX_ROWS) throw new HttpError(400, "Maximum " + MAX_ROWS + " rows per file");
 
  const headers = Object.keys(raw[0]);
  const headerFor = {};
  for (const header of headers) {
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(norm(header)) && !headerFor[field]) headerFor[field] = header;
    }
  }
  const missing = REQUIRED.filter((f) => !headerFor[f]);
  if (!headerFor.cnic && !headerFor.passport) missing.push("cnic or passport");
  if (missing.length) throw new HttpError(400, "Missing column: " + missing.join(", "));
 
  const mapped = new Set(Object.values(headerFor));
  const extraHeaders = headers.filter((h) => !mapped.has(h));
 
  return raw.map((r, i) => {
    const data = {};
    for (const field of Object.keys(HEADER_ALIASES)) {
      data[field] = headerFor[field] ? clean(r[headerFor[field]]) : "";
    }
    const extra = {};
    for (const h of extraHeaders) {
      const v = clean(r[h]);
      if (v !== "") extra[h] = v;
    }
    return { line: i + 2, data, extra }; // line 1 is the header row
  });
}
