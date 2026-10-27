import { useCallback, useEffect, useState } from "react";
import { CheckSquare, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { title: "", description: "", assignee_id: "", project_name: "", due_date: "" };
const label = (value = "todo") => value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default function AdminTasks() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [taskResponse, employeeResponse] = await Promise.all([
        API.get("/api/tasks"), API.get("/api/admin/employees"),
      ]);
      setTasks(taskResponse.data.tasks || []);
      setEmployees((employeeResponse.data || []).filter((person) => person.role === "employee" && person.is_active));
      setError("");
    } catch (e) { setError(e.response?.data?.detail || "Could not load task management data."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (editing) await API.put(`/api/admin/tasks/${editing}`, form);
      else await API.post("/api/admin/tasks", form);
      setForm(emptyForm); setEditing(""); setMessage(editing ? "Task updated." : "Task assigned."); await load();
    } catch (e) { setError(e.response?.data?.detail || "Could not save the task."); }
    finally { setBusy(false); }
  };

  const edit = (task) => { setEditing(task.id); setForm({ title: task.title, description: task.description || "", assignee_id: task.assignee_id, project_name: task.project_name || "", due_date: task.due_date || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (task) => {
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    try { await API.delete(`/api/admin/tasks/${task.id}`); setMessage("Task deleted."); await load(); }
    catch (e) { setError(e.response?.data?.detail || "Could not delete the task."); }
  };
  const changeStatus = async (task, status) => {
    try { await API.patch(`/api/tasks/${task.id}/status`, { status }); await load(); }
    catch (e) { setError(e.response?.data?.detail || "Could not update status."); }
  };

  return <div className="task-admin-shell"><aside><Link className="task-brand" to="/admin/dashboard">Skill<span>Connect</span><small>ADMIN</small></Link><nav><Link to="/admin/dashboard">Organization overview</Link><Link to="/admin/employees">Manage employees</Link><Link className="selected" to="/admin/tasks">Task assignments</Link><Link to="/employees">Employee directory</Link><Link to="/projects">Project directory</Link><Link to="/skills">Skills directory</Link><Link to="/skill-insights">Skills and team insights</Link></nav></aside>
    <main><header><strong>Task assignments</strong><span>{user?.full_name || user?.username} · <button onClick={logout}>Log out</button></span></header><section className="task-admin-content"><div className="task-admin-heading"><div><small>ADMIN WORKSPACE</small><h1>Task assignments</h1><p>Assign work to employees and track its progress.</p></div><button onClick={load}><RefreshCw size={16}/> Refresh</button></div>
      {error && <div className="task-error" role="alert">{error}</div>}{message && <div className="task-success" role="status">{message}</div>}
      <section className="task-admin-panel"><h2><Plus size={18}/> {editing ? "Edit assignment" : "Assign a task"}</h2><form onSubmit={submit} className="task-create-form">
        <label>Task title<input required maxLength={120} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></label>
        <label>Assign to<select required value={form.assignee_id} onChange={(e)=>setForm({...form,assignee_id:e.target.value})}><option value="">Select employee</option>{employees.map((person)=><option key={person.id} value={person.id}>{person.full_name || person.username} · {person.department || "No department"}</option>)}</select></label>
        <label>Project (optional)<input maxLength={120} value={form.project_name} onChange={(e)=>setForm({...form,project_name:e.target.value})}/></label>
        <label>Due date<input type="date" value={form.due_date} onChange={(e)=>setForm({...form,due_date:e.target.value})}/></label>
        <label className="wide">Description<textarea rows="3" maxLength={2000} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label>
        <div className="wide task-form-actions"><button className="primary" disabled={busy || !employees.length}><CheckSquare size={16}/>{busy ? "Saving…" : editing ? "Save changes" : "Assign task"}</button>{editing && <button type="button" onClick={()=>{setEditing("");setForm(emptyForm)}}>Cancel</button>}{!employees.length && <span>No active employee accounts to assign tasks to.</span>}</div>
      </form></section>
      <section className="task-admin-panel"><h2>All assignments <span>{tasks.length}</span></h2>{tasks.length ? <div className="task-table-wrap"><table><thead><tr><th>Task</th><th>Employee</th><th>Project</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{tasks.map((task)=><tr key={task.id}><td><strong>{task.title}</strong><small>{task.description}</small></td><td>{employees.find((e)=>e.id===task.assignee_id)?.full_name || employees.find((e)=>e.id===task.assignee_id)?.username || "Former or inactive employee"}</td><td>{task.project_name || "—"}</td><td>{task.due_date || "—"}</td><td><select value={task.status} onChange={(e)=>changeStatus(task,e.target.value)}>{["todo","in_progress","blocked","done"].map((status)=><option key={status} value={status}>{label(status)}</option>)}</select></td><td><button aria-label="Edit task" onClick={()=>edit(task)}><Pencil size={15}/></button><button aria-label="Delete task" onClick={()=>remove(task)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div> : <p className="task-admin-empty">No tasks created yet. Use the form above to assign the first task.</p>}</section>
    </section></main>
    <style>{`.task-admin-shell{min-height:100vh;display:flex;background:#f5f8fc;color:#172033;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.task-admin-shell>aside{width:230px;background:white;border-right:1px solid #e3eaf5;padding:24px 15px;flex-shrink:0}.task-brand{display:block;padding:4px 10px 28px;color:#172033;font-size:21px;font-weight:800;text-decoration:none}.task-brand span{color:#2563eb}.task-brand small{display:block;font-size:10px;color:#8390a6;letter-spacing:.1em}.task-admin-shell nav{display:grid;gap:5px}.task-admin-shell nav a{padding:12px;border-radius:10px;color:#53627b;text-decoration:none;font-weight:600}.task-admin-shell nav a.selected,.task-admin-shell nav a:hover{background:#eaf1ff;color:#2563eb}.task-admin-shell main{flex:1;min-width:0}.task-admin-shell main>header{height:76px;background:white;border-bottom:1px solid #e3eaf5;padding:16px 28px;display:flex;justify-content:space-between;align-items:center}.task-admin-shell header button{background:transparent;border:0;color:#2563eb;cursor:pointer}.task-admin-content{max-width:1400px;margin:auto;padding:28px}.task-admin-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.task-admin-heading small{letter-spacing:.08em;font-weight:700;color:#7888a1}.task-admin-heading h1{margin:4px 0;font-size:30px}.task-admin-heading p{margin:0;color:#7888a1}.task-admin-heading>button{display:flex;gap:8px;align-items:center;border:1px solid #d7e1ef;background:white;border-radius:9px;padding:10px;color:#245ce5}.task-admin-panel{background:white;border:1px solid #e0e8f3;border-radius:16px;padding:20px;margin:18px 0;box-shadow:0 4px 14px #25395b08}.task-admin-panel h2{display:flex;align-items:center;gap:9px;margin:0 0 18px;font-size:18px}.task-admin-panel h2 span{font-size:12px;border-radius:14px;background:#eef3ff;padding:4px 9px}.task-create-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.task-create-form label{display:grid;gap:7px;color:#53627b;font-size:13px;font-weight:600}.task-create-form input,.task-create-form select,.task-create-form textarea{width:100%;border:1px solid #dce4f0;border-radius:8px;padding:10px;color:#172033;background:white;font:inherit}.task-create-form .wide{grid-column:1/-1}.task-form-actions{display:flex;align-items:center;gap:10px}.task-form-actions>button,.task-admin-panel td button{border:1px solid #d7e1ef;background:white;border-radius:8px;padding:8px 11px;cursor:pointer;color:#52627b}.task-form-actions .primary{display:flex;align-items:center;gap:8px;background:#2563eb;color:white;border-color:#2563eb}.task-form-actions span{font-size:12px;color:#9a6b18}.task-table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;min-width:800px}th,td{text-align:left;padding:11px;border-bottom:1px solid #edf1f7;font-size:13px}th{color:#78869d;font-size:11px;text-transform:uppercase}td small{display:block;color:#8390a6;max-width:340px;margin-top:5px}td select{padding:6px;border:1px solid #dce4f0;border-radius:7px;background:white;text-transform:capitalize}td button{margin-right:6px}.task-admin-empty{color:#8390a6}.task-error,.task-success{padding:12px 14px;border-radius:9px;margin:12px 0}.task-error{background:#fff1f1;color:#a72828}.task-success{background:#effaf3;color:#13824b}@media(max-width:760px){.task-admin-shell{display:block}.task-admin-shell>aside{width:auto;padding:12px}.task-admin-shell nav{display:flex;overflow:auto}.task-admin-shell nav a{white-space:nowrap}.task-admin-content{padding:18px 12px}.task-create-form{grid-template-columns:1fr}.task-create-form .wide{grid-column:auto}}`}</style>
  </div>;
}
