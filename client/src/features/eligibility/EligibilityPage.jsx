import { useState } from "react";
import { Alert } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { useEligibility } from "../../hooks/useEligibility";
import { downloadEligibility } from "../../api/eligibilityApi";
import RuleApplyCard from "./components/RuleApplyCard";
import EligibilityTable from "./components/EligibilityTable";

const EMPTY = { timing: "", program: "", status: "" };
const clean = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

export default function EligibilityPage() {
  const { selected, isLoading: sessionsLoading } = useSession();
  const [filters, setFilters] = useState(EMPTY);
  const { data, isLoading, isError } = useEligibility(
    selected?.id,
    clean(filters),
  );
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const notify = (message, severity = "success") =>
    setToast({ message, severity });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadEligibility({
        sessionId: selected.id,
        ...clean(filters),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const part = (s) =>
        s ? "-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
      link.download =
        "eligibility-" +
        selected.year +
        part(filters.program) +
        part(filters.timing) +
        part(filters.status) +
        ".csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify("Could not download the list", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageContainer
      title={selected ? "Eligibility - " + selected.name : "Eligibility"}
    >
      {!selected && !sessionsLoading && (
        <Alert severity="info">Create a session on the Setup page first.</Alert>
      )}
      {isError && <ErrorMessage message="Could not load the students." />}

      {selected && (
        <>
          <RuleApplyCard
            session={selected}
            readOnly={selected.status === "CLOSED"}
            onNotify={notify}
          />
          <EligibilityTable
            data={data}
            loading={isLoading}
            filters={filters}
            onFilters={setFilters}
            onDownload={handleDownload}
            downloading={downloading}
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
