import { useState } from "react";
import { Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import { useLateMatch, useResolveLate } from "../../../hooks/useLate";
import { getErrorMessage } from "../../../utils/getErrorMessage";


const EMPTY = {
  name: "", fatherName: "", gender: "", cnic: "", passport: "", mobile: "", email: "",
  formNo: "", externalStudentId: "", uniName: "", degreeTitle: "", passingYear: "",
  obtainedMarks: "", totalMarks: "", realRollNo: "",
};


export default function ResolvePanel({ session, row, readOnly, onResolved, onCancel }) {
  const mutation = useResolveLate();
  const [f, setF] = useState(EMPTY);
  const [picked, setPicked] = useState(null); // null = follow the match, "new" = new student
  const [error, setError] = useState(null);
  const { data: match } = useLateMatch(session.id, f.cnic);


  const set = (key) => (e) => setF((old) => ({ ...old, [key]: e.target.value }));
  const sameAs = picked ?? (match ? String(match.id) : "new");
  const existing = sameAs !== "new";


  const digits = f.cnic.replace(/\D/g, "");
  const obtained = Number(f.obtainedMarks);
  const total = Number(f.totalMarks);
  const marksOk =
    f.obtainedMarks !== "" && f.totalMarks !== "" && obtained >= 0 && total > 0 && obtained <= total;
  const cnicOk = f.cnic === "" || digits.length === 13;
  const idOk = digits.length === 13 || f.passport.trim().length >= 5;
  const canResolve =
    !readOnly &&
    f.realRollNo.trim().length >= 3 &&
    marksOk &&
    cnicOk &&
    (existing || (f.name.trim().length >= 2 && idOk));


  const handleResolve = async () => {
    setError(null);
    try {
      const r = await mutation.mutateAsync({
        applicationId: row.applicationId,
        name: f.name.trim(),
        fatherName: f.fatherName.trim(),
        gender: f.gender,
        cnic: f.cnic,
        passport: f.passport.trim(),
        mobile: f.mobile.trim(),
        email: f.email.trim(),
        formNo: f.formNo.trim(),
        externalStudentId: f.externalStudentId.trim(),
        uniName: f.uniName.trim(),
        degreeTitle: f.degreeTitle.trim(),
        passingYear: f.passingYear === "" ? null : Number(f.passingYear),
        obtainedMarks: obtained,
        totalMarks: total,
        realRollNo: f.realRollNo.trim(),
        existingStudentId: existing ? Number(sameAs) : null,
      });
      onResolved(r.dummyRoll + " is now " + r.realRollNo + (r.linkedToExisting ? " (linked to an existing student)" : ""));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };


  const field = (key, label, extra = {}) => (
    <TextField size="small" label={label} value={f[key]} onChange={set(key)} {...extra} />
  );


  return (
    <Card sx={{ flex: 1.2, p: 3, alignSelf: "flex-start" }}>
      <Typography fontSize={20} fontWeight={700} sx={{ mb: 2 }}>
        {"Resolve: " + row.dummyRoll}
      </Typography>
      <Stack spacing={2}>
        <Typography fontWeight={700} fontSize={15}>Student</Typography>
        {field("cnic", "CNIC", { placeholder: "42101-1234567-8" })}
        <TextField
          select
          size="small"
          label="Same student as (if already in system)"
          value={sameAs}
          onChange={(e) => setPicked(e.target.value)}
        >
          <MenuItem value="new">New student</MenuItem>
          {match && (
            <MenuItem value={String(match.id)}>
              {match.name + (match.rolls.length ? " (" + match.rolls.join(", ") + ")" : "")}
            </MenuItem>
          )}
        </TextField>
        {existing && (
          <Typography color="text.secondary" fontSize={13}>
            This student is already in the system, so the details below are not changed.
          </Typography>
        )}
        {field("name", "Full name", { disabled: existing })}
        {field("fatherName", "Father name", { disabled: existing })}
        <TextField
          select
          size="small"
          label="Gender"
          value={f.gender}
          onChange={set("gender")}
          disabled={existing}
        >
          <MenuItem value="">Not given</MenuItem>
          <MenuItem value="M">Male</MenuItem>
          <MenuItem value="F">Female</MenuItem>
        </TextField>
        {field("passport", "Passport (if no CNIC)", { disabled: existing })}
        {field("mobile", "Mobile", { disabled: existing, placeholder: "03001234567" })}
        {field("email", "Email", { disabled: existing })}


        <Typography fontWeight={700} fontSize={15}>Form, degree and marks</Typography>
        {field("formNo", "Form no")}
        {field("externalStudentId", "Student ID (from the form)")}
        {field("uniName", "University")}
        {field("degreeTitle", "Degree title")}
        {field("passingYear", "Passing year", { type: "number" })}
        {field("obtainedMarks", "Obtained marks (CGPA or marks)", { type: "number" })}
        {field("totalMarks", "Total marks (4 for CGPA, or 100, 1000 ...)", { type: "number" })}


        <Typography fontWeight={700} fontSize={15}>Roll</Typography>
        {field("realRollNo", "Real roll no", { placeholder: "IS-E-31" })}


        {error && <ErrorMessage message={error} />}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!canResolve || mutation.isPending}
            onClick={handleResolve}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Resolve
          </Button>
        </Stack>
        <Typography color="text.secondary" fontSize={13}>
          Test marks and attempts stay as they are. Program and timing come from the real roll prefix.
        </Typography>
      </Stack>
    </Card>
  );
}
