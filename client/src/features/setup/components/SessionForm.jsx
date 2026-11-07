import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormDialog from "../../../components/shared/FormDialog";
import TextField from "../../../components/shared/TextField";
import SelectField from "../../../components/shared/SelectField";
import { useCreateSession, useUpdateSession } from "../../../hooks/useSessions";
import { getErrorMessage } from "../../../utils/getErrorMessage";
const EMPTY = { name: "", year: "", startDate: "", endDate: "", 
copyFromSessionId: "" };
// MUI v7: replace InputLabelProps with slotProps={{ inputLabel: { shrink: true } }}
const dateProps = { type: "date", slotProps: { inputLabel: { shrink: true } } };
export default function SessionForm({ open, session, sessions, onClose, onSaved }) {
  const isEdit = Boolean(session);
  const { control, handleSubmit, reset } = useForm({ defaultValues: EMPTY });
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const [serverError, setServerError] = useState(null);
  const latestId = sessions[0]?.id; // list is newest year first
  const latestYear = sessions[0]?.year;
  useEffect(() => {
    if (!open) return;
    setServerError(null);
    if (session) {
      reset({
        name: session.name,
        year: String(session.year),        startDate: session.startDate ?? "",
        endDate: session.endDate ?? "",
        copyFromSessionId: "",
      });
    } else {
      const year = latestYear ? latestYear + 1 : new Date().getFullYear();
      reset({
        name: "Session " + year,
        year: String(year),
        startDate: "",
        endDate: "",
        copyFromSessionId: latestId ?? "",
      });
    }
  }, [open, session, latestId, latestYear, reset]);
  const submitting = createMutation.isPending || updateMutation.isPending;
  const onSubmit = async (values) => {
    setServerError(null);
    const payload = {
      name: values.name.trim(),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: session.id, ...payload });
        onSaved("Session updated");
      } else {
        await createMutation.mutateAsync({
          ...payload,
          year: Number(values.year),
          copyFromSessionId: values.copyFromSessionId ? Number(values.copyFromSessionId) : null,
        });
        onSaved("Session created");
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };  const copyOptions = [
    { value: "", label: "Start empty (default rules)" },
    ...sessions.map((s) => ({ value: s.id, label: s.name + " (" + s.year + ")" })),
  ];
  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit session" : "New session"}
      submitLabel={isEdit ? "Save changes" : "Create session"}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        name="name"
        control={control}
        label="Name"
        rules={{ required: "Name is required", minLength: { value: 3, message: "Minimum 3 characters" } }}
      />
      <TextField
        name="year"
        control={control}
        label="Year"
        type="number"
        disabled={isEdit}
        rules={{
          required: "Year is required",
          validate: (v) => (Number(v) >= 2000 && Number(v) <= 2100) || "Enter a year from 2000 to 2100",
        }}
      />
      <TextField name="startDate" control={control} label="Start date (optional)" {...dateProps} />
      <TextField name="endDate" control={control} label="End date (optional)" {...dateProps} />
      {!isEdit && (
        <SelectField
          name="copyFromSessionId"
          control={control}          label="Copy open programs and rules from"
          options={copyOptions}
        />
      )}
    </FormDialog>
  );
}