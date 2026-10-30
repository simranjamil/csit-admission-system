import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Stack, CircularProgress } from "@mui/material";
import TextField from "../../../components/shared/TextField";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import Toast from "../../../components/shared/Toast";
import useAuth from "../../../hooks/useAuth";
 
export default function LoginForm() {
  const { login } = useAuth();
  const { control, handleSubmit } = useForm({
    defaultValues: { username: "", password: "" },
  });
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
 
  const onSubmit = async (values) => {
    setWrongCredentials(false);
    setSubmitting(true);
    try {
      await login(values); // LoginPage redirects once the user is set
    } catch (err) {
      if (err.response?.status === 401) {
        setWrongCredentials(true);
      } else {
        setToastMessage(
          err.response?.data?.message || "Server not reachable. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            name="username"
            control={control}
            label="Username"
            autoComplete="username"
            autoFocus
            rules={{ required: "Username is required" }}
          />
          <TextField
            name="password"
            control={control}
            label="Password"
            type="password"
            autoComplete="current-password"
            rules={{ required: "Password is required" }}
          />
 
          {wrongCredentials && <ErrorMessage message="Wrong username or password" />}
 
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </Stack>
      </form>
 
      <Toast
        open={!!toastMessage}
        message={toastMessage ?? ""}
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}
