const DUMMY = /dummy/i;
const ROLL = /[A-Z]+-[A-Z]+-\d+/g;
 
// "CT-W-35"          -> { rolls: ["CT-W-35"] }
// "CT-E-14-CT-W-44"  -> { rolls: ["CT-E-14", "CT-W-44"] }  (one student, one test)
// "dummy-IS-09" and "CT-dummy-4" -> { dummy: "dummy-IS-09" } / { dummy: "dummy-CT-04" }
export function readName(cell) {
  const text = String(cell).trim();
  if (DUMMY.test(text)) {
    const parts = text.split("-").map((p) => p.trim()).filter((p) => p && !DUMMY.test(p));
    const code = parts.find((p) => /^[A-Za-z]+$/.test(p));
    const digits = parts.find((p) => /^\d+$/.test(p));
    if (!code || !digits) return { error: "Dummy roll should look like dummy-IS-09" };
    return {
      dummy: "dummy-" + code.toUpperCase() + "-" + digits.padStart(2, "0"),
      programCode: code.toUpperCase(),
    };
  }
  const rolls = [...new Set(text.toUpperCase().match(ROLL) ?? [])];
  if (rolls.length === 0) return { error: 'No roll number found in "' + text + '"' };
  return { rolls };
}
 
// CT-E-02 -> CT-E
export const prefixOf = (roll) => {
  const m = /^(.+)-\d+$/.exec(roll);
  return m ? m[1] : null;
};
