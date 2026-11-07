import { useState } from "react";
import { Alert } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useImports } from "../../hooks/useImports";
import ImportForm from "./components/ImportForm";
import ImportDoneBar from "./components/ImportDoneBar";
import ImportHistory from "./components/ImportHistory";
 
export default function ImportPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const { data, isLoading, isError } = useImports(selected?.id);
  const [toast, setToast] = useState(null);
  const batches = data?.batches ?? [];
  const notify = (message, severity = "success") => setToast({ message, severity });
 
  return (
    <PageContainer title={selected ? "Import - " + selected.name : "Import"}>
      {!selected && !sessionsLoading && <Alert severity="info">Create a session on the Setup page first.</Alert>}
      {isError && <ErrorMessage message="Could not load the import history." />}
 
      {selected && (
        <>
          <ImportDoneBar
            session={selected}
            stage={data?.stage}
            hasBatches={batches.length > 0}
            readOnly={selected.status === "CLOSED"}
            onNotify={notify}
          />
          <ImportForm session={selected} readOnly={selected.status === "CLOSED"} onDone={(m) => notify(m)} />
          <ImportHistory batches={batches} loading={isLoading} />
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
