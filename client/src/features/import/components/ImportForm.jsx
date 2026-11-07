import { useState } from "react";
import { Alert, Box, Button, Card, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import StatusChip from "../../../components/shared/StatusChip";
import { usePreviewImport, useRunImport } from "../../../hooks/useImports";
import { getErrorMessage } from "../../../utils/getErrorMessage";
 
const baseName = (name) => name.replace(/\.[^.]+$/, "");
 
export default function ImportForm({ session, readOnly, onDone }) {
  const previewMutation = usePreviewImport();
  const importMutation = useRunImport();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [description, setDescription] = useState("");
  const [again, setAgain] = useState(false);
  const [error, setError] = useState(null);
 
  const reset = () => {
    setFile(null);
    setPreview(null);
    setBatchName("");
    setDescription("");
    setAgain(false);
    setError(null);
  };
 
  const handleFile = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setAgain(false);
    setError(null);
    setBatchName(f ? baseName(f.name) : "");
  };
 
  const handlePreview = async () => {
    setError(null);
    try {
      setPreview(await previewMutation.mutateAsync({ sessionId: session.id, file }));
    } catch (err) {
      setPreview(null);
      setError(getErrorMessage(err));
    }
  };
 
  const alreadyImported = Boolean(preview?.alreadyImported);
  const needsDescription = alreadyImported && description.trim().length < 3;
  const canImport =
    preview &&
    preview.newApplications > 0 &&
    batchName.trim().length >= 3 &&
    (!alreadyImported || (again && !needsDescription));
 
  const handleImport = async () => {
    setError(null);
    try {
      const result = await importMutation.mutateAsync({
        sessionId: session.id,
        file,
        batchName: batchName.trim(),
        description: description.trim(),
        allowReimport: again,
      });
      onDone(result.rowsImported + ' applications imported as "' + result.batchName + '"');
      reset();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
 
  return (
    <Card sx={{ mb: 3, p: 2.5 }}>
      <Typography fontSize={18} fontWeight={700} sx={{ mb: 0.5 }}>
        {"Import form data into " + session.name}
      </Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 2 }}>
        Excel or CSV of the student forms. You can import more files at any time. Rows that already exist are skipped, never copied.
      </Typography>
 
      {readOnly && <Alert severity="info">This session is closed, so it cannot receive imports.</Alert>}
 
      {!readOnly && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button component="label" variant="outlined" sx={{ textTransform: "none" }}>
              Choose file
              <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
            </Button>
            <Typography fontSize={14}>{file ? file.name : "No file chosen"}</Typography>
            <Button
              variant="contained"
              disabled={!file || previewMutation.isPending}
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
                <StatusChip size="small" tone="success" label={preview.newApplications + " new applications"} />
                <StatusChip size="small" tone="primary" label={preview.newStudents + " new students"} />
                <StatusChip size="small" tone="neutral" label={preview.existingStudents + " existing students"} />
                <StatusChip size="small" tone="warning" label={preview.duplicates + " already exist (skipped)"} />
                <StatusChip size="small" tone={preview.failed ? "error" : "neutral"} label={preview.failed + " wrong rows (skipped)"} />
              </Stack>
 
              {preview.problems.length > 0 && (
                <Box sx={{ maxHeight: 160, overflow: "auto", bgcolor: "action.hover", borderRadius: 1, p: 1.5 }}>
                  {preview.problems.map((p, i) => (
                    <Typography key={i} fontSize={13}>
                      {"Line " + p.line + ": " + p.message}
                    </Typography>
                  ))}
                </Box>
              )}
 
              {alreadyImported && (
                <Alert severity="warning">
                  {'This file was already imported as "' + preview.alreadyImported.batchName + '" on ' +
                    new Date(preview.alreadyImported.createdAt).toLocaleDateString() + "."}
                  <FormControlLabel
                    sx={{ display: "block" }}
                    control={<Checkbox checked={again} onChange={(e) => setAgain(e.target.checked)} />}
                    label="Import this file again (needs a new batch name and a description)"
                  />
                </Alert>
              )}
 
              <TextField size="small" label="Batch name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
              <TextField
                size="small"
                label={alreadyImported ? "Description (required)" : "Description (optional)"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={alreadyImported && again && needsDescription}
                multiline
                minRows={2}
              />
 
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
