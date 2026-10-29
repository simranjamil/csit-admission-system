import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Box,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import usePublicSummary from "../../hooks/usePublicSummary";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import ProgramsCard from "./components/ProgramsCard";

export default function LandingPage() {
  const { data, isLoading, isError } = usePublicSummary();
  const session = data?.session;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            CSIT Admissions {session ? session.year : ""}
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<LoginIcon />}
            component={RouterLink}
            to="/login"
          >
            Staff Login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box textAlign="center" mb={5}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Department of Computer Science & Information Technology
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Master's Admissions Portal
            {session ? ` · ${session.name}` : ""}
          </Typography>
        </Box>

        {isLoading && <LoadingSpinner />}
        {isError && (
          <ErrorMessage message="Could not load admission information." />
        )}

        {data && !session && (
          <ErrorMessage message="No admission session is currently active." />
        )}

        {session && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <ProgramsCard programs={data.programs} />
            </Grid>
          </Grid>
        )}
      </Container>

      <Box
        component="footer"
        sx={{ textAlign: "center", py: 3, color: "text.secondary" }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} CSIT Department
        </Typography>
      </Box>
    </Box>
  );
}
