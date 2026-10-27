import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  UserRound,
  Search,
  Users,
  Award,
  BriefcaseBusiness,
  Network,
  ShieldCheck,
  Settings,
  LogOut,
  ArrowRight,
  TrendingUp,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";


function Dashboard() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();


  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /*
  ============================================================
  LOAD EMPLOYEES FROM MONGODB
  ============================================================
  */

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        "/api/employees"
      );

      const employeeData =
        Array.isArray(response.data)
          ? response.data
          : response.data?.employees || [];

      setEmployees(employeeData);

    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard information."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboardData();
  }, []);


  /*
  ============================================================
  CALCULATE UNIQUE SKILLS
  ============================================================
  */

  const allSkills = useMemo(() => {

    const skillMap = new Map();

    employees.forEach((employee) => {

      const skills =
        Array.isArray(employee.skills)
          ? employee.skills
          : [];

      skills.forEach((skillItem) => {

        let skillName = "";

        if (
          typeof skillItem === "string"
        ) {
          skillName =
            skillItem.trim();

        } else if (
          skillItem &&
          typeof skillItem === "object"
        ) {
          skillName =
            skillItem.skill_name ||
            skillItem.name ||
            skillItem.skill ||
            "";
        }

        if (!skillName) {
          return;
        }

        const normalized =
          skillName
            .toLowerCase()
            .trim();

        if (
          !skillMap.has(normalized)
        ) {
          skillMap.set(
            normalized,
            skillName
          );
        }

      });

    });

    return Array.from(
      skillMap.values()
    );

  }, [employees]);


  /*
  ============================================================
  SKILL FREQUENCY
  ============================================================
  */

  const topSkills = useMemo(() => {

    const skillCounts = new Map();

    employees.forEach((employee) => {

      const skills =
        Array.isArray(employee.skills)
          ? employee.skills
          : [];

      const employeeSkillSet =
        new Set();

      skills.forEach((skillItem) => {

        let skillName = "";

        if (
          typeof skillItem === "string"
        ) {
          skillName =
            skillItem.trim();

        } else if (
          skillItem &&
          typeof skillItem === "object"
        ) {
          skillName =
            skillItem.skill_name ||
            skillItem.name ||
            skillItem.skill ||
            "";
        }

        if (!skillName) {
          return;
        }

        const normalized =
          skillName
            .toLowerCase()
            .trim();

        if (
          employeeSkillSet.has(
            normalized
          )
        ) {
          return;
        }

        employeeSkillSet.add(
          normalized
        );

        if (
          !skillCounts.has(
            normalized
          )
        ) {
          skillCounts.set(
            normalized,
            {
              name: skillName,
              count: 0,
            }
          );
        }

        skillCounts.get(
          normalized
        ).count += 1;

      });

    });


    return Array.from(
      skillCounts.values()
    )
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 5);

  }, [employees]);


  /*
  ============================================================
  ALL PROJECTS
  ============================================================
  */

  const allProjects = useMemo(() => {

    const projects = [];

    employees.forEach((employee) => {

      const employeeProjects =
        Array.isArray(
          employee.projects
        )
          ? employee.projects
          : [];

      employeeProjects.forEach(
        (project, index) => {

          if (!project) {
            return;
          }

          let projectName = "";

          let description = "";

          let skillsUsed = [];

          let projectId =
            `${employee.username || "user"}-${index}`;


          if (
            typeof project === "string"
          ) {

            projectName =
              project;

          } else if (
            typeof project === "object"
          ) {

            projectName =
              project.project_name ||
              project.name ||
              "";

            description =
              project.description ||
              "";

            skillsUsed =
              Array.isArray(
                project.skills_used
              )
                ? project.skills_used
                : [];

            projectId =
              project._id ||
              project.id ||
              projectId;
          }


          if (!projectName) {
            return;
          }


          projects.push({

            id: projectId,

            projectName,

            description,

            skillsUsed,

            employeeName:
              employee.full_name ||
              employee.username ||
              "Unknown",

            username:
              employee.username ||
              "",

          });

        }
      );

    });


    return projects;

  }, [employees]);


  /*
  ============================================================
  DISPLAY NAME
  ============================================================
  */

  const displayName =
    user?.full_name ||
    user?.username ||
    "User";


  /*
  ============================================================
  LOGOUT
  ============================================================
  */

  const handleLogout = () => {

    logout();

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /*
  ============================================================
  ACTIVE SIDEBAR ITEM
  ============================================================
  */

  const isActive = (path) => {

    if (
      path === "/dashboard"
    ) {
      return (
        location.pathname ===
        "/dashboard"
      );
    }

    return location.pathname.startsWith(
      path
    );

  };


  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <style>
          {`

            .dashboard-loading {

              min-height: 100vh;

              display: flex;

              align-items: center;

              justify-content: center;

              background: #f6f8fc;

              color: #2563eb;

            }

            .dashboard-loading svg {

              animation:
                dashboard-spin
                0.8s linear infinite;

            }

            @keyframes dashboard-spin {

              to {

                transform:
                  rotate(360deg);

              }

            }

          `}
        </style>

        <LoaderCircle size={40} />

      </div>

    );

  }


  /*
  ============================================================
  DASHBOARD
  ============================================================
  */

  return (

    <div className="dashboard-layout">

      <style>
        {`

          * {
            box-sizing: border-box;
          }


          /* ==================================================
             MAIN LAYOUT
             ================================================== */

          .dashboard-layout {

            min-height: 100vh;

            display: flex;

            background: #f6f8fc;

            color: #172033;

            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;

          }


          /* ==================================================
             SIDEBAR
             ================================================== */

          .dashboard-sidebar {

            width: 250px;

            min-height: 100vh;

            position: fixed;

            left: 0;

            top: 0;

            bottom: 0;

            display: flex;

            flex-direction: column;

            background: #ffffff;

            border-right:
              1px solid #e5eaf1;

            z-index: 20;

          }


          .brand {

            height: 100px;

            display: flex;

            align-items: center;

            gap: 12px;

            padding:
              0 28px;

            border-bottom:
              1px solid #f1f3f7;

          }


          .brand-logo {

            width: 48px;

            height: 48px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 13px;

            background:
              #2563eb;

            color: #ffffff;

            font-size: 14px;

            font-weight: 800;

          }


          .brand-name {

            font-size: 20px;

            font-weight: 800;

            letter-spacing: -0.5px;

          }


          .brand-name span {

            color: #2563eb;

          }


          .sidebar-navigation {

            flex: 1;

            padding:
              28px 15px;

          }


          .sidebar-link {

            width: 100%;

            display: flex;

            align-items: center;

            gap: 15px;

            padding:
              13px 15px;

            margin-bottom: 8px;

            border-radius: 11px;

            color: #667085;

            text-decoration: none;

            font-size: 14px;

            font-weight: 600;

            transition:
              background 0.2s ease,
              color 0.2s ease;

          }


          .sidebar-link svg {

            flex-shrink: 0;

          }


          .sidebar-link:hover {

            background:
              #f2f6ff;

            color:
              #2563eb;

          }


          .sidebar-link.active {

            background:
              #eaf1ff;

            color:
              #2563eb;

          }


          .sidebar-bottom {

            padding:
              15px;

            border-top:
              1px solid #f1f3f7;

          }


          .logout-button {

            width: 100%;

            display: flex;

            align-items: center;

            gap: 15px;

            padding:
              13px 15px;

            border: none;

            border-radius: 11px;

            background:
              transparent;

            color: #667085;

            font-size: 14px;

            font-weight: 600;

            text-align: left;

          }


          .logout-button:hover {

            background:
              #fff2f2;

            color:
              #dc2626;

          }


          /* ==================================================
             MAIN CONTENT
             ================================================== */

          .dashboard-main {

            width: calc(100% - 250px);

            margin-left: 250px;

            padding:
              32px;

          }


          .dashboard-container {

            max-width: 1200px;

            margin:
              0 auto;

          }


          /* ==================================================
             WELCOME HEADER
             ================================================== */

          .dashboard-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 30px;

            padding:
              34px 38px;

            margin-bottom:
              26px;

            background:
              #ffffff;

            border:
              1px solid #e2e8f0;

            border-radius:
              18px;

            box-shadow:
              0 5px 22px
              rgba(30, 50, 80, 0.04);

          }


          .welcome-content {

            min-width: 0;

          }


          .welcome-label {

            margin-bottom: 8px;

            color:
              #2563eb;

            font-size:
              13px;

            font-weight:
              750;

          }


          .welcome-name {

            margin: 0;

            color:
              #172033;

            font-size:
              30px;

            line-height:
              1.15;

            font-weight:
              800;

            letter-spacing:
              -0.7px;

          }


          .welcome-description {

            margin:
              9px 0 0;

            color:
              #7b8494;

            font-size:
              14px;

            line-height:
              1.5;

          }


          /* ==================================================
             ERROR
             ================================================== */

          .dashboard-error {

            display: flex;

            align-items: center;

            gap: 9px;

            margin-bottom:
              20px;

            padding:
              13px 15px;

            border:
              1px solid #f1c4c4;

            border-radius:
              10px;

            background:
              #fff5f5;

            color:
              #b42318;

            font-size:
              12px;

          }


          /* ==================================================
             STATISTICS
             ================================================== */

          .dashboard-stats {

            display: grid;

            grid-template-columns:
              repeat(3, 1fr);

            gap:
              20px;

            margin-bottom:
              22px;

          }


          .stat-card {

            padding:
              25px;

            background:
              #ffffff;

            border:
              1px solid #e2e8f0;

            border-radius:
              17px;

            box-shadow:
              0 5px 22px
              rgba(30, 50, 80, 0.035);

          }


          .stat-icon {

            width:
              45px;

            height:
              45px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius:
              13px;

          }


          .stat-icon.blue {

            background:
              #edf4ff;

            color:
              #2563eb;

          }


          .stat-icon.purple {

            background:
              #f1edff;

            color:
              #7c3aed;

          }


          .stat-icon.green {

            background:
              #eafaf3;

            color:
              #059669;

          }


          .stat-number {

            margin-top:
              14px;

            font-size:
              29px;

            line-height:
              1;

            font-weight:
              800;

          }


          .stat-title {

            margin-top:
              9px;

            color:
              #667085;

            font-size:
              11px;

            font-weight:
              700;

          }


          .stat-description {

            margin-top:
              5px;

            color:
              #98a2b3;

            font-size:
              10px;

          }


          /* ==================================================
             CONTENT GRID
             ================================================== */

          .dashboard-grid {

            display: grid;

            grid-template-columns:
              1fr 1fr;

            gap:
              22px;

          }


          .dashboard-card {

            min-height:
              330px;

            padding:
              25px;

            background:
              #ffffff;

            border:
              1px solid #e2e8f0;

            border-radius:
              17px;

            box-shadow:
              0 5px 22px
              rgba(30, 50, 80, 0.035);

          }


          .card-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding-bottom:
              17px;

            border-bottom:
              1px solid #edf0f5;

          }


          .card-title {

            display: flex;

            align-items: center;

            gap:
              9px;

          }


          .card-title h2 {

            margin: 0;

            font-size:
              17px;

            font-weight:
              750;

          }


          .card-title-icon {

            color:
              #2563eb;

          }


          .view-link {

            display: flex;

            align-items: center;

            gap:
              5px;

            color:
              #2563eb;

            text-decoration:
              none;

            font-size:
              11px;

            font-weight:
              700;

          }


          .view-link:hover {

            text-decoration:
              underline;

          }


          /* ==================================================
             TOP SKILLS
             ================================================== */

          .skill-list {

            margin-top:
              22px;

          }


          .skill-row {

            display: grid;

            grid-template-columns:
              100px 1fr 25px;

            align-items:
              center;

            gap:
              12px;

            margin-bottom:
              19px;

          }


          .skill-name {

            overflow:
              hidden;

            color:
              #344054;

            font-size:
              11px;

            font-weight:
              700;

            white-space:
              nowrap;

            text-overflow:
              ellipsis;

          }


          .skill-track {

            height:
              9px;

            overflow:
              hidden;

            border-radius:
              20px;

            background:
              #edf1f7;

          }


          .skill-bar {

            height:
              100%;

            min-width:
              6px;

            border-radius:
              20px;

            background:
              linear-gradient(
                90deg,
                #2563eb,
                #7c3aed
              );

          }


          .skill-count {

            color:
              #344054;

            font-size:
              10px;

            font-weight:
              800;

            text-align:
              right;

          }


          /* ==================================================
             EMPLOYEES
             ================================================== */

          .employee-list {

            margin-top:
              15px;

          }


          .employee-row {

            display:
              flex;

            align-items:
              center;

            gap:
              12px;

            padding:
              11px 0;

            border-bottom:
              1px solid #f0f2f6;

          }


          .employee-row:last-child {

            border-bottom:
              none;

          }


          .employee-avatar {

            width:
              40px;

            height:
              40px;

            flex-shrink:
              0;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            border-radius:
              50%;

            background:
              #edf4ff;

            color:
              #2563eb;

            font-size:
              12px;

            font-weight:
              800;

          }


          .employee-info {

            min-width:
              0;

            flex:
              1;

          }


          .employee-name {

            color:
              #273248;

            font-size:
              12px;

            font-weight:
              750;

          }


          .employee-role {

            margin-top:
              3px;

            overflow:
              hidden;

            color:
              #98a2b3;

            font-size:
              9px;

            white-space:
              nowrap;

            text-overflow:
              ellipsis;

          }


          /* ==================================================
             PROJECTS
             ================================================== */

          .projects-card {

            margin-top:
              22px;

          }


          .project-list {

            margin-top:
              15px;

          }


          .project-row {

            display:
              flex;

            align-items:
              center;

            justify-content:
              space-between;

            gap:
              15px;

            padding:
              13px 0;

            border-bottom:
              1px solid #f0f2f6;

          }


          .project-row:last-child {

            border-bottom:
              none;

          }


          .project-info {

            min-width:
              0;

            flex:
              1;

          }


          .project-name {

            color:
              #273248;

            font-size:
              12px;

            font-weight:
              750;

          }


          .project-owner {

            margin-top:
              4px;

            color:
              #98a2b3;

            font-size:
              9px;

          }


          .project-skills {

            display:
              flex;

            flex-wrap:
              wrap;

            justify-content:
              flex-end;

            gap:
              5px;

          }


          .project-skill {

            padding:
              5px 8px;

            border-radius:
              12px;

            background:
              #edf4ff;

            color:
              #2563eb;

            font-size:
              8px;

            font-weight:
              700;

          }


          /* ==================================================
             EMPTY STATE
             ================================================== */

          .empty-state {

            min-height:
              220px;

            display:
              flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              center;

            text-align:
              center;

          }


          .empty-icon {

            width:
              55px;

            height:
              55px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            margin-bottom:
              12px;

            border-radius:
              14px;

            background:
              #f1f4f9;

            color:
              #98a2b3;

          }


          .empty-state h3 {

            margin:
              0;

            color:
              #667085;

            font-size:
              13px;

          }


          .empty-state p {

            max-width:
              320px;

            margin:
              6px 0 0;

            color:
              #98a2b3;

            font-size:
              10px;

            line-height:
              1.5;

          }


          /* ==================================================
             MOBILE
             ================================================== */

          @media (max-width: 1000px) {

            .dashboard-sidebar {

              width:
                215px;

            }

            .dashboard-main {

              width:
                calc(100% - 215px);

              margin-left:
                215px;

            }

            .dashboard-grid {

              grid-template-columns:
                1fr;

            }

          }


          @media (max-width: 750px) {

            .dashboard-sidebar {

              width:
                70px;

            }

            .brand {

              justify-content:
                center;

              padding:
                0;

            }

            .brand-name {

              display:
                none;

            }

            .sidebar-link {

              justify-content:
                center;

              padding:
                13px;

            }

            .sidebar-link span {

              display:
                none;

            }

            .sidebar-bottom {

              padding:
                10px;

            }

            .logout-button {

              justify-content:
                center;

            }

            .logout-button span {

              display:
                none;

            }

            .dashboard-main {

              width:
                calc(100% - 70px);

              margin-left:
                70px;

              padding:
                20px;

            }

            .dashboard-stats {

              grid-template-columns:
                1fr;

            }

            .dashboard-header {

              padding:
                25px;

            }

          }


          @media (max-width: 500px) {

            .dashboard-main {

              padding:
                12px;

            }

            .welcome-name {

              font-size:
                25px;

            }

            .dashboard-header {

              padding:
                22px;

            }

          }

        `}
      </style>


      {/* =====================================================
          SIDEBAR
         ===================================================== */}

      <aside className="dashboard-sidebar">


        {/* BRAND */}

        <div className="brand">

          <div className="brand-logo">
            SC
          </div>

          <div className="brand-name">
            Skill<span>Connect</span>
          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="sidebar-navigation">


          <Link
            to="/dashboard"
            className={
              `sidebar-link ${
                isActive("/dashboard")
                  ? "active"
                  : ""
              }`
            }
          >

            <LayoutDashboard
              size={20}
            />

            <span>
              Dashboard
            </span>

          </Link>


          <Link
            to="/profile"
            className={
              `sidebar-link ${
                isActive("/profile")
                  ? "active"
                  : ""
              }`
            }
          >

            <UserRound
              size={20}
            />

            <span>
              My Profile
            </span>

          </Link>


          <Link
            to="/find-people"
            className={
              `sidebar-link ${
                isActive("/find-people")
                  ? "active"
                  : ""
              }`
            }
          >

            <Search
              size={20}
            />

            <span>
              Find People
            </span>

          </Link>


          <Link
            to="/employees"
            className={
              `sidebar-link ${
                isActive("/employees")
                  ? "active"
                  : ""
              }`
            }
          >

            <Users
              size={20}
            />

            <span>
              Employees
            </span>

          </Link>


          <Link
            to="/skills"
            className={
              `sidebar-link ${
                isActive("/skills")
                  ? "active"
                  : ""
              }`
            }
          >

            <Award
              size={20}
            />

            <span>
              Skills
            </span>

          </Link>


          <Link
            to="/projects"
            className={
              `sidebar-link ${
                isActive("/projects")
                  ? "active"
                  : ""
              }`
            }
          >

            <BriefcaseBusiness
              size={20}
            />

            <span>
              Projects
            </span>

          </Link>


          <Link
            to="/skill-insights"
            className={
              `sidebar-link ${
                isActive(
                  "/skill-insights"
                )
                  ? "active"
                  : ""
              }`
            }
          >

            <Network
              size={20}
            />

            <span>
              Skill Insights
            </span>

          </Link>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`sidebar-link ${isActive("/admin") ? "active" : ""}`}
            >
              <ShieldCheck size={20} />
              <span>Admin Console</span>
            </Link>
          )}


          <Link
            to="/settings"
            className={
              `sidebar-link ${
                isActive("/settings")
                  ? "active"
                  : ""
              }`
            }
          >

            <Settings
              size={20}
            />

            <span>
              Settings
            </span>

          </Link>


        </nav>


        {/* LOGOUT */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >

            <LogOut
              size={20}
            />

            <span>
              Logout
            </span>

          </button>

        </div>


      </aside>


      {/* =====================================================
          MAIN CONTENT
         ===================================================== */}

      <main className="dashboard-main">

        <div className="dashboard-container">


          {/* =================================================
              WELCOME HEADER
             ================================================= */}

          <section className="dashboard-header">

            <div className="welcome-content">

              <div className="welcome-label">
                Welcome back
              </div>

              <h1 className="welcome-name">
                {displayName}
              </h1>

              <p className="welcome-description">
                Explore the skills and expertise
                available across your organization.
              </p>

            </div>

          </section>


          {/* =================================================
              ERROR
             ================================================= */}

          {error && (

            <div className="dashboard-error">

              <AlertCircle
                size={16}
              />

              {error}

            </div>

          )}


          {/* =================================================
              STATISTICS
             ================================================= */}

          <section className="dashboard-stats">


            {/* EMPLOYEES */}

            <div className="stat-card">

              <div className="stat-icon blue">

                <Users
                  size={21}
                />

              </div>

              <div className="stat-number">

                {employees.length}

              </div>

              <div className="stat-title">
                Total Employees
              </div>

              <div className="stat-description">
                People in SkillConnect
              </div>

            </div>


            {/* SKILLS */}

            <div className="stat-card">

              <div className="stat-icon purple">

                <Award
                  size={21}
                />

              </div>

              <div className="stat-number">

                {allSkills.length}

              </div>

              <div className="stat-title">
                Total Skills
              </div>

              <div className="stat-description">
                Unique skills in the organization
              </div>

            </div>


            {/* PROJECTS */}

            <div className="stat-card">

              <div className="stat-icon green">

                <BriefcaseBusiness
                  size={21}
                />

              </div>

              <div className="stat-number">

                {allProjects.length}

              </div>

              <div className="stat-title">
                Total Projects
              </div>

              <div className="stat-description">
                Projects connected to employees
              </div>

            </div>


          </section>


          {/* =================================================
              TOP SKILLS + EMPLOYEES
             ================================================= */}

          <section className="dashboard-grid">


            {/* TOP SKILLS */}

            <div className="dashboard-card">

              <div className="card-header">

                <div className="card-title">

                  <TrendingUp
                    size={18}
                    className="card-title-icon"
                  />

                  <h2>
                    Top Skills
                  </h2>

                </div>


                <Link
                  to="/skills"
                  className="view-link"
                >

                  View all

                  <ArrowRight
                    size={14}
                  />

                </Link>

              </div>


              {topSkills.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">

                    <Award
                      size={25}
                    />

                  </div>

                  <h3>
                    No skills available
                  </h3>

                  <p>
                    Skills added by employees
                    will appear here automatically.
                  </p>

                </div>

              ) : (

                <div className="skill-list">

                  {topSkills.map(
                    (skill) => {

                      const maximum =
                        topSkills[0]?.count ||
                        1;

                      const width =
                        (
                          skill.count /
                          maximum
                        ) * 100;


                      return (

                        <div
                          className="skill-row"
                          key={
                            skill.name
                          }
                        >

                          <div className="skill-name">
                            {skill.name}
                          </div>

                          <div className="skill-track">

                            <div
                              className="skill-bar"
                              style={{
                                width:
                                  `${width}%`,
                              }}
                            />

                          </div>

                          <div className="skill-count">
                            {skill.count}
                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

            </div>


            {/* EMPLOYEE DIRECTORY */}

            <div className="dashboard-card">

              <div className="card-header">

                <div className="card-title">

                  <Users
                    size={18}
                    className="card-title-icon"
                  />

                  <h2>
                    Employee Directory
                  </h2>

                </div>


                <Link
                  to="/employees"
                  className="view-link"
                >

                  View all

                  <ArrowRight
                    size={14}
                  />

                </Link>

              </div>


              {employees.length === 0 ? (

                <div className="empty-state">

                  <div className="empty-icon">

                    <Users
                      size={25}
                    />

                  </div>

                  <h3>
                    No employees found
                  </h3>

                  <p>
                    Employee information will
                    appear here when available.
                  </p>

                </div>

              ) : (

                <div className="employee-list">

                  {employees
                    .slice(0, 5)
                    .map(
                      (employee) => {

                        const name =
                          employee.full_name ||
                          employee.username ||
                          "Unknown";


                        const initials =
                          name
                            .split(" ")
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();


                        return (

                          <div
                            className="employee-row"
                            key={
                              employee.id ||
                              employee._id ||
                              employee.username
                            }
                          >

                            <div className="employee-avatar">

                              {initials}

                            </div>


                            <div className="employee-info">

                              <div className="employee-name">

                                {name}

                              </div>


                              <div className="employee-role">

                                {employee.job_title ||
                                  employee.department ||
                                  employee.email ||
                                  "Employee"}

                              </div>

                            </div>

                          </div>

                        );

                      }
                    )}

                </div>

              )}

            </div>


          </section>


          {/* =================================================
              RECENT PROJECTS
             ================================================= */}

          <section className="dashboard-card projects-card">

            <div className="card-header">

              <div className="card-title">

                <BriefcaseBusiness
                  size={18}
                  className="card-title-icon"
                />

                <h2>
                  Recent Projects
                </h2>

              </div>


              <Link
                to="/projects"
                className="view-link"
              >

                View all

                <ArrowRight
                  size={14}
                />

              </Link>

            </div>


            {allProjects.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">

                  <BriefcaseBusiness
                    size={25}
                  />

                </div>

                <h3>
                  No projects available
                </h3>

                <p>
                  Projects added by employees
                  will appear here automatically.
                </p>

              </div>

            ) : (

              <div className="project-list">

                {allProjects
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map(
                    (project) => (

                      <div
                        className="project-row"
                        key={
                          project.id
                        }
                      >

                        <div className="project-info">

                          <div className="project-name">

                            {project.projectName}

                          </div>


                          <div className="project-owner">

                            Added by{" "}

                            {project.employeeName}

                          </div>

                        </div>


                        {project.skillsUsed
                          .length > 0 && (

                          <div className="project-skills">

                            {project.skillsUsed
                              .slice(0, 5)
                              .map(
                                (skill) => (

                                  <span
                                    className="project-skill"
                                    key={
                                      skill
                                    }
                                  >
                                    {skill}
                                  </span>

                                )
                              )}

                          </div>

                        )}

                      </div>

                    )
                  )}

              </div>

            )}

          </section>


        </div>

      </main>

    </div>

  );

}


export default Dashboard;

