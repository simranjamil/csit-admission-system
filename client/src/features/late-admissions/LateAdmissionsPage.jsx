import { useState } from "react";
import { Alert, Stack } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useLate } from "../../hooks/useLate";
import LateList from "./components/LateList";
import ResolvePanel from "./components/ResolvePanel";
 
export default function LateAdmissionsPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const { data, isLoading, isError } = useLate(selected?.id);
  const [row, setRow] = useState(null);
  const [toast, setToast] = useState(null);
 
  const rows = data?.rows ?? [];
  const readOnly = Boolean(data?.readOnly);
 
  return (
    <PageContainer title={selected ? "Late Admissions - " + selected.name : "Late Admissions"}>
      {!selected && !sessionsLoading && <Alert severity="info">Create a session on the Setup page first.</Alert>}
      {isError && <ErrorMessage message="Could not load the late admissions." />}
      {selected && data && (
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <StatusChip size="small" tone={data.unresolved ? "warning" : "success"} label={"Unresolved dummies: " + data.unresolved} />
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
            <LateList rows={rows} loading={isLoading} selectedId={row?.applicationId} onSelect={setRow} />
            {row && (
              <ResolvePanel
                key={row.applicationId}
                session={selected}
                row={row}
                readOnly={readOnly}
                onCancel={() => setRow(null)}
                onResolved={(m) => {
                  setToast({ message: m, severity: "success" });
                  setRow(null);
                }}
              />
            )}
          </Stack>
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
