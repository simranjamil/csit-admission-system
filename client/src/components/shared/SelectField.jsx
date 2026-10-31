import { Controller } from "react-hook-form";
import MuiTextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export default function SelectField({
  name,
  control,
  label,
  options,
  multiple = false,
  rules,
  ...rest
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <MuiTextField
          {...field}
          select
          fullWidth
          label={label}
          value={field.value ?? (multiple ? [] : "")}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          slotProps={{
            select: {
              multiple,
              renderValue: multiple
                ? (selected) =>
                    selected
                      .map((v) => options.find((o) => o.value === v)?.label)
                      .join(", ")
                : undefined,
            },
          }}
          {...rest}
        >
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </MuiTextField>
      )}
    />
  );
}