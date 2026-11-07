import { Controller } from "react-hook-form";
import { Autocomplete, TextField as MuiTextField } from "@mui/material";
const SUGGESTIONS = ["Evening", "Weekend"];
export default function TimingChips({ name, control, label = "Timings" }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ validate: (v) => (v && v.length > 0) || "Add at least one timing" }}
      render={({ field, fieldState }) => (
        <Autocomplete
          multiple
          freeSolo
          options={SUGGESTIONS}
          value={field.value ?? []}
          onChange={(_, value) => field.onChange(value.map((v) => v.trim()).filter(Boolean))}
          renderInput={(params) => (
            <MuiTextField
              {...params}
              label={label}
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? "Pick one, or type a new timing and press Enter"}
            />
          )}
        />    )}
    />
  );
}