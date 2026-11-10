// Header names are compared in lowercase, without spaces or symbols.
// Category columns (Category 1 Name, Category 1 Obtained, ...) are read separately.
export const HEADER_ALIASES = {
  roll: ["name", "rollno", "roll"],
  studentName: ["lastname", "studentname"],
  obtained: ["obtainedmarks", "obtained"],
  total: ["totalmarks", "total"],
  duration: ["duration"],
  date: ["date"],
};
 
export const REQUIRED = ["roll", "obtained", "total"];
export const MAX_ROWS = 5000;
