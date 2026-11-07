import { createContext, useContext, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useSessions } from "../hooks/useSessions";
const SessionContext = createContext(null);
const STORAGE_KEY = "csit.sessionId";
function readStored() {
  try {
    const v = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}
export function SessionProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user.roles.includes("Admin");
  const {
    data: sessions = [],
    isLoading,
    isError,
  } = useSessions({ enabled: isAdmin });
  const [storedId, setStoredId] = useState(readStored);
  const selected = useMemo(
    () =>
      sessions.find((s) => s.id === storedId) ??
      sessions.find((s) => s.status === "ACTIVE") ??
      sessions[0] ??
      null,
    [sessions, storedId],
  );
  const selectSession = (id) => {
    setStoredId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* private mode: the choice just is not remembered */
    }
  };
  const value = useMemo(
    () => ({ sessions, selected, selectSession, isLoading, isError }),
    [sessions, selected, isLoading, isError],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
