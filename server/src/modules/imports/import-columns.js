// Header names are compared in lowercase, without spaces or symbols.
// Any column not listed here is saved in applications.extra_data.
export const HEADER_ALIASES = {
  formNo: ["formno", "formnumber"],
  rollNo: ["adrollno", "rollno", "rollnumber"],
  cnic: ["cnic", "cnicno", "nic"],
  passport: ["passport", "passportno"],
  name: ["studentname", "name", "fullname"],
  fatherName: ["fathername"],
  mobile: ["mobileno", "mobile", "phone"],
  email: ["email", "emailaddress"],
  gender: ["gender"],
  timing: ["program", "programme", "timing", "shift"],
  passingYear: ["passingyear"],
  obtained: ["obtainmarks", "obtainedmarks"],
  total: ["totalmarks"],
  uniName: ["uniname", "university"],
  degreeTitle: ["degreetitle", "degree"],
  studentId: ["studentid"],
};

// cnic or passport: at least one of the two columns must exist (checked in the parser)
export const REQUIRED = ["rollNo", "name"];
export const MAX_ROWS = 5000;
