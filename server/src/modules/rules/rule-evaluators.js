// No database access here, so these are easy to test and reuse.
const hundredths = (n) => Math.round(Number(n) * 100);
const isMissing = (v) => v === null || v === undefined || v === "" ||
  Number.isNaN(Number(v));
export function isCgpaEligible(cgpa, config) {
  if (isMissing(cgpa)) return false;
  const value = hundredths(cgpa);
  const limit = hundredths(config.minCgpa);
  return config.inclusive ? value >= limit : value > limit;
}
export function cgpaReason(cgpa, config) {
  if (isMissing(cgpa)) return "CGPA missing";
  const ok = isCgpaEligible(cgpa, config);
  const op = ok ? (config.inclusive ? ">=" : ">") : config.inclusive ? "<" :
    "<=";
  return Number(cgpa).toFixed(2) + " " + op + " " +
    config.minCgpa.toFixed(2);
}
export function isTestPassed(percentage, config) {
  if (isMissing(percentage)) return false;
  const value = hundredths(percentage);
  const limit = hundredths(config.passPercentage);
  return config.inclusive ? value >= limit : value > limit;
}
export function finalMerit({ testPercentage, interviewMarks }, config) {
  const interviewPercentage = (interviewMarks / config.interviewMaxMarks) *
    100;
  const score =(testPercentage * config.testWeight + interviewPercentage * 
config.interviewWeight) / 100;
return Math.round(score * 100) / 100;
}
// Total marks 4 = CGPA. Total marks above 4 = percentage.
// Total marks below 4 or missing marks = needs review (admin dekhega).
export function checkEligibility({ obtained, total }, config) {
  if (isMissing(obtained) || isMissing(total) || Number(total) < 4) {
    return {
      eligible: false,
      needsReview: true,
      value: null,
      reason: "Marks missing or unusual",
    };
  }
  const isCgpa = Number(total) === 4;
  const value = isCgpa
    ? Number(obtained)
    : (Number(obtained) / Number(total)) * 100;
  const limit = isCgpa ? config.minCgpa : config.minPercentage;
  const eligible = config.inclusive
    ? hundredths(value) >= hundredths(limit)
    : hundredths(value) > hundredths(limit);
  const op = eligible
    ? config.inclusive ? ">=" : ">"
    : config.inclusive ? "<" : "<=";
  const unit = isCgpa ? "" : "%";
  return {
    eligible,
    needsReview: false,
    value,
    reason:
      (isCgpa ? "CGPA " : "") + value.toFixed(2) + unit + " " + op + " " +
      limit.toFixed(2) + unit,
  };
}
