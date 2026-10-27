import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, BarChart3, BriefcaseBusiness, LayoutDashboard,
  Search, Settings, ShieldCheck, Sparkles, UserRound, Users,
  CheckSquare,
} from "lucide-react";
import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const navigationGroups = [
  { title: "Dashboard", items: [["Overview", "/admin/dashboard", LayoutDashboard]] },
  { title: "People management", items: [
    ["Employee directory", "/employees", Users],
    ["Find employees by skills", "/admin/matches", Search],
    ["Skills directory", "/skills", Sparkles],
  ] },
  { title: "Projects and tasks", items: [
    ["Project directory", "/projects", BriefcaseBusiness],
    ["Task assignments", "/admin/tasks", CheckSquare],
  ] },
  { title: "Certifications", items: [["Certification reviews", "/admin/certifications", ShieldCheck]] },
  { title: "Reports and analytics", items: [["Skills and team insights", "/skill-insights", BarChart3]] },
  { title: "Access management", items: [["Admin access and roles", "/admin", ShieldCheck]] },
  { title: "Account settings", items: [
    ["Admin profile", "/profile", UserRound],
    ["Account preferences", "/settings", Settings],
  ] },
];

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState("");
  const [employeeForm, setEmployeeForm] = useState({ full_name: "", username: "", email: "", password: "", department: "", job_title: "", bio: "" });

  const load = useCallback(async () => {
    try {
      setError("");
      const [summary, people, events] = await Promise.all([
        API.get("/api/admin/overview"),
        API.get("/api/admin/employees"),
        API.get("/api/admin/audit"),
      ]);
      setOverview(summary.data);
      setEmployees(Array.isArray(people.data) ? people.data : []);
      setAudit(Array.isArray(events.data) ? events.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load admin information.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateEmployee = async (employee, field, value) => {
    setBusyId(employee.id);
    try {
      await API.patch(`/api/admin/employees/${employee.id}/${field}`,
        field === "role" ? { role: value } : { is_active: value });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update this employee.");
    } finally {
      setBusyId("");
    }
  };

  const saveEmployee = async (event) => {
    event.preventDefault(); setError(""); setBusyId("form");
    try {
      if (editingEmployee) {
        await API.put(`/api/admin/employees/${editingEmployee}`, {
          full_name: employeeForm.full_name, email: employeeForm.email,
          department: employeeForm.department, job_title: employeeForm.job_title, bio: employeeForm.bio,
        });
      } else {
        await API.post("/api/admin/employees", employeeForm);
      }
      setEmployeeForm({ full_name: "", username: "", email: "", password: "", department: "", job_title: "", bio: "" });
      setShowEmployeeForm(false); setEditingEmployee(""); await load();
    } catch (err) { setError(err.response?.data?.detail || "Unable to save this employee."); }
    finally { setBusyId(""); }
  };

  const startEditEmployee = (employee) => {
    setEditingEmployee(employee.id);
    setEmployeeForm({ full_name: employee.full_name || "", username: employee.username || "", email: employee.email || "", password: "", department: employee.department || "", job_title: employee.job_title || "", bio: employee.bio || "" });
    setShowEmployeeForm(true);
  };

  return (
    <div className="admin-layout">
      <style>{`
        .admin-layout{min-height:100vh;background:#f5f8fc;color:#172033;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex}
        .admin-sidebar{width:245px;background:white;border-right:1px solid #e3eaf5;padding:24px 16px;flex-shrink:0}
        .admin-brand{font-size:22px;font-weight:800;padding:4px 12px 28px;color:#172033}.admin-brand b{color:#2563eb}
        .admin-nav{display:grid;gap:10px}.admin-nav-group{display:grid;gap:3px}.admin-nav-group summary{padding:8px 12px;color:#8390a6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;list-style:none}.admin-nav-group summary::-webkit-details-marker{display:none}.admin-nav-group a{padding:10px 12px;border-radius:10px;color:#53627b;text-decoration:none;display:flex;align-items:center;gap:10px;font-weight:600;font-size:13px}
        .admin-nav a:hover,.admin-nav a.active{background:#eaf1ff;color:#2563eb}.admin-main{flex:1;min-width:0}
        .admin-top{height:82px;background:white;border-bottom:1px solid #e3eaf5;padding:16px 32px;display:flex;justify-content:space-between;align-items:center}
        .admin-content{padding:30px 32px}.admin-heading{font-size:30px;margin:0 0 6px}.admin-muted{color:#7786a0;margin:0 0 24px}
        .admin-cards{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:14px;margin-bottom:22px}.admin-card,.admin-panel{background:white;border:1px solid #e0e8f3;border-radius:16px;padding:20px;box-shadow:0 4px 14px #25395b08}
        .admin-card span{color:#71819a;font-size:13px}.admin-card strong{display:block;font-size:27px;margin-top:7px}
        .admin-panel{margin-bottom:22px;overflow:auto}.admin-panel h2{font-size:19px;margin:0 0 16px}
        .admin-table{width:100%;border-collapse:collapse;min-width:750px}.admin-table th,.admin-table td{text-align:left;padding:12px 10px;border-bottom:1px solid #edf1f7;font-size:13px}.admin-table th{color:#78869d;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
        .admin-pill{display:inline-block;border-radius:99px;padding:5px 10px;background:#e9f8ef;color:#13824b;font-size:12px}.admin-pill.off{background:#fff0f0;color:#bd3434}
        .admin-action{border:1px solid #d7e1ef;background:#fff;border-radius:8px;padding:7px 10px;color:#245ce5;cursor:pointer;font-size:12px;margin-right:6px}.admin-action.danger{color:#c33939}.admin-action:disabled{opacity:.5;cursor:wait}
        .admin-alert{background:#fff1f1;color:#a72828;padding:12px 14px;border-radius:10px;margin-bottom:18px}.admin-empty{color:#7c8aa1;padding:18px 8px}
        .admin-employee-form{background:#fff;border:1px solid #e0e8f3;border-radius:14px;padding:18px;margin:16px 0;display:grid;gap:12px}.admin-employee-form h2{margin:0;font-size:18px}.admin-employee-form>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.admin-employee-form label{display:grid;gap:6px;color:#53627b;font-size:13px}.admin-employee-form input,.admin-employee-form textarea{border:1px solid #dce4f0;border-radius:8px;padding:9px;font:inherit}.admin-employee-form label.wide{grid-column:1/-1}.admin-employee-form small{color:#8390a6}
        @media(max-width:900px){.admin-sidebar{width:190px}.admin-cards{grid-template-columns:repeat(2,minmax(130px,1fr))}.admin-content{padding:22px 16px}}
        @media(max-width:620px){.admin-layout{display:block}.admin-sidebar{width:auto;padding:12px}.admin-brand{padding-bottom:12px}.admin-nav{display:flex;overflow:auto}.admin-nav-group{min-width:max-content}.admin-nav-group summary{padding:8px}.admin-nav-group a{white-space:nowrap}.admin-top{padding:12px 16px}.admin-cards{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <aside className="admin-sidebar">
        <div className="admin-brand">Skill<b>Connect</b></div>
        <nav className="admin-nav">
          {navigationGroups.map((group) => (
            <details className="admin-nav-group" key={group.title} open>
              <summary>{group.title}</summary>
              {group.items.map(([label, path, Icon]) => (
                <Link key={path} className={path === "/admin/dashboard" ? "active" : ""} to={path}>
                  <Icon size={17} />{label}
                </Link>
              ))}
            </details>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <strong>Welcome to SkillConnect Admin Dashboard</strong>
          <span>{user?.full_name || user?.username} · <button className="admin-action" onClick={logout}>Log out</button></span>
        </header>
        <div className="admin-content">
          <h1 className="admin-heading">Organization overview</h1>
          <p className="admin-muted">Manage employee skills, discover talent, coordinate projects, and oversee workforce development at CirrusLabs.</p>
          <div className="admin-quick-actions">
            <Link className="admin-action" to="/admin/employee-directory">Browse employees</Link>
            <Link className="admin-action" to="/admin/matches">Find matching skills</Link>
            <Link className="admin-action" to="/admin/projects">View projects</Link>
            <Link className="admin-action" to="/admin/certifications">Review certifications</Link>
          </div>
          <button className="admin-action" onClick={() => { setEditingEmployee(""); setEmployeeForm({ full_name: "", username: "", email: "", password: "", department: "", job_title: "", bio: "" }); setShowEmployeeForm((shown) => !shown); }}>{showEmployeeForm ? "Close employee form" : "+ Add employee"}</button>
          {error && <div className="admin-alert">{error}</div>}
          {showEmployeeForm && <form className="admin-employee-form" onSubmit={saveEmployee}>
            <h2>{editingEmployee ? "Update employee" : "Create employee account"}</h2>
            <div><label>Full name<input required value={employeeForm.full_name} onChange={(e)=>setEmployeeForm({...employeeForm,full_name:e.target.value})}/></label>
              {!editingEmployee && <label>Username<input required value={employeeForm.username} onChange={(e)=>setEmployeeForm({...employeeForm,username:e.target.value})}/></label>}
              <label>Work email<input required type="email" value={employeeForm.email} onChange={(e)=>setEmployeeForm({...employeeForm,email:e.target.value})}/></label>
              {!editingEmployee && <label>Initial password<input required minLength={8} type="password" value={employeeForm.password} onChange={(e)=>setEmployeeForm({...employeeForm,password:e.target.value})}/></label>}
              <label>Department<input value={employeeForm.department} onChange={(e)=>setEmployeeForm({...employeeForm,department:e.target.value})}/></label>
              <label>Job title<input value={employeeForm.job_title} onChange={(e)=>setEmployeeForm({...employeeForm,job_title:e.target.value})}/></label>
              {editingEmployee && <label className="wide">Bio<textarea value={employeeForm.bio} onChange={(e)=>setEmployeeForm({...employeeForm,bio:e.target.value})}/></label>}
            </div><button className="admin-action" disabled={busyId === "form"}>{busyId === "form" ? "Saving…" : editingEmployee ? "Save changes" : "Create employee"}</button><small>New accounts are employees by default. Promote admin access deliberately.</small>
          </form>}
          <div className="admin-cards">
            {[["Employee accounts", overview?.employees], ["Active employee accounts", overview?.active_accounts], ["Administrators", overview?.admins], ["Available skills", overview?.skills], ["Projects", overview?.projects]].map(([label, value]) => (
              <section className="admin-card" key={label}><span>{label}</span><strong>{value ?? "—"}</strong></section>
            ))}
          </div>
          <section className="admin-panel">
            <h2>Employees</h2>
            {employees.length === 0 ? <p className="admin-empty">No employees found.</p> : (
              <table className="admin-table">
                <thead><tr><th>Employee</th><th>Department</th><th>Job title</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{employees.map((employee) => (
                  <tr key={employee.id}>
                    <td><strong>{employee.full_name || employee.username}</strong><br/><span className="admin-muted">{employee.email}</span>{employee.teams_link && <><br/><a href={employee.teams_link} target="_blank" rel="noopener noreferrer">Contact on Teams</a></>}</td>
                    <td>{employee.department || "—"}</td><td>{employee.job_title || "—"}</td>
                    <td>{employee.role}</td>
                    <td><span className={`admin-pill ${employee.is_active ? "" : "off"}`}>{employee.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <button className="admin-action" disabled={busyId === employee.id} onClick={() => startEditEmployee(employee)}>Edit</button>
                      {employee.role === "admin" ? (
                        <button className="admin-action" disabled={busyId === employee.id || employee.id === user?.id || overview?.admins <= 1} onClick={() => updateEmployee(employee, "role", "employee")}>Remove admin</button>
                      ) : (
                        <button className="admin-action" disabled={busyId === employee.id} onClick={() => updateEmployee(employee, "role", "admin")}>Make admin</button>
                      )}
                      <button className="admin-action" disabled={busyId === employee.id || employee.id === user?.id || (employee.role === "admin" && overview?.admins <= 1)} onClick={() => updateEmployee(employee, "status", !employee.is_active)}>{employee.is_active ? "Deactivate" : "Activate"}</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </section>
          <section className="admin-panel">
            <h2><Activity size={18} style={{verticalAlign:"middle",marginRight:8}}/>Recent admin activity</h2>
            {audit.length === 0 ? <p className="admin-empty">Admin changes will appear here.</p> : (
              <table className="admin-table"><thead><tr><th>Action</th><th>By</th><th>Employee ID</th><th>Date</th></tr></thead>
                <tbody>{audit.map((event) => <tr key={event.id}><td>{event.action.replaceAll("_", " ")}</td><td>{event.actor}</td><td>{event.target_id}</td><td>{new Date(event.created_at).toLocaleString()}</td></tr>)}</tbody>
              </table>
            )}
          </section>
          <button className="admin-action" onClick={load}>Refresh data</button>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
