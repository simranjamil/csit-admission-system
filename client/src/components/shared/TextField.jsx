import { Controller } from "react-hook-form";
import MuiTextField from "@mui/material/TextField";
 
export default function TextField({
  name,
  control,
  label,
  type = "text",
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
          label={label}
          type={type}
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}
