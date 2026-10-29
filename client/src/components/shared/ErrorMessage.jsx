import { Alert } from "@mui/material";

export default function ErrorMessage({ message = "Something went wrong. Please try again." }) {
  return <Alert severity="error">{message}</Alert>;
}
