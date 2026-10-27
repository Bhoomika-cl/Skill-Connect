import { useEffect, useState } from "react";
import { Check, LoaderCircle, MonitorCog, ShieldCheck, UserRound } from "lucide-react";
import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const defaults = { compact_tables: false, reduce_motion: false };

function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    API.get("/api/preferences").then(({ data }) => {
      if (active) setPreferences({ ...defaults, ...(data.preferences || {}) });
    }).catch((err) => {
      if (active) setError(err.response?.data?.detail || "Could not load account preferences.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("skillconnect-compact-tables", preferences.compact_tables);
    document.body.classList.toggle("skillconnect-reduce-motion", preferences.reduce_motion);
    return () => {
      document.body.classList.remove("skillconnect-compact-tables", "skillconnect-reduce-motion");
    };
  }, [preferences]);

  const update = (key) => {
    setMessage("");
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const { data } = await API.put("/api/preferences", preferences);
      setPreferences({ ...defaults, ...(data.preferences || {}) });
      setMessage("Your preferences are saved.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save your preferences.");
    } finally { setSaving(false); }
  };

  const roleName = user?.role === "admin" ? "Administrator" : "Employee";

  return <div className="account-preferences-page">
    <style>{`
      .account-preferences-page{max-width:980px;margin:0 auto;color:#172033}.preferences-heading{margin:4px 0 22px}.preferences-heading small{font-size:11px;letter-spacing:.1em;font-weight:800;color:#71819a}.preferences-heading h1{font-size:30px;margin:7px 0}.preferences-heading p{color:#71819a;margin:0}
      .preferences-card{background:#fff;border:1px solid #e0e8f3;border-radius:16px;padding:22px;margin:16px 0;box-shadow:0 4px 14px #25395b08}.preferences-card h2{font-size:18px;margin:0 0 6px}.preferences-card>p{color:#71819a;font-size:13px;margin:0 0 17px}.preferences-account-row{display:flex;align-items:center;gap:14px;padding:12px 0}.preferences-icon{width:42px;height:42px;border-radius:12px;background:#eaf1ff;color:#2563eb;display:grid;place-items:center}.preferences-account-row strong,.preferences-account-row small{display:block}.preferences-account-row small{margin-top:4px;color:#71819a}.preferences-badge{margin-left:auto;padding:6px 10px;border-radius:20px;background:#eaf1ff;color:#245ce5;font-size:12px;font-weight:700}
      .preferences-option{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:15px 0;border-top:1px solid #edf1f7}.preferences-option strong,.preferences-option small{display:block}.preferences-option small{margin-top:4px;color:#71819a;font-size:12px}.preferences-switch{position:relative;width:44px;height:24px;flex:0 0 auto}.preferences-switch input{opacity:0;width:1px;height:1px;position:absolute}.preferences-switch span{position:absolute;inset:0;border-radius:99px;background:#cbd5e1;cursor:pointer;transition:background .2s}.preferences-switch span:before{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}.preferences-switch input:checked+span{background:#2563eb}.preferences-switch input:checked+span:before{transform:translateX(20px)}.preferences-switch input:focus-visible+span{outline:3px solid #a9c4ff;outline-offset:2px}
      .preferences-notice{padding:11px 14px;border-radius:9px;margin:12px 0}.preferences-error{background:#fff1f1;color:#a72828}.preferences-success{background:#effaf3;color:#13824b}.preferences-save{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:9px;padding:11px 16px;background:#2563eb;color:white;font-weight:700;cursor:pointer}.preferences-save:disabled{opacity:.6;cursor:wait}.preferences-loading{display:flex;align-items:center;gap:9px;color:#71819a;padding:24px}
      body.skillconnect-compact-tables table td,body.skillconnect-compact-tables table th{padding-top:7px!important;padding-bottom:7px!important}body.skillconnect-reduce-motion *,body.skillconnect-reduce-motion *::before,body.skillconnect-reduce-motion *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
      @media(max-width:640px){.preferences-card{padding:16px}.preferences-option{gap:12px}.preferences-heading h1{font-size:25px}}
    `}</style>
    <div className="preferences-heading"><small>ACCOUNT SETTINGS</small><h1>Account preferences</h1><p>Personalize how SkillConnect looks and check the account you are signed in with.</p></div>
    {loading ? <div className="preferences-loading"><LoaderCircle size={18}/>Loading your preferences…</div> : <>
      {error && <div className="preferences-notice preferences-error" role="alert">{error}</div>}
      {message && <div className="preferences-notice preferences-success" role="status">{message}</div>}
      <section className="preferences-card"><h2>Your account</h2><p>These details come from the account currently signed in.</p>
        <div className="preferences-account-row"><div className="preferences-icon"><UserRound size={20}/></div><div><strong>{user?.full_name || user?.username || "SkillConnect user"}</strong><small>{user?.email || "No email available"}</small></div><span className="preferences-badge">{roleName}</span></div>
      </section>
      <form onSubmit={save}>
        <section className="preferences-card"><h2>Display preferences</h2><p>These settings apply to your SkillConnect workspace.</p>
          <label className="preferences-option"><span><strong>Compact tables</strong><small>Use tighter row spacing in tables to show more information at once.</small></span><span className="preferences-switch"><input type="checkbox" checked={preferences.compact_tables} onChange={()=>update("compact_tables")}/><span/></span></label>
          <label className="preferences-option"><span><strong>Reduce motion</strong><small>Reduce interface animations and transitions.</small></span><span className="preferences-switch"><input type="checkbox" checked={preferences.reduce_motion} onChange={()=>update("reduce_motion")}/><span/></span></label>
        </section>
        <section className="preferences-card"><h2><ShieldCheck size={18} style={{verticalAlign:"middle",marginRight:8}}/>Sign-in and access</h2><p>Your account role is assigned by an administrator. Preferences here do not change your role or sign-in method.</p><div className="preferences-account-row"><div className="preferences-icon"><MonitorCog size={20}/></div><div><strong>{roleName} workspace</strong><small>Sign out from the top-right menu when you are finished on a shared computer.</small></div></div></section>
        <button className="preferences-save" disabled={saving}><Check size={16}/>{saving ? "Saving…" : "Save preferences"}</button>
      </form>
    </>}
  </div>;
}

export default Settings;
