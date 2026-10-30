import { Navigate } from "react-router-dom";
import { Box, Card, CardContent, Typography } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import LoginForm from "./components/LoginForm";
 
export default function LoginPage() {
  const { user, isLoading } = useAuth();
 
  if (isLoading) return <LoadingSpinner minHeight="100vh" />;
  if (user) return <Navigate to={user.redirectTo} replace />;
 
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            mb={3}
          >
            CSIT Admission System
          </Typography>
          <LoginForm />
        </CardContent>
      </Card>
    </Box>
  );
}
