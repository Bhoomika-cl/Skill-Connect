import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Award, BriefcaseBusiness, Users } from "lucide-react";
import API from "../services/api.js";

async function fetchAllProjects() {
  const { data: first } = await API.get("/api/admin/discover", { params: { type: "projects", page_size: 100, page: 1, sort: "name" } });
  const remaining = await Promise.all(Array.from({ length: Math.max(0, (first.pages || 1) - 1) }, (_, index) => API.get("/api/admin/discover", { params: { type: "projects", page_size: 100, page: index + 2, sort: "name" } })));
  return [first, ...remaining.map((response) => response.data)].flatMap((page) => page.items || []);
}

export default function AdminReports() {
  const [overview,setOverview]=useState(null); const [analytics,setAnalytics]=useState(null); const [gaps,setGaps]=useState(null); const [projects,setProjects]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  useEffect(()=>{let active=true;Promise.all([API.get("/api/admin/overview"),API.get("/api/skills/analytics"),API.get("/api/skills/gaps"),fetchAllProjects()]).then(([a,b,c,d])=>{if(!active)return;setOverview(a.data);setAnalytics(b.data);setGaps(c.data);setProjects(d);}).catch((e)=>{if(active)setError(e.response?.data?.detail||"Unable to load workforce reports.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const skillRows=useMemo(()=>analytics?.popular_skills||[],[analytics]);
  const projectsByOwner=useMemo(()=>{const groups=new Map();projects.forEach((project)=>{const name=project.employee_name||"Unassigned";groups.set(name,(groups.get(name)||0)+1);});return [...groups].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,6);},[projects]);
  const metricCards=[["Employee accounts",overview?.employees,Users,"blue"],["Unique skills",analytics?.total_unique_skills,Activity,"purple"],["Projects",overview?.projects,BriefcaseBusiness,"green"],["Pending certification reviews",overview?.pending_certifications,Award,"orange"]];
  return <div className="admin-page">
    <div className="admin-page-head"><div><span className="admin-eyebrow">Reports & insights</span><h1>Workforce capability</h1><p>Skill distribution, coverage gaps, project allocation, and certification review status from existing records.</p></div></div>
    {error&&<div className="admin-alert" role="alert">{error}</div>}
    <div className="admin-grid stats">{metricCards.map(([label,value,Icon,tone])=><section className="admin-stat" key={label}><span className={`admin-stat-icon ${tone}`}><Icon size={16}/></span><div><span className="admin-stat-label">{label}</span><strong>{loading?"—":value??0}</strong></div></section>)}</div>
    {loading?<div className="admin-loading">Loading reports…</div>:<>
      <div className="admin-two-col">
        <section className="admin-panel"><div className="admin-panel-head"><div><h2>Most common skills</h2><p>Unique employee counts from recorded skill entries.</p></div></div>{skillRows.length?<div style={{width:"100%",height:250}}><ResponsiveContainer><BarChart data={skillRows.slice(0,8)} margin={{top:8,right:12,bottom:25,left:-12}}><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="skill_name" angle={-18} textAnchor="end" interval={0} tick={{fontSize:9,fill:"#71809a"}}/><YAxis allowDecimals={false} tick={{fontSize:9,fill:"#71809a"}}/><Tooltip/><Bar dataKey="user_count" name="Employees" fill="#3972e8" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>:<div className="admin-empty">No skill data is available.</div>}</section>
        <section className="admin-panel"><div className="admin-panel-head"><div><h2>Lowest skill coverage</h2><p>Skills with the fewest recorded employees appear first.</p></div></div>{gaps?.skill_gaps?.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Skill</th><th>Employees</th><th>Coverage</th></tr></thead><tbody>{gaps.skill_gaps.slice(0,8).map((item)=><tr key={item.skill_name}><td><strong>{item.skill_name}</strong></td><td>{item.employee_count}</td><td>{item.coverage_percentage}%</td></tr>)}</tbody></table></div>:<div className="admin-empty">No skill coverage records yet.</div>}</section>
      </div>
      <div className="admin-two-col">
        <section className="admin-panel"><div className="admin-panel-head"><div><h2>Project allocation</h2><p>Counts of recorded projects by employee owner.</p></div></div>{projectsByOwner.length?<div style={{width:"100%",height:230}}><ResponsiveContainer><BarChart data={projectsByOwner} layout="vertical" margin={{top:0,right:18,bottom:0,left:8}}><CartesianGrid stroke="#edf1f6" horizontal={false}/><XAxis type="number" allowDecimals={false} tick={{fontSize:9,fill:"#71809a"}}/><YAxis type="category" dataKey="name" width={100} tick={{fontSize:9,fill:"#71809a"}}/><Tooltip/><Bar dataKey="count" name="Projects" fill="#29a36a" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div>:<div className="admin-empty">No project allocation data is available.</div>}</section>
        <section className="admin-panel"><div className="admin-panel-head"><div><h2>Certification status</h2><p>Review states from employee-submitted certifications.</p></div></div><div className="admin-grid" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))"}}>{[["Awaiting review",overview?.pending_certifications,"warning"],["Verified",overview?.verified_certifications,"success"],["Rejected",overview?.rejected_certifications,"danger"],["Total records",overview?.certifications,"info"]].map(([label,value,tone])=><div className="admin-stat" key={label}><div><span className="admin-stat-label">{label}</span><strong>{value??0}</strong><span className={`admin-pill ${tone}`}>{label}</span></div></div>)}</div><p className="admin-notice" style={{marginTop:12}}>Coverage is based only on saved records and is not a guarantee of employee suitability.</p></section>
      </div>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Skill proficiency mix</h2><p>Counts from proficiency values stored on employee skill records.</p></div></div><div className="admin-grid stats">{Object.entries(analytics?.overall_proficiency||{}).map(([label,value])=><div className="admin-stat" key={label}><div><span className="admin-stat-label">{label}</span><strong>{value}</strong></div></div>)}</div></section>
    </>}
  </div>;
}
