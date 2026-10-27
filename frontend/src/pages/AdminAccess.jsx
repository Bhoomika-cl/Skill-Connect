import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, ShieldCheck, UserRound, UserX, X } from "lucide-react";
import API from "../services/api.js";

const emptyForm = { full_name: "", username: "", email: "", password: "", department: "", job_title: "", bio: "" };

export default function AdminAccess() {
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [people, summary, events] = await Promise.all([API.get("/api/admin/employees"), API.get("/api/admin/overview"), API.get("/api/admin/audit")]);
      setEmployees(Array.isArray(people.data) ? people.data : []);
      setOverview(summary.data);
      setAudit(Array.isArray(events.data) ? events.data : []);
      setError("");
    } catch (err) { setError(err.response?.data?.detail || "Could not load account management."); }
  }, []);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const beginEdit = (person) => {
    setEditing(person.id);
    setForm({ ...emptyForm, full_name: person.full_name || "", username: person.username || "", email: person.email || "", department: person.department || "", job_title: person.job_title || "", bio: person.bio || "" });
    setFormOpen(true); setMessage("");
  };
  const startCreate = () => { setEditing(""); setForm(emptyForm); setFormOpen(true); setMessage(""); };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (editing) await API.put(`/api/admin/employees/${editing}`, { full_name: form.full_name, email: form.email, department: form.department, job_title: form.job_title, bio: form.bio });
      else await API.post("/api/admin/employees", form);
      setMessage(editing ? "Employee details updated." : "Employee account created.");
      setFormOpen(false); setEditing(""); setForm(emptyForm); await load();
    } catch (err) { setError(err.response?.data?.detail || "Could not save this account."); }
    finally { setBusy(false); }
  };
  const change = async (person, field, value) => {
    setBusyId(person.id); setError(""); setMessage("");
    try { await API.patch(`/api/admin/employees/${person.id}/${field}`, field === "role" ? { role: value } : { is_active: value }); setMessage("Account access updated."); await load(); }
    catch (err) { setError(err.response?.data?.detail || "Could not update account access."); }
    finally { setBusyId(""); }
  };
  const normalizedQuery = query.trim().toLowerCase();
  const visible = employees.filter((person) => !normalizedQuery || [person.full_name, person.username, person.email, person.department, person.job_title].some((value) => String(value || "").toLowerCase().includes(normalizedQuery)));

  return <div className="admin-page">
    <div className="admin-page-head"><div><span className="admin-eyebrow">Access & settings</span><h1>Accounts and roles</h1><p>Create employee accounts and manage role and active status. Access changes are enforced by the backend.</p></div><div className="admin-page-actions"><button className="admin-button" onClick={load}><RefreshCw size={14}/>Refresh</button><button className="admin-button primary" onClick={startCreate}><Plus size={15}/>Add employee</button></div></div>
    {error && <div className="admin-alert" role="alert">{error}</div>}{message && <div className="admin-success" role="status">{message}</div>}
    <div className="admin-grid stats">{[["Accounts", overview?.accounts, UserRound], ["Active", overview?.active_accounts, Check], ["Administrators", overview?.admins, ShieldCheck]].map(([label, value, Icon]) => <div className="admin-stat" key={label}><span className="admin-stat-icon"><Icon size={16}/></span><div><span className="admin-stat-label">{label}</span><strong>{value ?? "—"}</strong></div></div>)}</div>
    {formOpen && <section className="admin-panel"><div className="admin-panel-head"><div><h2>{editing ? "Edit employee details" : "Create employee account"}</h2><p>New accounts are created with the employee role.</p></div><button className="admin-icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}><X size={15}/></button></div><form onSubmit={save}><div className="admin-form-grid">
      <label className="admin-label">Full name<input className="admin-input" required value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/></label>
      {!editing && <label className="admin-label">Username<input className="admin-input" required value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})}/></label>}
      <label className="admin-label">Work email<input className="admin-input" required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label>
      {!editing && <label className="admin-label">Temporary password<input className="admin-input" required minLength={8} type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/></label>}
      <label className="admin-label">Department<input className="admin-input" value={form.department} onChange={(e)=>setForm({...form,department:e.target.value})}/></label>
      <label className="admin-label">Job title<input className="admin-input" value={form.job_title} onChange={(e)=>setForm({...form,job_title:e.target.value})}/></label>
      {editing && <label className="admin-label wide">Bio<textarea className="admin-textarea" value={form.bio} onChange={(e)=>setForm({...form,bio:e.target.value})}/></label>}
    </div><div className="admin-form-actions"><button type="button" className="admin-button" onClick={()=>setFormOpen(false)}>Cancel</button><button className="admin-button primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create account"}</button></div></form></section>}
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Employee accounts <span className="admin-pill">{visible.length}</span></h2><p>Role changes and deactivation rules are recorded in the audit log.</p></div><div className="admin-search" style={{maxWidth:310}}><input className="admin-input" aria-label="Search accounts" placeholder="Search name, email, department…" value={query} onChange={(e)=>setQuery(e.target.value)}/></div></div>
      {visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Employee</th><th>Department / title</th><th>Role</th><th>Status</th><th>Access actions</th></tr></thead><tbody>{visible.map((person)=><tr key={person.id}><td><strong>{person.full_name || person.username}</strong><span className="admin-secondary">{person.email}</span></td><td>{person.department || "—"}<span className="admin-secondary">{person.job_title || ""}</span></td><td><span className={`admin-pill ${person.role === "admin" ? "info" : ""}`}>{person.role}</span></td><td><span className={`admin-pill ${person.is_active ? "success" : "danger"}`}>{person.is_active ? "Active" : "Inactive"}</span></td><td><div className="admin-page-actions"><button className="admin-button" disabled={busyId===person.id} onClick={()=>beginEdit(person)}><Pencil size={13}/>Edit</button><button className="admin-button" disabled={busyId===person.id || (person.role === "admin" && overview?.admins <= 1)} onClick={()=>change(person,"role",person.role === "admin" ? "employee" : "admin")}>{person.role === "admin" ? "Remove admin" : "Make admin"}</button><button className="admin-button" disabled={busyId===person.id || (person.role === "admin" && overview?.admins <= 1)} onClick={()=>change(person,"status",!person.is_active)}><UserX size={13}/>{person.is_active ? "Deactivate" : "Activate"}</button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty">No matching accounts.</div>}
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><div><h2>Recent access audit</h2><p>Latest recorded role and account changes.</p></div></div>{audit.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Actor</th><th>Target</th><th>Date</th></tr></thead><tbody>{audit.slice(0,30).map((item)=><tr key={item.id}><td>{String(item.action).replaceAll("_"," ")}</td><td>{item.actor}</td><td>{item.target_id}</td><td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No account changes recorded yet.</div>}</section>
  </div>;
}
