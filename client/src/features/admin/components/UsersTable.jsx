import { Button, Stack } from "@mui/material";
import DataTable from "../../../components/shared/DataTable";
import StatusChip from "../../../components/shared/StatusChip";
 
export default function UsersTable({
  users,
  loading,
  currentUserId,
  onEdit,
  onToggleActive,
}) {
  const columns = [
    { key: "username", header: "Username" },
    { key: "fullName", header: "Name" },
    {
      key: "roles",
      header: "Role",
      render: (u) => u.roles.map((r) => r.name).join(", "),
    },
    {
      key: "isActive",
      header: "Active",
      render: (u) => (
        <StatusChip
          size="small"
          label={u.isActive ? "Yes" : "No"}
          tone={u.isActive ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" onClick={() => onEdit(u)}>
            Edit
          </Button>
          <Button
            size="small"
            color={u.isActive ? "error" : "primary"}
            disabled={u.isActive && u.id === currentUserId}
            onClick={() => onToggleActive(u)}
          >
            {u.isActive ? "Disable" : "Enable"}
          </Button>
        </Stack>
      ),
    },
  ];
 
  return (
    <DataTable
      columns={columns}
      rows={users}
      loading={loading}
      emptyText="No users found."
    />
  );
}
