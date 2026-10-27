import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Award, BriefcaseBusiness, Compass, LayoutDashboard, Menu, Settings, ShieldCheck, UserRound, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import "./admin.css";

const groups = [
  { title: "Overview", links: [["Organization overview", "/admin/dashboard", LayoutDashboard]] },
  { title: "Discover & Manage", links: [["Unified discovery", "/admin/discover", Compass]] },
  { title: "Projects & Tasks", links: [["Projects and assignments", "/admin/projects-tasks", BriefcaseBusiness]] },
  { title: "Certifications", links: [["Reviews and credentials", "/admin/certifications", Award]] },
  { title: "Reports & Insights", links: [["Workforce reports", "/admin/insights", Activity]] },
  { title: "Access & Settings", links: [["Accounts and roles", "/admin/access", ShieldCheck], ["Admin profile", "/admin/profile", UserRound], ["Preferences", "/admin/preferences", Settings]] },
];

const titles = Object.fromEntries(groups.flatMap((group) => group.links.map(([label, path]) => [path, label])));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pageTitle = titles[pathname] || "Admin workspace";

  return (
    <div className={`admin-shell${collapsed ? " admin-shell-collapsed" : ""}${mobileOpen ? " admin-shell-mobile-open" : ""}`}>
      {mobileOpen && <button className="admin-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin/dashboard" onClick={() => setMobileOpen(false)}><span className="admin-brand-mark">SC</span><span className="admin-brand-copy">Skill<span>Connect</span><small>ADMIN WORKSPACE</small></span></Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {groups.map((group) => <section className="admin-nav-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, path, Icon]) => <NavLink key={path} to={path} end className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)} title={label}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>)}
          </section>)}
        </nav>
        <div className="admin-sidebar-foot"><ShieldCheck size={16} /><span>Administrator access</span></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-icon-button admin-mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
          <button className="admin-icon-button admin-collapse-button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((value) => !value)}><Menu size={19} /></button>
          <div className="admin-topbar-title"><span>SKILLCONNECT / ADMIN</span><strong>{pageTitle}</strong></div>
          <div className="admin-user"><span className="admin-user-name">{user?.full_name || user?.username || "Administrator"}<small>{user?.email || "Administrator"}</small></span><span className="admin-user-avatar">{(user?.full_name || user?.username || "A").slice(0, 1).toUpperCase()}</span><button className="admin-logout" onClick={logout}><LogOut size={16} /><span>Log out</span></button></div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
