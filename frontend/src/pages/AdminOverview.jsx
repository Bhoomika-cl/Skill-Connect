import { useEffect, useState } from "react";
import { Activity, Award, BriefcaseBusiness, CheckSquare, Compass, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api.js";

const actions = [
  ["Find people and skills", "/admin/discover", Compass],
  ["Manage projects and tasks", "/admin/projects-tasks", BriefcaseBusiness],
  ["Review certifications", "/admin/certifications", Award],
  ["Manage accounts and roles", "/admin/access", ShieldCheck],
];

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([API.get("/api/admin/overview"), API.get("/api/admin/audit")])
      .then(([overview, audit]) => {
        if (!active) return;
        setData(overview.data);
        setActivity(Array.isArray(audit.data) ? audit.data.slice(0, 6) : []);
      })
      .catch((err) => { if (active) setError(err.response?.data?.detail || "Unable to load the organization overview."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = [
    ["Employee accounts", data?.employees, Users, "blue"],
    ["Active employees", data?.active_employees, Activity, "green"],
    ["Projects", data?.projects, BriefcaseBusiness, "purple"],
    ["Open tasks", (data?.task_statuses?.todo || 0) + (data?.task_statuses?.in_progress || 0) + (data?.task_statuses?.blocked || 0), CheckSquare, "orange"],
    ["Skills recorded", data?.skills, Compass, "blue"],
    ["Certifications awaiting review", data?.pending_certifications, Award, "orange"],
  ];

  return <div className="admin-page">
    <div className="admin-page-head"><div><span className="admin-eyebrow">Organization</span><h1>Overview</h1><p>Current workforce, project activity, and items that need attention.</p></div></div>
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <div className="admin-grid stats">{stats.map(([label, value, Icon, tone]) => <section className="admin-stat" key={label}><span className={`admin-stat-icon ${tone}`}><Icon size={17}/></span><div><span className="admin-stat-label">{label}</span><strong>{loading ? "—" : value ?? 0}</strong></div></section>)}</div>
    <div className="admin-two-col">
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Quick actions</h2><p>Go directly to an admin workspace.</p></div></div><div className="admin-grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>{actions.map(([label, to, Icon]) => <Link className="admin-button" key={to} to={to} style={{justifyContent:"flex-start",minHeight:48}}><Icon size={16}/>{label}</Link>)}</div></section>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Recent admin activity</h2><p>Latest account and access changes.</p></div></div>{loading ? <div className="admin-loading">Loading activity…</div> : activity.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>By</th><th>When</th></tr></thead><tbody>{activity.map((item) => <tr key={item.id}><td>{String(item.action || "Activity").replaceAll("_", " ")}</td><td>{item.actor}</td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No recorded activity yet.</div>}</section>
    </div>
    {data?.task_statuses && <section className="admin-panel"><div className="admin-panel-head"><div><h2>Task status</h2><p>Counts are based on tasks in the existing workspace.</p></div><Link to="/admin/projects-tasks?tab=tasks" className="admin-icon-link">Open tasks →</Link></div><div className="admin-grid stats">{Object.entries(data.task_statuses).map(([status, count]) => <div className="admin-stat" key={status}><div><span className="admin-stat-label">{status.replaceAll("_", " ")}</span><strong>{count}</strong></div></div>)}</div></section>}
  </div>;
}
