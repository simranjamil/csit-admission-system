import { useState } from "react";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import Toast from "../../components/shared/Toast";
import { useSession } from "../../context/SessionContext";
import { usePrograms } from "../../hooks/usePrograms";
import { useSetSessionStatus } from "../../hooks/useSessions";
import { getErrorMessage } from "../../utils/getErrorMessage";
import SessionList from "./components/SessionList";
import SessionForm from "./components/SessionForm";
import ProgramList from "./components/ProgramList";
import ProgramForm from "./components/ProgramForm";
import SessionProgramsTable from "./components/SessionProgramsTable";
export default function SetupPage() {
  const { sessions, selected, selectSession, isLoading, isError } = useSession();
  const { data: programs = [], isLoading: programsLoading, isError: programsError } = usePrograms();  const setStatus = useSetSessionStatus();
  const [sessionForm, setSessionForm] = useState({ open: false, session: null });
  const [programForm, setProgramForm] = useState({ open: false, program: null });
  const [confirm, setConfirm] = useState(null); // { session, status }
  const [toast, setToast] = useState(null); // { message, severity }
  const closeSessionForm = () => setSessionForm((f) => ({ ...f, open: false }));
  const closeProgramForm = () => setProgramForm((f) => ({ ...f, open: false }));
  const notify = (message, severity = "success") => setToast({ message, severity });
  const handleConfirm = async () => {
    const { session, status } = confirm;
    try {
      await setStatus.mutateAsync({ id: session.id, status });
      notify(status === "ACTIVE" ? "Session " + session.year + " is now active" : "Session " + session.year + " closed");
    } catch (err) {
      notify(getErrorMessage(err), "error");
    } finally {
      setConfirm(null);
    }
  };
  const makingActive = confirm?.status === "ACTIVE";
  return (
    <PageContainer title="Setup">
      {(isError || programsError) && <ErrorMessage message="Could not load setup data." />}
      <SessionList
        sessions={sessions}
        loading={isLoading}
        selectedId={selected?.id}
        onNew={() => setSessionForm({ open: true, session: null })}
        onSelect={selectSession}
        onEdit={(s) => setSessionForm({ open: true, session: s })}        onStatus={(session, status) => setConfirm({ session, status })}
      />
      <ProgramList
        programs={programs}
        loading={programsLoading}
        onNew={() => setProgramForm({ open: true, program: null })}
        onEdit={(p) => setProgramForm({ open: true, program: p })}
      />
      <SessionProgramsTable session={selected} onSaved={notify} />
      <SessionForm
        open={sessionForm.open}
        session={sessionForm.session}
        sessions={sessions}
        onClose={closeSessionForm}
        onSaved={(m) => {
          closeSessionForm();
          notify(m);
        }}
      />
      <ProgramForm
        open={programForm.open}
        program={programForm.program}
        onClose={closeProgramForm}
        onSaved={(m) => {
          closeProgramForm();
          notify(m);
        }}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={makingActive ? "Make this session active?" : "Close this session?"}
        message={
          makingActive
            ? "Session " + (confirm?.session.year ?? "") + " becomes the active session. Any other active session is closed and turns read-only."
            : "Session " + (confirm?.session.year ?? "") + " becomes readonly (rules and open programs). The dashboard shows no active session until you activate one."
}
confirmLabel={makingActive ? "Make active" : "Close session"}
confirmColor={makingActive ? "primary" : "error"}
loading={setStatus.isPending}
onConfirm={handleConfirm}
onCancel={() => setConfirm(null)}
/>

<Toast
open={Boolean(toast)}
message={toast?.message ?? ""}
severity={toast?.severity ?? "success"}
onClose={() => setToast(null)}
/>
</PageContainer>
);
}