import { Chip } from "@mui/material";
 
const TONES = {
  success: { bgcolor: "#dff3ee", color: "#0f6b5e" },
  primary: { bgcolor: "#1e4fa3", color: "#ffffff" },
  neutral: { bgcolor: "#eceef3", color: "#5b6475" },
  warning: { bgcolor: "#fdeccf", color: "#8a4b08" },
  error: { bgcolor: "#fde4e4", color: "#a12b2b" },
};
 
export default function StatusChip({ label, tone = "neutral", size = "medium" }) {
  return (
    <Chip
      label={label}
      size={size}
      sx={{ fontWeight: 500, ...(TONES[tone] || TONES.neutral) }}
    />
  );
}
