import { useState } from "react";
import { Box, Button, Card, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import StatusChip from "../../../components/shared/StatusChip";
import { usePreviewResults, useRunResultImport } from "../../../hooks/useResultImports";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
export default function ResultImportForm({ session, programs, programId, onProgram, readOnly, onDone }) {
  const previewMutation = usePreviewResults();
  const importMutation = useRunResultImport();
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0); // a new key clears the chosen file in the input
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
 
  const program = programs.find((p) => p.id === programId);
 
  const reset = () => {
    setFile(null);
    setFileKey((k) => k + 1);
    setPreview(null);
    setDescription("");
    setError(null);
  };
 
  const handleProgram = (e) => {
    onProgram(Number(e.target.value));
    reset();
  };
 
  const handleFile = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setPreview(null);
    setError(null);
  };
 
  const handlePreview = async () => {
    setError(null);
    try {
      setPreview(await previewMutation.mutateAsync({ sessionId: session.id, programId, file }));
    } catch (err) {
      setPreview(null);
      setError(getErrorMessage(err));
    }
  };
 
  const canImport = preview && !preview.alreadyImported && preview.newResults + preview.dummyStudents > 0;
 
  const handleImport = async () => {
    setError(null);
    try {
      const r = await importMutation.mutateAsync({
        sessionId: session.id,
        programId,
        file,
        description: description.trim(),
      });
      onDone(r.program + ": " + r.newResults + " results and " + r.dummyStudents + " late (dummy) students imported");
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
 
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Typography fontSize={18} fontWeight={700} sx={{ mb: 0.5 }}>
        {"Import test results into " + session.name}
      </Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 2 }}>
        Choose the program, then its cheatproof CSV. One file for each program. Results already imported are skipped, never overwritten.
      </Typography>
 
      {readOnly ? (
        <Typography color="text.secondary" fontSize={14}>
          This session is closed, so it cannot receive results.
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField select size="small" label="Program" value={programId ?? ""} onChange={handleProgram} sx={{ minWidth: 180 }}>
              {programs.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.code + (p.imported ? " (imported)" : "")}
                </MenuItem>
              ))}
            </TextField>
            <Button component="label" variant="outlined" sx={{ textTransform: "none" }}>
              Choose file
              <input key={fileKey} hidden type="file" accept=".csv" onChange={handleFile} />
            </Button>
            <Typography fontSize={14}>{file ? file.name : "No file chosen"}</Typography>
            <Button
              variant="contained"
              disabled={!file || !programId || previewMutation.isPending}
              onClick={handlePreview}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Preview
            </Button>
          </Stack>
 
          {error && <ErrorMessage message={error} />}
 
          {preview && (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusChip size="small" tone="success" label={preview.newResults + " new results"} />
                <StatusChip size="small" tone="primary" label={preview.dummyStudents + " late (dummy) students"} />
                <StatusChip size="small" tone="warning" label={preview.duplicates + " already exist (skipped)"} />
                <StatusChip size="small" tone={preview.failed ? "error" : "neutral"} label={preview.failed + " wrong rows (skipped)"} />
              </Stack>
              {preview.alreadyImported && (
                <ErrorMessage message={"This file was already imported for " + (program?.code ?? "this program") + "."} />
              )}
              {preview.problems.length > 0 && (
                <Box sx={{ maxHeight: 160, overflow: "auto", bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
                  {preview.problems.map((p, i) => (
                    <Typography key={i} fontSize={13}>
                      {"Line " + p.line + ": " + p.message}
                    </Typography>
                  ))}
                </Box>
              )}
              <TextField size="small" label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  disabled={!canImport || importMutation.isPending}
                  onClick={handleImport}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Import
                </Button>
                <Button onClick={reset}>Cancel</Button>
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Card>
  );
}
