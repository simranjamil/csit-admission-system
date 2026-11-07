import { Button, Card, Stack, Typography } from "@mui/material";
import StatusChip from "../../../components/shared/StatusChip";
import { useSetImportDone } from "../../../hooks/useImports";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
export default function ImportDoneBar({ session, stage, hasBatches, readOnly, onNotify }) {
  const mutation = useSetImportDone();
  const done = Boolean(stage?.done);
 
  const toggle = async () => {
    try {
      await mutation.mutateAsync({ sessionId: session.id, done: !done });
      onNotify(done ? "Import reopened. You can add more files" : "Import marked as done. You can still add more files later");
    } catch (err) {
      onNotify(getErrorMessage(err), "error");
    }
  };
 
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={700}>Import status</Typography>
            <StatusChip
              size="small"
              tone={done ? "success" : hasBatches ? "primary" : "neutral"}
              label={done ? "Done" : hasBatches ? "In progress" : "Not started"}
            />
          </Stack>
          <Typography color="text.secondary" fontSize={13}>
            {done
              ? "Marked as done on " + new Date(stage.completedAt).toLocaleString() + ". More files can still be imported."
              : "Press Done when all forms are in. Nothing is locked, so late forms can still be imported."}
          </Typography>
        </Stack>
        <Button
          variant={done ? "outlined" : "contained"}
          disabled={readOnly || mutation.isPending || (!done && !hasBatches)}
          onClick={toggle}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {done ? "Reopen import" : "Mark import as done"}
        </Button>
      </Stack>
    </Card>
  );
}
