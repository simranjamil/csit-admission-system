import { Button, Card, Stack, Typography } from "@mui/material";
import StatusChip from "../../../components/shared/StatusChip";
import { useSetResultsDone } from "../../../hooks/useResultImports";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
export default function ResultsDoneBar({ session, stage, hasImports, readOnly, onNotify }) {
  const mutation = useSetResultsDone();
  const done = Boolean(stage?.done);
 
  const toggle = async () => {
    try {
      await mutation.mutateAsync({ sessionId: session.id, done: !done });
      onNotify(done ? "Results reopened. You can add more files" : "Results marked as done. You can still add more files later");
    } catch (err) {
      onNotify(getErrorMessage(err), "error");
    }
  };
 
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={700}>Results status</Typography>
            <StatusChip
              size="small"
              tone={done ? "success" : hasImports ? "primary" : "neutral"}
              label={done ? "Done" : hasImports ? "In progress" : "Not started"}
            />
          </Stack>
          <Typography color="text.secondary" fontSize={13}>
            {done
              ? "Marked as done on " + new Date(stage.completedAt).toLocaleString() + ". More files can still be imported."
              : "Press Done when every program's file is in. Nothing is locked."}
          </Typography>
        </Stack>
        <Button
          variant={done ? "outlined" : "contained"}
          disabled={readOnly || mutation.isPending || (!done && !hasImports)}
          onClick={toggle}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {done ? "Reopen results" : "Mark results as done"}
        </Button>
      </Stack>
    </Card>
  );
}
