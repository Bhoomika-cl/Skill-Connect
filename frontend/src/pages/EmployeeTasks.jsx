import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const nextStatuses = {
  todo: ["in_progress", "blocked"],
  in_progress: ["blocked", "done"],
  blocked: ["in_progress"],
  done: [],
};
const label = (value = "todo") => value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/api/tasks");
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.detail || "Could not load your tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const updateStatus = async (task, status) => {
    setSaving(task.id);
    try {
      await API.patch(`/api/tasks/${task.id}/status`, { status });
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "Could not update this task.");
    } finally {
      setSaving("");
    }
  };

  return <div className="employee-tasks-shell">
    <main className="employee-tasks-main">
      <header><div><small>EMPLOYEE WORKSPACE</small><h1>My Tasks</h1><p>Hi {user?.full_name || user?.username}, here is your assigned work.</p></div><button onClick={load}><RefreshCw size={16}/> Refresh</button></header>
      {error && <div className="task-error" role="alert">{error}</div>}
      {loading ? <p>Loading your tasks…</p> : tasks.length === 0 ? <section className="task-empty"><CheckCircle2 size={32}/><h2>No tasks assigned yet</h2><p>Tasks assigned by your Scrum Master will appear here.</p></section> :
        <section className="employee-task-list">{tasks.map((task) => <article className="employee-task-card" key={task.id}>
          <div className="employee-task-title"><div><h2>{task.title}</h2><p>{task.description || "No description provided."}</p></div><span className={`status status-${task.status}`}>{label(task.status)}</span></div>
          <div className="employee-task-meta">{task.project_name && <span>Project: {task.project_name}</span>}{task.due_date && <span><Clock3 size={14}/> Due {task.due_date}</span>}</div>
          {nextStatuses[task.status]?.length > 0 && <label className="task-status-control">Update status
            <select disabled={saving === task.id} value={task.status} onChange={(e) => updateStatus(task, e.target.value)}>
              <option value={task.status}>{label(task.status)}</option>{nextStatuses[task.status].map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </label>}
        </article>)}</section>}
      <style>{`.employee-tasks-shell{min-height:100vh;background:#f5f8fc;color:#172033;display:flex;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.employee-tasks-main{max-width:1150px;width:100%;margin:0 auto;padding:38px 34px}.employee-tasks-main header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.employee-tasks-main small{color:#6680aa;font-weight:700;letter-spacing:.08em}.employee-tasks-main h1{margin:6px 0;font-size:32px}.employee-tasks-main p{color:#75839a}.employee-tasks-main button{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #dce4f0;border-radius:10px;padding:10px 14px;color:#245ce5;cursor:pointer}.employee-task-list{display:grid;gap:14px}.employee-task-card,.task-empty{background:#fff;border:1px solid #e0e8f3;border-radius:16px;padding:22px;box-shadow:0 4px 14px #25395b08}.employee-task-title{display:flex;justify-content:space-between;gap:16px}.employee-task-title h2{margin:0;font-size:19px}.employee-task-title p{margin:8px 0}.employee-task-meta{display:flex;gap:20px;color:#77869a;font-size:13px;margin:14px 0}.employee-task-meta span{display:flex;align-items:center;gap:6px}.status{border-radius:20px;padding:6px 10px;background:#eff4ff;color:#285be3;font-size:12px;height:max-content;text-transform:capitalize}.status-done{background:#e9f8ef;color:#13824b}.status-blocked{background:#fff0f0;color:#bd3434}.task-status-control{display:flex;align-items:center;gap:10px;color:#667085;font-size:13px}.task-status-control select{padding:8px;border:1px solid #dce4f0;border-radius:8px;background:white}.task-empty{text-align:center;padding:60px 20px;color:#7b8aa2}.task-empty svg{color:#2864e8}.task-error{background:#fff1f1;color:#a72828;padding:12px 14px;border-radius:10px;margin-bottom:16px}@media(max-width:650px){.employee-tasks-main{padding:24px 14px}.employee-tasks-title{display:block}.employee-task-meta{flex-direction:column;gap:8px}}`}</style>
    </main>
  </div>;
}
