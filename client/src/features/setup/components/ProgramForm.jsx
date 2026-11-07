import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormControlLabel, Switch } from "@mui/material";
import FormDialog from "../../../components/shared/FormDialog";
import TextField from "../../../components/shared/TextField";
import TimingChips from "./TimingChips";
import { useCreateProgram, useUpdateProgram } from 
"../../../hooks/usePrograms";
import { getErrorMessage } from "../../../utils/getErrorMessage";
const EMPTY = { code: "", name: "", timings: ["Evening", "Weekend"], 
isActive: true };
export default function ProgramForm({ open, program, onClose, onSaved }) {
  const isEdit = Boolean(program);
  const { control, handleSubmit, reset } = useForm({ defaultValues: EMPTY });
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const [serverError, setServerError] = useState(null);
  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset(
      program
        ? {
            code: program.code,
            name: program.name,
            timings: program.timings.filter((t) => t.isActive).map((t) => t.timing),
            isActive: program.isActive,
          }
        : EMPTY
    );
  }, [open, program, reset]);const submitting = createMutation.isPending || updateMutation.isPending;
  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: program.id,
          name: values.name.trim(),
          isActive: values.isActive,
          timings: values.timings,
        });
        onSaved("Program updated");
      } else {
        await createMutation.mutateAsync({
          code: values.code.trim(),
          name: values.name.trim(),
          timings: values.timings,
        });
        onSaved("Program created");
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };
  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit program" : "New program"}
      submitLabel={isEdit ? "Save changes" : "Create program"}
      submitting={submitting}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        name="code"
        control={control}
        label="Code (for example CT)"
        disabled={isEdit}
        autoComplete="off"
        rules={{          required: "Code is required",
          pattern: { value: /^[A-Za-z0-9]{1,10}$/, message: "1 to 10 letters or numbers" },
        }}
      />
      <TextField
        name="name"
        control={control}
        label="Program name"
        rules={{ required: "Name is required", minLength: { value: 3, message: "Minimum 3 characters" } }}
      />
      <TimingChips name="timings" control={control} />
      {isEdit && (
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
              label="Program is active"
            />
          )}
        />
      )}
    </FormDialog>
  );
}