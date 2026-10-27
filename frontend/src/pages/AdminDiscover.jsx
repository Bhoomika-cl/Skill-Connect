import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Award, BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, ExternalLink, FileText, Search, Sparkles, Users, X } from "lucide-react";
import API from "../services/api.js";

const categories = [["all", "All results"], ["employees", "Employees"], ["skills", "Skills"], ["projects", "Projects"], ["certifications", "Certifications"], ["matches", "Skill match"]];
const iconFor = { employees: Users, skills: Sparkles, projects: BriefcaseBusiness, certifications: Award };

export default function AdminDiscover() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type") || "all";
  const term = params.get("q") || "";
  const department = params.get("department") || "";
  const sort = params.get("sort") || "relevance";
  const page = Number(params.get("page") || 1);
  const [data, setData] = useState({ items: [], counts: {}, departments: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [required, setRequired] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchNote, setMatchNote] = useState("");
  const [matchBusy, setMatchBusy] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const load = useCallback(async () => {
    if (type === "matches") return;
    setLoading(true); setError("");
    try {
      const { data: response } = await API.get("/api/admin/discover", { params: { q: term, type, department, sort, page, page_size: 16 } });
      setData(response);
    } catch (err) { setError(err.response?.data?.detail || "Unable to load discovery results."); }
    finally { setLoading(false); }
  }, [type, term, department, sort, page]);
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const updateParams = (values) => setParams((current) => {
    const next = new URLSearchParams(current);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, String(value)) : next.delete(key));
    if (Object.keys(values).some((key) => key !== "page")) next.set("page", "1");
    return next;
  });
  const submitSearch = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); updateParams({ q: String(form.get("q") || "").trim(), page: 1 }); };
  const tabCounts = useMemo(() => ({ all: data.total, ...data.counts }), [data]);

  const runMatch = async (event) => {
    event.preventDefault(); setMatchBusy(true); setMatchError("");
    try {
      const { data: response } = await API.post("/api/skill-matches", { required_skills: required.split(",") });
      setMatches(response.results || []); setMatchNote(response.score_note || "");
    } catch (err) { setMatchError(err.response?.data?.detail || "Could not calculate skill coverage."); }
    finally { setMatchBusy(false); }
  };

  const openEmployee = async (item) => {
    setSelected(item); setProfile(null); setProfileBusy(true);
    try {
      const [profileResult, skillResult, projectResult] = await Promise.all([
        API.get(`/api/profile/${item.employee_id || item.id}`),
        API.get(`/api/skills/${item.employee_id || item.id}`),
        API.get(`/api/projects/${item.employee_id || item.id}`),
      ]);
      setProfile({ ...(profileResult.data.profile || {}), skills: skillResult.data.skills || [], projects: projectResult.data.projects || [] });
    } catch (err) { setError(err.response?.data?.detail || "Could not load this employee profile."); }
    finally { setProfileBusy(false); }
  };

  const renderItem = (item) => {
    const Icon = iconFor[item.type] || FileText;
    const employeeItem = item.type === "employees";
    return <article className="admin-result-card" key={`${item.type}-${item.id}`}>
      <div className="admin-result-top"><span className="admin-result-icon"><Icon size={15}/></span><div className="admin-result-title"><h3>{item.title}</h3><p>{item.subtitle || item.department || ""}</p></div><span className="admin-pill">{item.type.slice(0, -1)}</span></div>
      {item.detail && <p>{item.detail}</p>}
      {item.type === "skills" && <p>{item.employee_name} · {item.proficiency || "Proficiency not listed"}{item.category ? ` · ${item.category}` : ""}</p>}
      {item.type === "projects" && <div className="admin-chip-list">{(item.skills_used || []).slice(0, 5).map((skill) => <span className="admin-chip" key={skill}>{skill}</span>)}</div>}
      {item.type === "certifications" && <p><span className={`admin-pill ${item.verification_status === "verified" ? "success" : item.verification_status === "rejected" ? "danger" : "warning"}`}>{item.verification_status}</span>{item.has_proof ? " · Proof attached" : ""}</p>}
      <div className="admin-result-actions">
        {employeeItem && <button className="admin-button" onClick={() => openEmployee(item)}>View employee details</button>}
        {item.type === "skills" && <button className="admin-button" onClick={() => openEmployee({ ...item, id: item.employee_id })}>View employee</button>}
        {item.type === "projects" && <Link className="admin-button" to={`/admin/projects-tasks?tab=projects&project=${item.id}`}>Open project</Link>}
        {item.type === "certifications" && <Link className="admin-button" to={`/admin/certifications?cert=${item.id}`}>Review certification</Link>}
        {item.department && <span className="admin-secondary">{item.department}</span>}
      </div>
    </article>;
  };

  return <div className="admin-page">
    <div className="admin-page-head"><div><span className="admin-eyebrow">Discover & manage</span><h1>Find people, skills, and work</h1><p>Search the real employee, skill, project, and certification records available to administrators.</p></div></div>
    <section className="admin-panel">
      <div className="admin-toolbar" style={{marginBottom:14}}>
        <form key={term} className="admin-toolbar" onSubmit={submitSearch} style={{flex:1}}><div className="admin-search"><Search size={15}/><input name="q" className="admin-input" aria-label="Search people, skills, projects, certifications" placeholder="Search names, skills, projects, issuers…" defaultValue={term}/></div><button className="admin-button primary" disabled={loading}><Search size={14}/>Search</button></form>
        <label className="admin-label" style={{minWidth:150}}><span>Department</span><select className="admin-select" value={department} onChange={(e)=>updateParams({department:e.target.value})}><option value="">All departments</option>{data.departments.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
        <label className="admin-label" style={{minWidth:135}}><span>Sort by</span><select className="admin-select" value={sort} onChange={(e)=>updateParams({sort:e.target.value})}><option value="relevance">Relevance</option><option value="name">Name</option><option value="recent">Most recent</option></select></label>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Discovery category">{categories.map(([key,label])=><button type="button" role="tab" aria-selected={type===key} className={`admin-tab${type===key?" active":""}`} key={key} onClick={()=>updateParams({type:key,page:1})}>{label}{key !== "matches" && <span>{tabCounts[key] ?? 0}</span>}</button>)}</div>
      {type === "matches" ? <div style={{paddingTop:16}}>
        <div className="admin-panel-head"><div><h2>Skill coverage matching</h2><p>Compare required skills with active employees’ saved skill records.</p></div></div>
        <form className="admin-toolbar" onSubmit={runMatch}><div className="admin-search"><Sparkles size={15}/><input className="admin-input" aria-label="Required skills" placeholder="Enter skills separated by commas, e.g. Python, SQL, FastAPI" value={required} onChange={(e)=>setRequired(e.target.value)}/></div><button className="admin-button primary" disabled={matchBusy || !required.trim()}>{matchBusy ? "Matching…" : "Find matches"}</button></form>
        {matchError && <div className="admin-alert" role="alert" style={{marginTop:12}}>{matchError}</div>}{matchNote && <p className="admin-notice" style={{marginTop:12}}>{matchNote}</p>}
        {matches.length > 0 ? <div className="admin-grid" style={{marginTop:12}}>{matches.map((person)=><article className="admin-result-card" key={person.id}><div className="admin-result-top"><span className="admin-result-icon"><Users size={15}/></span><div className="admin-result-title"><h3>{person.full_name}</h3><p>{person.job_title || ""}{person.department ? ` · ${person.department}` : ""}</p></div><span className="admin-pill info">{person.score}%</span></div><p><strong>Matched:</strong> {person.matched_skills.join(", ") || "None"}</p><p><strong>Missing:</strong> {person.missing_skills.join(", ") || "None"}</p>{person.teams_link && <a className="admin-icon-link" href={person.teams_link} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/>Contact on Teams</a>}</article>)}</div> : !matchError && <div className="admin-empty">Enter a combination of required skills to compare against real employee records.</div>}
      </div> : loading ? <div className="admin-loading">Loading results…</div> : error ? <div className="admin-alert" role="alert">{error}</div> : data.items?.length ? <><div className="admin-result-grid" style={{paddingTop:14}}>{data.items.map(renderItem)}</div><div className="admin-pagination"><span>Showing {((data.page-1)*data.page_size)+1}–{Math.min(data.page*data.page_size,data.total)} of {data.total}</span><div className="admin-pagination-actions"><button className="admin-button" disabled={page<=1} aria-label="Previous page" onClick={()=>updateParams({page:page-1})}><ChevronLeft size={14}/>Previous</button><span style={{alignSelf:"center"}}>Page {data.page} of {Math.max(data.pages,1)}</span><button className="admin-button" disabled={page>=data.pages} aria-label="Next page" onClick={()=>updateParams({page:page+1})}>Next<ChevronRight size={14}/></button></div></div></> : <div className="admin-empty"><Building2 size={23}/><p>No matching records. Try another search or filter.</p></div>}
    </section>
    {selected && <div className="admin-drawer" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="employee-details-title"><div className="admin-dialog-head"><div><span className="admin-eyebrow">Employee details</span><h2 id="employee-details-title">{selected.title || selected.employee_name}</h2><p>{selected.subtitle || selected.department}</p></div><button className="admin-icon-button" aria-label="Close details" onClick={()=>setSelected(null)}><X size={15}/></button></div>{profileBusy ? <div className="admin-loading">Loading employee details…</div> : profile ? <><p><strong>{profile.job_title || "Role not listed"}</strong>{profile.department ? ` · ${profile.department}` : ""}</p>{profile.bio && <p className="admin-notice">{profile.bio}</p>}<h3>Skills</h3><div className="admin-chip-list">{profile.skills.length ? profile.skills.map((skill)=><span className="admin-chip" key={skill._id}>{skill.skill_name} · {skill.proficiency}</span>) : <span className="admin-secondary">No skills listed.</span>}</div><h3>Projects</h3>{profile.projects.length ? profile.projects.map((project)=><p key={project._id}><strong>{project.project_name}</strong> — {project.description}</p>) : <p className="admin-secondary">No projects listed.</p>}</> : <div className="admin-notice">The employee record could not be loaded.</div>}</section></div>}
  </div>;
}
