import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BriefcaseBusiness, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import API from "../services/api.js";

const projectBlank = { user_id: "", project_name: "", description: "", skills_used: "" };
const taskBlank = { title: "", description: "", assignee_id: "", project_name: "", due_date: "" };
const taskStatuses = ["todo", "in_progress", "blocked", "done"];

async function fetchAllProjects() {
  const { data: first } = await API.get("/api/admin/discover", { params: { type: "projects", page_size: 100, page: 1, sort: "name" } });
  const remaining = await Promise.all(Array.from({ length: Math.max(0, (first.pages || 1) - 1) }, (_, index) => API.get("/api/admin/discover", { params: { type: "projects", page_size: 100, page: index + 2, sort: "name" } })));
  return [first, ...remaining.map((response) => response.data)].flatMap((page) => page.items || []);
}

export default function AdminProjectsTasks() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "projects";
  const projectId = params.get("project") || "";
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [projectForm, setProjectForm] = useState(projectBlank);
  const [taskForm, setTaskForm] = useState(taskBlank);
  const [editingProject, setEditingProject] = useState("");
  const [editingTask, setEditingTask] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedProject = projects.find((item) => item.id === projectId) || null;

  const load = useCallback(async () => {
    setError("");
    try {
      const [people, projectItems, taskData] = await Promise.all([
        API.get("/api/admin/employees"),
        fetchAllProjects(),
        API.get("/api/tasks"),
      ]);
      setEmployees(Array.isArray(people.data) ? people.data.filter((person) => person.role === "employee" && person.is_active) : []);
      setProjects(projectItems);
      setTasks(taskData.data.tasks || []);
    } catch (err) { setError(err.response?.data?.detail || "Unable to load project and task records."); }
  }, []);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const changeTab = (nextTab) => { setParams((current) => { const next = new URLSearchParams(current); next.set("tab", nextTab); next.delete("project"); return next; }); };
  const resetProject = () => { setEditingProject(""); setProjectForm({ ...projectBlank, user_id: employees[0]?.id || "" }); setProjectOpen(true); };
  const editProject = (item) => { setEditingProject(item.id); setProjectForm({ user_id: item.employee_id, project_name: item.title, description: item.detail || "", skills_used: (item.skills_used || []).join(", ") }); setProjectOpen(true); };
  const saveProject = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const payload = { user_id: projectForm.user_id, project_name: projectForm.project_name, description: projectForm.description, skills_used: projectForm.skills_used.split(",").map((item) => item.trim()).filter(Boolean) };
    try {
      if (editingProject) await API.put(`/api/admin/projects/${editingProject}`, payload);
      else await API.post("/api/projects", payload);
      setProjectOpen(false); setMessage(editingProject ? "Project updated." : "Project created."); await load();
    } catch (err) { setError(err.response?.data?.detail || "Unable to save this project."); }
    finally { setBusy(false); }
  };
  const removeProject = async (item) => {
    if (!window.confirm(`Delete project “${item.title}”?`)) return;
    setBusyId(item.id); setError(""); setMessage("");
    try { await API.delete(`/api/projects/${item.id}`); setMessage("Project deleted."); setParams((current)=>{const next=new URLSearchParams(current);next.delete("project");return next;}); await load(); }
    catch (err) { setError(err.response?.data?.detail || "Unable to delete this project."); }
    finally { setBusyId(""); }
  };

  const startTask = () => { setEditingTask(""); setTaskForm({ ...taskBlank, assignee_id: employees[0]?.id || "" }); setTaskOpen(true); };
  const editTask = (task) => { setEditingTask(task.id); setTaskForm({ title: task.title || "", description: task.description || "", assignee_id: task.assignee_id || "", project_name: task.project_name || "", due_date: task.due_date || "" }); setTaskOpen(true); };
  const saveTask = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (editingTask) await API.put(`/api/admin/tasks/${editingTask}`, taskForm);
      else await API.post("/api/admin/tasks", taskForm);
      setTaskOpen(false); setMessage(editingTask ? "Task updated." : "Task assigned."); await load();
    } catch (err) { setError(err.response?.data?.detail || "Unable to save this task."); }
    finally { setBusy(false); }
  };
  const removeTask = async (task) => {
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    setBusyId(task.id); setError(""); setMessage("");
    try { await API.delete(`/api/admin/tasks/${task.id}`); setMessage("Task deleted."); await load(); }
    catch (err) { setError(err.response?.data?.detail || "Unable to delete this task."); }
    finally { setBusyId(""); }
  };
  const updateStatus = async (task, status) => {
    setBusyId(task.id); setError("");
    try { await API.patch(`/api/tasks/${task.id}/status`, { status }); await load(); }
    catch (err) { setError(err.response?.data?.detail || "Unable to update task status."); }
    finally { setBusyId(""); }
  };

  const employeeName = (id) => employees.find((person) => person.id === id)?.full_name || employees.find((person) => person.id === id)?.username || "Employee";
  const q = query.trim().toLowerCase();
  const shownProjects = projects.filter((item) => !q || [item.title, item.detail, item.employee_name, item.department, ...(item.skills_used || [])].join(" ").toLowerCase().includes(q));
  const shownTasks = tasks.filter((item) => !q || [item.title, item.description, item.project_name, employeeName(item.assignee_id), item.status].join(" ").toLowerCase().includes(q));

  return <div className="admin-page">
    <div className="admin-page-head"><div><span className="admin-eyebrow">Projects & tasks</span><h1>Projects and assignments</h1><p>Browse project work, assign tasks, and track employee progress from one workspace.</p></div><div className="admin-page-actions">{tab === "projects" ? <button className="admin-button primary" onClick={resetProject}><Plus size={14}/>Add project</button> : <button className="admin-button primary" onClick={startTask}><Plus size={14}/>Assign task</button>}</div></div>
    {error && <div className="admin-alert" role="alert">{error}</div>}{message && <div className="admin-success" role="status">{message}</div>}
    <section className="admin-panel"><div className="admin-tabs" role="tablist" aria-label="Project and task workspace"><button className={`admin-tab${tab === "projects" ? " active" : ""}`} onClick={()=>changeTab("projects")} role="tab" aria-selected={tab === "projects"}>Projects<span>{projects.length}</span></button><button className={`admin-tab${tab === "tasks" ? " active" : ""}`} onClick={()=>changeTab("tasks")} role="tab" aria-selected={tab === "tasks"}>Tasks<span>{tasks.length}</span></button><button className={`admin-tab${tab === "assignments" ? " active" : ""}`} onClick={()=>changeTab("assignments")} role="tab" aria-selected={tab === "assignments"}>Assignments<span>{tasks.filter((task)=>task.assignee_id).length}</span></button></div>
      <div className="admin-toolbar" style={{padding:"14px 0 4px"}}><div className="admin-search"><Search size={14}/><input className="admin-input" aria-label="Search projects and tasks" placeholder={tab === "projects" ? "Search projects, employees, skills…" : "Search tasks, employees, status…"} value={query} onChange={(e)=>setQuery(e.target.value)}/></div></div>
      {tab === "projects" ? shownProjects.length ? <div className="admin-result-grid" style={{paddingTop:12}}>{shownProjects.map((item)=><article className="admin-result-card" key={item.id}><div className="admin-result-top"><span className="admin-result-icon"><BriefcaseBusiness size={15}/></span><div className="admin-result-title"><h3>{item.title}</h3><p>{item.employee_name || "Unassigned owner"}{item.department ? ` · ${item.department}` : ""}</p></div></div>{item.detail && <p>{item.detail}</p>}<div className="admin-chip-list">{(item.skills_used || []).slice(0,6).map((skill)=><span key={skill} className="admin-chip">{skill}</span>)}</div><div className="admin-result-actions"><button className="admin-button" onClick={()=>setParams((current)=>{const next=new URLSearchParams(current);next.set("project",item.id);return next;})}>Details</button><button className="admin-button" onClick={()=>editProject(item)}><Pencil size={13}/>Edit</button><button className="admin-button danger" disabled={busyId===item.id} onClick={()=>removeProject(item)}><Trash2 size={13}/>Delete</button></div></article>)}</div> : <div className="admin-empty">No matching projects.</div>
      : tab === "tasks" ? shownTasks.length ? <div className="admin-table-wrap" style={{paddingTop:12}}><table className="admin-table"><thead><tr><th>Task</th><th>Assignee</th><th>Project / due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{shownTasks.map((task)=><tr key={task.id}><td><strong>{task.title}</strong><span className="admin-secondary">{task.description}</span></td><td>{employeeName(task.assignee_id)}</td><td>{task.project_name || "—"}<span className="admin-secondary">{task.due_date ? `Due ${task.due_date}` : "No due date"}</span></td><td><select className="admin-select" style={{minWidth:115}} value={task.status} disabled={busyId===task.id} onChange={(e)=>updateStatus(task,e.target.value)}>{taskStatuses.map((status)=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}</select></td><td><div className="admin-page-actions"><button className="admin-button" onClick={()=>editTask(task)}><Pencil size={13}/>Edit</button><button className="admin-button danger" disabled={busyId===task.id} onClick={()=>removeTask(task)}><Trash2 size={13}/>Delete</button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty">No matching tasks.</div>
      : <div className="admin-table-wrap" style={{paddingTop:12}}><table className="admin-table"><thead><tr><th>Employee</th><th>Assigned tasks</th><th>To do</th><th>In progress</th><th>Blocked</th><th>Done</th></tr></thead><tbody>{employees.map((person)=>{const assigned=tasks.filter((task)=>task.assignee_id===person.id);if(q && ![person.full_name,person.department,person.job_title,...assigned.map((task)=>task.title)].join(" ").toLowerCase().includes(q))return null;return <tr key={person.id}><td><strong>{person.full_name}</strong><span className="admin-secondary">{person.department || person.job_title || "Employee"}</span></td><td>{assigned.length}</td>{taskStatuses.map((status)=><td key={status}>{assigned.filter((task)=>task.status===status).length}</td>)}</tr>;})}</tbody></table></div>}
    </section>
    {projectOpen && <div className="admin-drawer"><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="project-form-title"><div className="admin-dialog-head"><div><h2 id="project-form-title">{editingProject ? "Edit project" : "Create project"}</h2><p>Assign the project to an active employee. Skills are comma-separated.</p></div><button className="admin-icon-button" aria-label="Close" onClick={()=>setProjectOpen(false)}><X size={15}/></button></div><form onSubmit={saveProject}><div className="admin-form-grid"><label className="admin-label">Project name<input required className="admin-input" value={projectForm.project_name} onChange={(e)=>setProjectForm({...projectForm,project_name:e.target.value})}/></label><label className="admin-label">Project owner<select required className="admin-select" value={projectForm.user_id} onChange={(e)=>setProjectForm({...projectForm,user_id:e.target.value})}><option value="">Choose employee</option>{employees.map((person)=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label><label className="admin-label wide">Description<textarea className="admin-textarea" value={projectForm.description} onChange={(e)=>setProjectForm({...projectForm,description:e.target.value})}/></label><label className="admin-label wide">Skills used<input className="admin-input" placeholder="Python, FastAPI, MongoDB" value={projectForm.skills_used} onChange={(e)=>setProjectForm({...projectForm,skills_used:e.target.value})}/></label></div><div className="admin-form-actions"><button type="button" className="admin-button" onClick={()=>setProjectOpen(false)}>Cancel</button><button className="admin-button primary" disabled={busy||!employees.length}>{busy?"Saving…":editingProject?"Save project":"Create project"}</button></div></form>{!employees.length&&<p className="admin-notice">No active employee accounts are available for project ownership.</p>}</section></div>}
    {taskOpen && <div className="admin-drawer"><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="task-form-title"><div className="admin-dialog-head"><div><h2 id="task-form-title">{editingTask ? "Edit task assignment" : "Assign a task"}</h2><p>Tasks can be updated by their assignee according to the allowed status flow.</p></div><button className="admin-icon-button" aria-label="Close" onClick={()=>setTaskOpen(false)}><X size={15}/></button></div><form onSubmit={saveTask}><div className="admin-form-grid"><label className="admin-label">Task title<input required className="admin-input" value={taskForm.title} onChange={(e)=>setTaskForm({...taskForm,title:e.target.value})}/></label><label className="admin-label">Assignee<select required className="admin-select" value={taskForm.assignee_id} onChange={(e)=>setTaskForm({...taskForm,assignee_id:e.target.value})}><option value="">Choose employee</option>{employees.map((person)=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label><label className="admin-label">Project<input className="admin-input" value={taskForm.project_name} onChange={(e)=>setTaskForm({...taskForm,project_name:e.target.value})}/></label><label className="admin-label">Due date<input className="admin-input" type="date" value={taskForm.due_date} onChange={(e)=>setTaskForm({...taskForm,due_date:e.target.value})}/></label><label className="admin-label wide">Description<textarea className="admin-textarea" value={taskForm.description} onChange={(e)=>setTaskForm({...taskForm,description:e.target.value})}/></label></div><div className="admin-form-actions"><button type="button" className="admin-button" onClick={()=>setTaskOpen(false)}>Cancel</button><button className="admin-button primary" disabled={busy||!employees.length}>{busy?"Saving…":editingTask?"Save task":"Assign task"}</button></div></form></section></div>}
    {selectedProject && !projectOpen && <div className="admin-drawer" onMouseDown={(event)=>{if(event.target===event.currentTarget)setParams((current)=>{const next=new URLSearchParams(current);next.delete("project");return next;});}}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="project-detail-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">Project detail</span><h2 id="project-detail-title">{selectedProject.title}</h2><p>{selectedProject.employee_name || "Employee"} · {selectedProject.department || "Department not listed"}</p></div><button className="admin-icon-button" aria-label="Close" onClick={()=>setParams((current)=>{const next=new URLSearchParams(current);next.delete("project");return next;})}><X size={15}/></button></div><p>{selectedProject.detail || "No project description."}</p><div className="admin-chip-list">{(selectedProject.skills_used||[]).map((skill)=><span className="admin-chip" key={skill}>{skill}</span>)}</div><div className="admin-form-actions"><button className="admin-button" onClick={()=>editProject(selectedProject)}>Edit project</button></div></section></div>}
  </div>;
}
