import { useState } from "react";
import { Button, Card } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import ErrorMessage from "../../components/shared/ErrorMessage";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import Toast from "../../components/shared/Toast";
import useAuth from "../../hooks/useAuth";
import { useUsers, useRoles, useSetUserActive } from "../../hooks/useUsers";
import { getErrorMessage } from "../../utils/getErrorMessage";
import UsersTable from "./components/UsersTable";
import UserForm from "./components/UserForm";
 
export default function UserManagementPage() {
  const { user: me } = useAuth();
  const { data: users = [], isLoading, isError } = useUsers();
  const { data: roles = [] } = useRoles();
  const setActive = useSetUserActive();
 
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toast, setToast] = useState(null); // { message, severity }
 
  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };
 
  const openEdit = (u) => {
    setEditingUser(u);
    setFormOpen(true);
  };
 
  const handleSaved = (message) => {
    setFormOpen(false);
    setToast({ message, severity: "success" });
  };
 
  const handleConfirm = async () => {
    const target = confirmUser;
    try {
      await setActive.mutateAsync({ id: target.id, isActive: !target.isActive });
      setToast({
        message: target.isActive ? "User disabled" : "User enabled",
        severity: "success",
      });
    } catch (err) {
      setToast({ message: getErrorMessage(err), severity: "error" });
    } finally {
      setConfirmUser(null);
    }
  };
 
  return (
    <PageContainer
      title="Users"
      actions={
        <Button
          variant="contained"
          onClick={openCreate}
          sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
        >
          + New user
        </Button>
      }
    >
      {isError && <ErrorMessage message="Could not load users." />}
 
      {!isError && (
        <Card>
          <UsersTable
            users={users}
            loading={isLoading}
            currentUserId={me.id}
            onEdit={openEdit}
            onToggleActive={setConfirmUser}
          />
        </Card>
      )}
 
      <UserForm
        open={formOpen}
        user={editingUser}
        roles={roles}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
 
      <ConfirmDialog
        open={Boolean(confirmUser)}
        title={confirmUser?.isActive ? "Disable user?" : "Enable user?"}
        message={
          confirmUser?.isActive
            ? (confirmUser?.fullName ?? "") + " will not be able to log in until enabled again."
            : (confirmUser?.fullName ?? "") + " will be able to log in again."
        }
        confirmLabel={confirmUser?.isActive ? "Disable" : "Enable"}
        confirmColor={confirmUser?.isActive ? "error" : "primary"}
        loading={setActive.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmUser(null)}
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
