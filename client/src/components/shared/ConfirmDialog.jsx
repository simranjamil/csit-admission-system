import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
 
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <CircularProgress size={22} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
