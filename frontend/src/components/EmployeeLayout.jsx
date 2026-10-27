import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Activity, Award, BriefcaseBusiness, CheckSquare, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import "./employee.css";

const workspaceLinks = [
  ["Dashboard", "/employee/dashboard", LayoutDashboard],
  ["My Tasks", "/employee/my-tasks", CheckSquare],
  ["Certifications", "/employee/certifications", Award],
  ["Find People", "/find-people", Search],
  ["Employees", "/employees", Users],
  ["Skills", "/skills", Sparkles],
  ["Projects", "/projects", BriefcaseBusiness],
  ["Skill Insights", "/skill-insights", Activity],
];
const accountLinks = [["My Profile", "/profile", UserRound], ["Settings", "/settings", Settings]];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const displayName = user?.full_name || user?.username || "Employee";

  return <div className={`employee-shell${collapsed ? " employee-shell-collapsed" : ""}${mobileOpen ? " employee-shell-mobile-open" : ""}`}>
    {mobileOpen && <button className="employee-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className="employee-sidebar">
      <Link className="employee-brand" to="/employee/dashboard" onClick={() => setMobileOpen(false)}><span className="employee-brand-mark">SC</span><span className="employee-brand-copy">Skill<span>Connect</span><small>EMPLOYEE WORKSPACE</small></span></Link>
      <nav className="employee-nav" aria-label="Employee navigation">
        <section className="employee-nav-group"><h2>Workspace</h2>{workspaceLinks.map(([label, path, Icon]) => <NavLink key={path} to={path} end className={({ isActive }) => `employee-nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)} title={label}><Icon size={18}/><span>{label}</span></NavLink>)}</section>
        <section className="employee-nav-group"><h2>Account</h2>{accountLinks.map(([label, path, Icon]) => <NavLink key={path} to={path} end className={({ isActive }) => `employee-nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)} title={label}><Icon size={18}/><span>{label}</span></NavLink>)}</section>
      </nav>
      <div className="employee-sidebar-foot">{user?.role === "admin" ? <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}><ShieldCheck size={16}/><span>Admin workspace</span></Link> : <span><Sparkles size={16}/><span>Connect people with skills</span></span>}</div>
    </aside>
    <main className="employee-main">
      <header className="employee-topbar">
        <button className="employee-icon-button employee-mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19}/></button>
        <button className="employee-icon-button employee-collapse-button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((value) => !value)}><Menu size={19}/></button>
        <div className="employee-topbar-brand"><span>SKILLCONNECT</span><strong>Employee workspace</strong></div>
        <div className="employee-user"><span className="employee-user-name">{displayName}<small>{user?.email || "Employee account"}</small></span><span className="employee-user-avatar">{displayName.slice(0,1).toUpperCase()}</span><button className="employee-logout" onClick={logout}><LogOut size={15}/><span>Log out</span></button></div>
      </header>
      <div className="employee-content"><Outlet/></div>
    </main>
  </div>;
}
