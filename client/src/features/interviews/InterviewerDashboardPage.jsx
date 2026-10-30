import { Typography } from "@mui/material";
import PageContainer from "../../components/layout/PageContainer";
import useAuth from "../../hooks/useAuth";

export default function InterviewerDashboardPage() {
  const { user } = useAuth();
  return (
    <PageContainer title="My Interviews">
      <Typography color="text.secondary">
        Welcome, {user.fullName}. Aapki appointments baad ke step mein yahan aayengi.
      </Typography>
    </PageContainer>
  );
}
