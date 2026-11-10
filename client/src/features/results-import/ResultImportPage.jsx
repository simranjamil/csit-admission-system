import { useState } from "react";
import { Alert } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useResultOverview, useResultRows } from "../../hooks/useResultImports";
import ProgramStatus from "./components/ProgramStatus";
import ResultsDoneBar from "./components/ResultsDoneBar";
import ResultImportForm from "./components/ResultImportForm";
import ResultsTable from "./components/ResultsTable";
 
export default function ResultImportPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const { data, isError } = useResultOverview(selected?.id);
  const [picked, setPicked] = useState(null);
  const [toast, setToast] = useState(null);
 
  const programs = data?.programs ?? [];
  const programId = picked ?? (programs.find((p) => !p.imported) ?? programs[0])?.id ?? null;
  const rows = useResultRows(selected?.id, programId);
 
  const notify = (message, severity = "success") => setToast({ message, severity });
  const readOnly = Boolean(data?.readOnly);
 
  return (
    <PageContainer title={selected ? "Import Results - " + selected.name : "Import Results"}>
      {!selected && !sessionsLoading && <Alert severity="info">Create a session on the Setup page first.</Alert>}
      {isError && <ErrorMessage message="Could not load the result imports." />}
      {selected && data && (
        <>
          <ResultsDoneBar
            session={selected}
            stage={data.stage}
            hasImports={data.jobs.length > 0}
            readOnly={readOnly}
            onNotify={notify}
          />
          <ProgramStatus programs={programs} unresolvedDummies={data.unresolvedDummies} />
          <ResultImportForm
            session={selected}
            programs={programs}
            programId={programId}
            onProgram={setPicked}
            readOnly={readOnly}
            onDone={(m) => notify(m)}
          />
          <ResultsTable
            data={rows.data}
            loading={rows.isLoading}
            programCode={programs.find((p) => p.id === programId)?.code}
          />
        </>
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        severity={toast?.severity ?? "success"}
        onClose={() => setToast(null)}
      />
    </PageContainer>
  );
}
