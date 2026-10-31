import { useLocation, Link as RouterLink } from "react-router-dom";
import { Drawer, Toolbar, List, ListItemButton, ListItemText, Box } from "@mui/material";
import useAuth from "../../hooks/useAuth";
import { TOPBAR_HEIGHT, SIDEBAR_WIDTH } from "../../utils/constants";
 
// Naya page banne par: soon: true hata dein aur routes.jsx mein route add karein.
const MENU = [
  { label: "Dashboard", to: "/admin", role: "Admin", exact: true },
  { label: "Setup", to: "/admin/setup", role: "Admin", soon: true },
  { label: "Rules", to: "/admin/rules", role: "Admin", soon: true },
  { label: "Import Students", to: "/admin/import", role: "Admin", soon: true },
  { label: "Eligibility", to: "/admin/eligibility", role: "Admin", soon: true },
  { label: "Import Results", to: "/admin/import-results", role: "Admin", soon: true },
  { label: "Late Admissions", to: "/admin/late-admissions", role: "Admin", soon: true, badge: "late" },
  { label: "Test Results", to: "/admin/results", role: "Admin", soon: true },
  { label: "Schedule", to: "/admin/schedule", role: "Admin", soon: true },
  { label: "Merit Lists", to: "/admin/merit", role: "Admin", soon: true },
  { label: "Admissions", to: "/admin/admissions", role: "Admin", soon: true },
  { label: "Corrections", to: "/admin/corrections", role: "Admin", soon: true },
  { label: "Downloads", to: "/admin/downloads", role: "Admin", soon: true },
  { label: "Users / Audit", to: "/admin/users", role: "Admin" },
  { label: "My Interviews", to: "/interviewer", permission: "interview.submit" },
];
 
export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
 
  const visible = MENU.filter(
    (item) =>
      (!item.role || user.roles.includes(item.role)) &&
      (!item.permission || user.permissions.includes(item.permission))
  );
 
  const isActive = (item) =>
    item.exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(item.to + "/");
 
  // Dashboard banne par yahan lateUnresolved ka count lagayenge.
  const badgeCount = () => 0;
 
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          bgcolor: "#ffffff",
          borderRight: "1px solid #e5e8ef",
        },
      }}
    >
      <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT, sm: TOPBAR_HEIGHT } }} />
      <List sx={{ py: 2 }}>
        {visible.map((item) => {
          const active = isActive(item);
          const count = badgeCount(item);
          const linkProps = item.soon ? {} : { component: RouterLink, to: item.to };
          return (
            <ListItemButton
              key={item.to}
              {...linkProps}
              disabled={!!item.soon}
              selected={active}
              sx={{
                px: 3,
                minHeight: 40,
                "&.Mui-disabled": { opacity: 0.55 },
                "&.Mui-selected": {
                  bgcolor: "#e8eefa",
                  color: "primary.main",
                  "&:hover": { bgcolor: "#e8eefa" },
                },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 700 : 400,
                }}
              />
              {count > 0 && (
                <Box
                  component="span"
                  sx={{
                    bgcolor: "#fdeccf",
                    color: "#8a4b08",
                    fontSize: 12,
                    minWidth: 22,
                    textAlign: "center",
                    borderRadius: 10,
                    px: 1,
                    py: 0.25,
                  }}
                >
                  {count}
                </Box>
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
