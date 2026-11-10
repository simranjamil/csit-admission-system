import { useState } from "react";
import { Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import StatusChip from "../../../components/shared/StatusChip";
import { useTestResultRuleVersions, usePreviewTestResults, useRunTestResults } from "../../../hooks/useTestResults";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
export default function RulePassCard({ session, readOnly, onNotify }) {
  const { data: versions = [], isError, error: loadError } = useTestResultRuleVersions(session.id);
  const previewMutation = usePreviewTestResults();
  const runMutation = useRunTestResults();
  const [picked, setPicked] = useState("");
  const [result, setResult] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState(null);
 
  // default choice: the current (newest) version
  const ruleVersionId = picked || versions.find((v) => v.isCurrent)?.id || "";
  const chosen = versions.find((v) => v.id === ruleVersionId);
  const payload = { sessionId: session.id, ruleVersionId: Number(ruleVersionId) };
 
  const handlePick = (e) => {
    setPicked(e.target.value);
    setResult(null);
    setError(null);
  };
 
  const handlePreview = async () => {
    setError(null);
    try {
      setResult(await previewMutation.mutateAsync(payload));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
 
  const handleApply = async () => {
    try {
      const done = await runMutation.mutateAsync(payload);
      onNotify(done.passed + " passed, " + done.failed + " failed (rule v" + done.version + ")");
      setResult(null);
    } catch (err) {
      onNotify(getErrorMessage(err), "error");
    } finally {
      setConfirm(false);
    }
  };
 
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Typography fontSize={18} fontWeight={700} sx={{ mb: 0.5 }}>
        Apply pass rule
      </Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 2 }}>
        Choose which Test pass rule decides who passed. Rules are edited on the Rules page. Applying again with another rule replaces the saved results.
      </Typography>
      {isError && <ErrorMessage message={getErrorMessage(loadError)} />}
      {error && <ErrorMessage message={error} />}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
        <TextField select size="small" label="Rule to apply" value={ruleVersionId} onChange={handlePick} sx={{ minWidth: 360 }}>
          {versions.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {"v" + v.version + " - " + v.summary + (v.isCurrent ? " (current)" : "")}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          disabled={!ruleVersionId || previewMutation.isPending}
          onClick={handlePreview}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Preview
        </Button>
        <Button
          variant="contained"
          disabled={readOnly || !result || runMutation.isPending}
          onClick={() => setConfirm(true)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Apply
        </Button>
      </Stack>
      {readOnly && (
        <Typography color="text.secondary" fontSize={13} sx={{ mt: 1.5 }}>
          This session is closed, so a rule cannot be applied.
        </Typography>
      )}
      {result && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <StatusChip size="small" tone="success" label={result.passed + " would pass"} />
          <StatusChip size="small" tone="error" label={result.failed + " would fail"} />
          <StatusChip size="small" tone="neutral" label={result.notEvaluated + " not evaluated yet"} />
          <StatusChip size="small" tone="warning" label={result.changed + " would change from the saved result"} />
        </Stack>
      )}
      <ConfirmDialog
        open={confirm}
        title="Apply this rule?"
        message={
          "Every imported result of " + session.name + " is checked with " + (chosen?.summary ?? "") +
          ". The saved Passed and Failed results are replaced by the new ones."
        }
        confirmLabel="Apply rule"
        confirmColor="primary"
        loading={runMutation.isPending}
        onConfirm={handleApply}
        onCancel={() => setConfirm(false)}
      />
    </Card>
  );
}
