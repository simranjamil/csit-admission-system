import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import FormDialog from "../../../components/shared/FormDialog";
import TextField from "../../../components/shared/TextField";
import { useCreateRuleVersion } from "../../../hooks/useRules";
import { getErrorMessage } from "../../../utils/getErrorMessage";
function initialValues(rule) {
  const values = { reason: "" };
  for (const f of rule.fields) {
    values[f.name] =
      f.type === "boolean"
        ? Boolean(rule.config[f.name])
        : String(rule.config[f.name]);
  }
  return values;
}
export default function RuleEditDialog({ rule, onClose, onSaved }) {
  const { control, handleSubmit } = useForm({
    defaultValues: initialValues(rule),
  });
  const mutation = useCreateRuleVersion();
  const [serverError, setServerError] = useState(null);
  const onSubmit = async (values) => {
    setServerError(null);
    const config = {};
    for (const f of rule.fields) {
      config[f.name] =
        f.type === "boolean" ? Boolean(values[f.name]) : Number(values[f.name]);
    }
    try {
      await mutation.mutateAsync({
        ruleId: rule.id,
        baseVersion: rule.version,
        config,
        reason: values.reason.trim(),
      });
      onSaved(rule.title + " saved as version " + (rule.version + 1));
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };
  return (
    <FormDialog
      open
      title={"Edit: " + rule.title}
      submitLabel="Save new version"
      submitting={mutation.isPending}
      error={serverError}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Typography color="text.secondary" fontSize={13}>
        {"Saving creates version " +
          (rule.version + 1) +
          ". Results that were already calculated keep the version they used."}
      </Typography>
      {rule.fields.map((f) =>
        f.type === "boolean" ? (
          <Controller
            key={f.name}
            name={f.name}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={f.label}
              />
            )}
          />
        ) : (
          <TextField
            key={f.name}
            name={f.name}
            control={control}
            label={f.label}
            type="number"
            inputProps={{ min: f.min, max: f.max, step: f.step }}
            rules={{
              required: "Required",
              validate: (v) => {
                const n = Number(v);
                if (Number.isNaN(n)) return "Enter a number";
                if (n < f.min || n > f.max)
                  return "Enter a value from " + f.min + " to " + f.max;
                return true;
              },
            }}
          />
        ),
      )}
      <TextField
        name="reason"
        control={control}
        label="Reason for the change"
        rules={{
          required: "Reason is required",
          minLength: { value: 3, message: "Minimum 3 characters" },
        }}
      />
    </FormDialog>
  );
}
