import { Typography } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import useAuth from "../../hooks/useAuth";


export default function AdminDashboardPage() {
  const { user } = useAuth();
  return (
    <PageContainer title="Admin Dashboard">
      <Typography color="text.secondary">
        Welcome, {user.fullName}. Dashboard cards baad ke step mein aayenge.
      </Typography>
    </PageContainer>
  );
}

