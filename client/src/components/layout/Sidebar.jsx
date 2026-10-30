import { useLocation, Link as RouterLink } from "react-router-dom";
import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventNoteIcon from "@mui/icons-material/EventNote";
import useAuth from "../../hooks/useAuth";


const WIDTH = 240;


// Har naya page banne par yahan ek item add karein.
const MENU = [
  { label: "Dashboard", to: "/admin", icon: <DashboardIcon />, role: "Admin", exact: true },
  { label: "My Interviews", to: "/interviewer", role: "Interviewer",  icon: <EventNoteIcon />, permission: "interview.submit" },
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
      : pathname === item.to || pathname.startsWith(`${item.to}/`);


  return (
    <Drawer
      variant="permanent"
      sx={{
        width: WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: WIDTH, boxSizing: "border-box" },
      }}
    >
      <Toolbar />
      <List sx={{ p: 1 }}>
        {visible.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={isActive(item)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
