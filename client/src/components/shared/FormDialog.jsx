import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import ErrorMessage from "./ErrorMessage";
 
export default function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  submitting = false,
  error = null,
  children,
}) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <ErrorMessage message={error} />}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={22} /> : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
