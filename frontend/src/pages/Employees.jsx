import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  UserRound,
  Users,
  ShieldCheck,
  X,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Employees() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("All Departments");

  const [sortBy, setSortBy] =
    useState("Name");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  /*
   * ==========================================================
   * LOAD EMPLOYEES
   * ==========================================================
   */

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get(
          "/api/employees"
        );

      console.log(
        "Employees API response:",
        response.data
      );

      let employeeList = [];

      if (
        Array.isArray(response.data)
      ) {
        employeeList =
          response.data;
      } else if (
        Array.isArray(
          response.data?.employees
        )
      ) {
        employeeList =
          response.data.employees;
      } else if (
        Array.isArray(
          response.data?.data
        )
      ) {
        employeeList =
          response.data.data;
      } else if (
        Array.isArray(
          response.data?.results
        )
      ) {
        employeeList =
          response.data.results;
      }

      setEmployees(
        employeeList
      );
    } catch (err) {
      console.error(
        "Employees API error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load employees."
        );
      } else if (err.request) {
        setError(
          "The backend did not respond. Make sure FastAPI is running."
        );
      } else {
        setError(
          err.message ||
            "Unable to load employees."
        );
      }

      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  /*
   * ==========================================================
   * VIEW PROFILE
   * ==========================================================
   */

  const handleViewProfile = async (
    employee
  ) => {
    const userId =
      employee?.user_id ||
      employee?.id ||
      employee?._id;

    if (!userId) {
      setError(
        "This employee does not have a valid user ID."
      );
      return;
    }

    try {
      setProfileLoading(true);
      setError("");

      const response =
        await API.get(
          `/api/profile/${userId}`
        );

      const profile =
        response.data?.profile ||
        response.data;

      setSelectedEmployee(
        profile
      );
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load employee profile."
        );
      } else {
        setError(
          "Unable to load employee profile."
        );
      }
    } finally {
      setProfileLoading(false);
    }
  };

  /*
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /*
   * ==========================================================
   * DATA HELPERS
   * ==========================================================
   */

  const getName = (
    employee
  ) => {
    return (
      employee?.full_name ||
      employee?.name ||
      employee?.username ||
      "Employee"
    );
  };

  const getUsername = (
    employee
  ) => {
    return (
      employee?.username ||
      ""
    );
  };

  const getEmail = (
    employee
  ) => {
    return (
      employee?.email ||
      ""
    );
  };

  const getDepartment = (
    employee
  ) => {
    return (
      employee?.department ||
      ""
    );
  };

  const getJobTitle = (
    employee
  ) => {
    return (
      employee?.job_title ||
      employee?.role ||
      ""
    );
  };

  const getSkills = (
    employee
  ) => {
    if (
      Array.isArray(
        employee?.skills
      )
    ) {
      return employee.skills;
    }

    return [];
  };

  const getSkillName = (
    skill
  ) => {
    if (
      typeof skill === "string"
    ) {
      return skill;
    }

    return (
      skill?.skill_name ||
      skill?.name ||
      skill?.title ||
      "Skill"
    );
  };

  const getProjects = (
    employee
  ) => {
    if (
      Array.isArray(
        employee?.projects
      )
    ) {
      return employee.projects;
    }

    return [];
  };

  const getProjectName = (
    project
  ) => {
    if (
      typeof project === "string"
    ) {
      return project;
    }

    return (
      project?.project_name ||
      project?.name ||
      "Project"
    );
  };

  const getInitials = (
    employee
  ) => {
    const name =
      getName(employee).trim();

    if (!name) {
      return "U";
    }

    const parts =
      name.split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  };

  /*
   * ==========================================================
   * DEPARTMENTS
   * ==========================================================
   */

  const departments = useMemo(() => {
    const values =
      employees
        .map(
          (employee) =>
            getDepartment(
              employee
            )
        )
        .filter(Boolean);

    return [
      "All Departments",
      ...Array.from(
        new Set(values)
      ),
    ];
  }, [employees]);

  /*
   * ==========================================================
   * FILTER + SEARCH + SORT
   * ==========================================================
   */

  const displayedEmployees =
    useMemo(() => {
      let list =
        [...employees];

      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (search) {
        list =
          list.filter(
            (employee) => {
              const name =
                getName(
                  employee
                ).toLowerCase();

              const username =
                getUsername(
                  employee
                ).toLowerCase();

              const email =
                getEmail(
                  employee
                ).toLowerCase();

              const department =
                getDepartment(
                  employee
                ).toLowerCase();

              const jobTitle =
                getJobTitle(
                  employee
                ).toLowerCase();

              const skills =
                getSkills(
                  employee
                )
                  .map(
                    getSkillName
                  )
                  .join(" ")
                  .toLowerCase();

              return (
                name.includes(
                  search
                ) ||
                username.includes(
                  search
                ) ||
                email.includes(
                  search
                ) ||
                department.includes(
                  search
                ) ||
                jobTitle.includes(
                  search
                ) ||
                skills.includes(
                  search
                )
              );
            }
          );
      }

      if (
        departmentFilter !==
        "All Departments"
      ) {
        list =
          list.filter(
            (employee) =>
              getDepartment(
                employee
              ).toLowerCase() ===
              departmentFilter.toLowerCase()
          );
      }

      if (
        sortBy === "Name"
      ) {
        list.sort(
          (a, b) =>
            getName(a).localeCompare(
              getName(b)
            )
        );
      }

      if (
        sortBy === "Skills"
      ) {
        list.sort(
          (a, b) =>
            getSkills(b).length -
            getSkills(a).length
        );
      }

      if (
        sortBy === "Projects"
      ) {
        list.sort(
          (a, b) =>
            getProjects(b).length -
            getProjects(a).length
        );
      }

      return list;
    }, [
      employees,
      searchTerm,
      departmentFilter,
      sortBy,
    ]);

  /*
   * ==========================================================
   * PAGE STYLES
   * ==========================================================
   */

  const styles = `
    .employees-page {
      min-height: 100vh;
      display: flex;
      background: #f7f9fc;
      color: #172033;
    }

    .employees-sidebar {
      position: fixed;
      z-index: 30;
      left: 0;
      top: 0;
      bottom: 0;
      width: 245px;
      padding: 25px 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      border-right: 1px solid #e7ebf1;
    }

    .employees-brand {
      padding: 0 10px;
      display: flex;
      align-items: center;
      gap: 9px;
      color: #172033;
      font-size: 18px;
      font-weight: 760;
      letter-spacing: -0.5px;
      text-decoration: none;
    }

    .employees-brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2563eb;
      color: white;
      font-size: 11px;
      font-weight: 800;
    }

    .employees-brand span span {
      color: #2563eb;
    }

    .employees-navigation {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .employees-nav-item {
      min-height: 43px;
      padding: 0 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 11px;
      color: #667085;
      font-size: 12px;
      font-weight: 620;
      text-decoration: none;
      transition: 0.2s ease;
    }

    .employees-nav-item:hover {
      background: #f3f6fb;
      color: #2563eb;
    }

    .employees-nav-active {
      background: #edf4ff;
      color: #2563eb;
      font-weight: 700;
    }

    .employees-sidebar-bottom {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .employees-logout {
      width: 100%;
      min-height: 43px;
      padding: 0 12px;
      border: none;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 11px;
      background: transparent;
      color: #667085;
      font-size: 12px;
      font-weight: 620;
      cursor: pointer;
      text-align: left;
    }

    .employees-logout:hover {
      background: #fff3f3;
      color: #d92d20;
    }

    .employees-main {
      width: calc(100% - 245px);
      min-height: 100vh;
      margin-left: 245px;
    }

    .employees-header {
      min-height: 82px;
      padding: 0 40px;
      border-bottom: 1px solid #e7ebf1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }

    .employees-header-label {
      margin: 0 0 3px;
      color: #8b95a6;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .employees-header-title {
      margin: 0;
      color: #172033;
      font-size: 21px;
      font-weight: 750;
    }

    .employees-header-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .employees-user-text {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .employees-user-text strong {
      color: #344054;
      font-size: 10px;
    }

    .employees-user-text span {
      color: #98a2b3;
      font-size: 8px;
    }

    .employees-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8f0ff;
      color: #2563eb;
      font-size: 10px;
      font-weight: 800;
      text-decoration: none;
    }

    .employees-content {
      width: min(1050px, calc(100% - 70px));
      margin: 0 auto;
      padding: 35px 0 60px;
    }

    .employees-intro {
      margin-bottom: 22px;
    }

    .employees-intro-label {
      margin: 0 0 5px;
      color: #2563eb;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .employees-intro h2 {
      margin: 0;
      color: #172033;
      font-size: 25px;
      font-weight: 760;
      letter-spacing: -0.7px;
    }

    .employees-intro p {
      margin: 7px 0 0;
      color: #7b8494;
      font-size: 11px;
    }

    .employees-toolbar {
      padding: 20px;
      border: 1px solid #e3e8f0;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 5px 20px rgba(31, 47, 72, 0.035);
    }

    .employees-search-row {
      display: flex;
      gap: 10px;
    }

    .employees-search {
      position: relative;
      flex: 1;
    }

    .employees-search svg {
      position: absolute;
      left: 13px;
      top: 13px;
      color: #98a2b3;
    }

    .employees-search input {
      width: 100%;
      height: 43px;
      padding: 0 13px 0 40px;
      border: 1px solid #dfe5ed;
      border-radius: 8px;
      outline: none;
      color: #273248;
      font-size: 11px;
    }

    .employees-search input:focus {
      border-color: #8bb1f5;
      box-shadow: 0 0 0 3px #edf4ff;
    }

    .employees-filter-row {
      margin-top: 13px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .employees-filter-group {
      display: flex;
      gap: 9px;
    }

    .employees-select {
      position: relative;
    }

    .employees-select select {
      height: 36px;
      min-width: 155px;
      padding: 0 30px 0 11px;
      border: 1px solid #e0e6ee;
      border-radius: 7px;
      appearance: none;
      background: #ffffff;
      color: #667085;
      outline: none;
      font-size: 9px;
      cursor: pointer;
    }

    .employees-select svg {
      position: absolute;
      right: 10px;
      top: 11px;
      color: #98a2b3;
      pointer-events: none;
    }

    .employees-count-row {
      margin: 25px 0 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .employees-count {
      color: #667085;
      font-size: 10px;
    }

    .employees-count strong {
      color: #273248;
      font-weight: 750;
    }

    .employees-refresh {
      border: none;
      background: transparent;
      color: #2563eb;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
    }

    .employees-refresh:hover {
      text-decoration: underline;
    }

    .employees-error {
      margin-top: 18px;
      padding: 13px 15px;
      border: 1px solid #f2c6c8;
      border-radius: 9px;
      background: #fff5f5;
      color: #b42318;
      font-size: 10px;
    }

    .employees-loading {
      min-height: 250px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 9px;
      color: #7b8494;
      font-size: 10px;
    }

    .employees-spinner {
      animation: employees-spin 0.8s linear infinite;
    }

    @keyframes employees-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .employees-empty {
      padding: 55px 20px;
      border: 1px dashed #d9e0e9;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      background: #ffffff;
      color: #98a2b3;
      text-align: center;
    }

    .employees-empty strong {
      color: #667085;
      font-size: 11px;
    }

    .employees-empty span {
      max-width: 430px;
      font-size: 9px;
      line-height: 1.5;
    }

    .employees-grid {
      display: grid;
      grid-template-columns: repeat(
        2,
        minmax(0, 1fr)
      );
      gap: 13px;
    }

    .employee-card {
      padding: 19px;
      border: 1px solid #e3e8f0;
      border-radius: 12px;
      background: #ffffff;
      transition: 0.2s ease;
    }

    .employee-card:hover {
      border-color: #d2def2;
      box-shadow: 0 8px 25px rgba(31, 47, 72, 0.055);
      transform: translateY(-1px);
    }

    .employee-card-top {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .employee-card-avatar {
      width: 51px;
      height: 51px;
      flex-shrink: 0;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8f0ff;
      color: #2563eb;
      font-size: 13px;
      font-weight: 800;
    }

    .employee-card-info {
      min-width: 0;
      flex: 1;
    }

    .employee-card-name {
      margin: 0;
      color: #273248;
      font-size: 13px;
      font-weight: 750;
    }

    .employee-card-role {
      margin-top: 4px;
      color: #7b8494;
      font-size: 9px;
    }

    .employee-card-email {
      margin-top: 5px;
      color: #98a2b3;
      font-size: 8px;
      overflow-wrap: anywhere;
    }

    .employee-view {
      width: 31px;
      height: 31px;
      flex-shrink: 0;
      border: 1px solid #dce5f3;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      color: #2563eb;
      cursor: pointer;
    }

    .employee-view:hover {
      background: #edf4ff;
    }

    .employee-meta {
      margin-top: 15px;
      padding-top: 13px;
      border-top: 1px solid #eef1f5;
      display: flex;
      flex-wrap: wrap;
      gap: 9px 14px;
    }

    .employee-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #7b8494;
      font-size: 8px;
    }

    .employee-meta-item svg {
      color: #98a2b3;
    }

    .employee-skills {
      margin-top: 14px;
    }

    .employee-section-label {
      margin-bottom: 7px;
      color: #8b95a6;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    .employee-skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .employee-skill {
      padding: 5px 7px;
      border-radius: 5px;
      background: #edf4ff;
      color: #2563eb;
      font-size: 8px;
      font-weight: 700;
    }

    .employee-more {
      padding: 5px 7px;
      border-radius: 5px;
      background: #f2f4f7;
      color: #667085;
      font-size: 8px;
      font-weight: 700;
    }

    /* MODAL */

    .employee-modal-overlay {
      position: fixed;
      z-index: 100;
      inset: 0;
      padding: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.45);
    }

    .employee-modal {
      width: min(680px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 25px 70px rgba(15, 23, 42, 0.2);
    }

    .employee-modal-header {
      padding: 20px 22px;
      border-bottom: 1px solid #eef1f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .employee-modal-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f6fa;
      color: #667085;
      cursor: pointer;
    }

    .employee-modal-body {
      padding: 25px;
    }

    .employee-modal-profile {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .employee-modal-avatar {
      width: 65px;
      height: 65px;
      border-radius: 17px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8f0ff;
      color: #2563eb;
      font-size: 18px;
      font-weight: 800;
    }

    .employee-modal-profile h2 {
      margin: 0 0 4px;
      color: #273248;
      font-size: 19px;
    }

    .employee-modal-profile p {
      margin: 0;
      color: #8b95a6;
      font-size: 9px;
    }

    .employee-modal-section {
      margin-top: 25px;
    }

    .employee-modal-section h3 {
      margin: 0 0 10px;
      color: #344054;
      font-size: 11px;
    }

    .employee-modal-about {
      color: #667085;
      font-size: 10px;
      line-height: 1.7;
    }

    .employee-modal-project {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e6ebf2;
      border-radius: 8px;
      background: #fafbfd;
    }

    .employee-modal-project strong {
      color: #344054;
      font-size: 10px;
    }

    .employee-modal-project p {
      margin: 5px 0 0;
      color: #7b8494;
      font-size: 9px;
      line-height: 1.5;
    }

    .employees-mobile-menu {
      display: none;
      border: none;
      background: transparent;
      color: #344054;
      cursor: pointer;
    }

    .employees-mobile-close {
      display: none;
    }

    @media (max-width: 950px) {
      .employees-sidebar {
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }

      .employees-sidebar-open {
        transform: translateX(0);
      }

      .employees-sidebar-overlay {
        position: fixed;
        z-index: 25;
        inset: 0;
        background: rgba(15, 23, 42, 0.3);
      }

      .employees-mobile-close {
        position: absolute;
        right: 15px;
        top: 25px;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f6fa;
        color: #667085;
        cursor: pointer;
      }

      .employees-main {
        width: 100%;
        margin-left: 0;
      }

      .employees-mobile-menu {
        display: flex;
      }

      .employees-header {
        padding: 0 20px;
        gap: 15px;
      }

      .employees-content {
        width: calc(100% - 40px);
      }
    }

    @media (max-width: 700px) {
      .employees-grid {
        grid-template-columns: 1fr;
      }

      .employees-filter-row {
        flex-direction: column;
      }

      .employees-filter-group {
        flex-direction: column;
      }

      .employees-select,
      .employees-select select {
        width: 100%;
      }
    }

    @media (max-width: 600px) {
      .employees-header-user {
        display: none;
      }

      .employees-content {
        width: calc(100% - 28px);
        padding-top: 22px;
      }

      .employees-search-row {
        flex-direction: column;
      }

      .employee-modal-overlay {
        padding: 12px;
      }

      .employee-modal-body {
        padding: 18px;
      }
    }
  `;

  return (
    <>
      <style>
        {styles}
      </style>

      <div className="employees-page">

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className={`employees-sidebar ${
            sidebarOpen
              ? "employees-sidebar-open"
              : ""
          }`}
        >

          <div>

            <Link
              to="/dashboard"
              className="employees-brand"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <div className="employees-brand-icon">
                SC
              </div>

              <span>
                Skill<span>Connect</span>
              </span>
            </Link>

            <button
              type="button"
              className="employees-mobile-close"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <X size={20} />
            </button>

            <nav className="employees-navigation">

              <Link
                to="/dashboard"
                className="employees-nav-item"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="employees-nav-item"
              >
                <UserRound size={18} />
                My Profile
              </Link>

              <Link
                to="/find-people"
                className="employees-nav-item"
              >
                <Search size={18} />
                Find People
              </Link>

              <Link
                to="/employees"
                className="employees-nav-item employees-nav-active"
              >
                <Users size={18} />
                Employees
              </Link>

              <Link
                to="/skills"
                className="employees-nav-item"
              >
                <Award size={18} />
                Skills
              </Link>

              <Link
                to="/projects"
                className="employees-nav-item"
              >
                <BriefcaseBusiness size={18} />
                Projects
              </Link>

              <Link
                to="/skill-insights"
                className="employees-nav-item"
              >
                <Award size={18} />
                Skill Insights
              </Link>

              {user?.role === "admin" && (
                <Link to="/admin" className="employees-nav-item">
                  <ShieldCheck size={18} />
                  Admin Console
                </Link>
              )}

            </nav>

          </div>

          <div className="employees-sidebar-bottom">

            <Link
              to="/settings"
              className="employees-nav-item"
            >
              <Settings size={18} />
              Settings
            </Link>

            <button
              type="button"
              className="employees-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </aside>

        {sidebarOpen && (
          <div
            className="employees-sidebar-overlay"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="employees-main">

          <header className="employees-header">

            <button
              type="button"
              className="employees-mobile-menu"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={21} />
            </button>

            <div>

              <p className="employees-header-label">
                SKILLCONNECT
              </p>

              <h1 className="employees-header-title">
                Employees
              </h1>

            </div>

            <div className="employees-header-user">

              <div className="employees-user-text">

                <strong>
                  {user?.full_name ||
                    user?.username ||
                    "User"}
                </strong>

                <span>
                  {user?.email ||
                    "Employee"}
                </span>

              </div>

              <Link
                to="/profile"
                className="employees-avatar"
              >
                {(
                  user?.full_name ||
                  user?.username ||
                  "U"
                )
                  .substring(0, 2)
                  .toUpperCase()}
              </Link>

            </div>

          </header>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <section className="employees-content">

            <div className="employees-intro">

              <p className="employees-intro-label">
                ORGANIZATION
              </p>

              <h2>
                All Employees
              </h2>

              <p>
                Browse employees, their skills,
                departments and project experience.
              </p>

            </div>

            {/* TOOLBAR */}

            <section className="employees-toolbar">

              <div className="employees-search-row">

                <div className="employees-search">

                  <Search size={17} />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search employees, skills, departments..."
                  />

                </div>

              </div>

              <div className="employees-filter-row">

                <div className="employees-filter-group">

                  <div className="employees-select">

                    <select
                      value={
                        departmentFilter
                      }
                      onChange={(event) =>
                        setDepartmentFilter(
                          event.target.value
                        )
                      }
                    >

                      {departments.map(
                        (department) => (
                          <option
                            key={
                              department
                            }
                          >
                            {department}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={14}
                    />

                  </div>

                </div>

                <div className="employees-select">

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Name
                    </option>

                    <option>
                      Skills
                    </option>

                    <option>
                      Projects
                    </option>
                  </select>

                  <ChevronDown
                    size={14}
                  />

                </div>

              </div>

            </section>

            {/* ERROR */}

            {error && (
              <div className="employees-error">
                {error}
              </div>
            )}

            {/* COUNT */}

            {!loading && (
              <div className="employees-count-row">

                <div className="employees-count">

                  Showing{" "}

                  <strong>
                    {
                      displayedEmployees.length
                    }
                  </strong>

                  {" "}of{" "}

                  <strong>
                    {employees.length}
                  </strong>

                  {" "}employees

                </div>

                <button
                  type="button"
                  className="employees-refresh"
                  onClick={
                    loadEmployees
                  }
                >
                  Refresh
                </button>

              </div>
            )}

            {/* LOADING */}

            {loading && (
              <div className="employees-loading">

                <LoaderCircle
                  size={28}
                  className="employees-spinner"
                />

                <span>
                  Loading employees...
                </span>

              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              displayedEmployees.length ===
                0 && (
                <div className="employees-empty">

                  <Users size={32} />

                  <strong>
                    No employees found
                  </strong>

                  <span>
                    {employees.length ===
                    0
                      ? "There are currently no employees available from the database."
                      : "Try changing your search or department filter."}
                  </span>

                </div>
              )}

            {/* EMPLOYEE GRID */}

            {!loading &&
              displayedEmployees.length >
                0 && (
                <div className="employees-grid">

                  {displayedEmployees.map(
                    (
                      employee,
                      index
                    ) => (
                      <article
                        className="employee-card"
                        key={
                          employee?.id ||
                          employee?.user_id ||
                          employee?._id ||
                          `${getName(
                            employee
                          )}-${index}`
                        }
                      >

                        <div className="employee-card-top">

                          <div className="employee-card-avatar">
                            {getInitials(
                              employee
                            )}
                          </div>

                          <div className="employee-card-info">

                            <h3 className="employee-card-name">
                              {getName(
                                employee
                              )}
                            </h3>

                            {getJobTitle(
                              employee
                            ) && (
                              <div className="employee-card-role">
                                {
                                  getJobTitle(
                                    employee
                                  )
                                }
                              </div>
                            )}

                            {getEmail(
                              employee
                            ) && (
                              <div className="employee-card-email">
                                {getEmail(
                                  employee
                                )}
                              </div>
                            )}

                          </div>

                          <button
                            type="button"
                            className="employee-view"
                            title="View profile"
                            onClick={() =>
                              handleViewProfile(
                                employee
                              )
                            }
                          >
                            <ArrowRight
                              size={15}
                            />
                          </button>

                        </div>

                        <div className="employee-meta">

                          {getDepartment(
                            employee
                          ) && (
                            <span className="employee-meta-item">

                              <Building2
                                size={12}
                              />

                              {
                                getDepartment(
                                  employee
                                )
                              }

                            </span>
                          )}

                          <span className="employee-meta-item">

                            <Award
                              size={12}
                            />

                            {
                              getSkills(
                                employee
                              ).length
                            }{" "}
                            skills

                          </span>

                          <span className="employee-meta-item">

                            <BriefcaseBusiness
                              size={12}
                            />

                            {
                              getProjects(
                                employee
                              ).length
                            }{" "}
                            projects

                          </span>

                        </div>

                        {getSkills(
                          employee
                        ).length > 0 && (
                          <div className="employee-skills">

                            <div className="employee-section-label">
                              Skills
                            </div>

                            <div className="employee-skill-tags">

                              {getSkills(
                                employee
                              )
                                .slice(
                                  0,
                                  5
                                )
                                .map(
                                  (
                                    skill,
                                    skillIndex
                                  ) => (
                                    <span
                                      className="employee-skill"
                                      key={`${getSkillName(
                                        skill
                                      )}-${skillIndex}`}
                                    >
                                      {getSkillName(
                                        skill
                                      )}
                                    </span>
                                  )
                                )}

                              {getSkills(
                                employee
                              ).length >
                                5 && (
                                <span className="employee-more">
                                  +
                                  {getSkills(
                                    employee
                                  ).length -
                                    5}{" "}
                                  more
                                </span>
                              )}

                            </div>

                          </div>
                        )}

                      </article>
                    )
                  )}

                </div>
              )}

          </section>

        </main>

        {/* ====================================================
            PROFILE MODAL
        ==================================================== */}

        {selectedEmployee && (
          <div
            className="employee-modal-overlay"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedEmployee(
                  null
                );
              }
            }}
          >

            <div className="employee-modal">

              <div className="employee-modal-header">

                <strong>
                  Employee Profile
                </strong>

                <button
                  type="button"
                  className="employee-modal-close"
                  onClick={() =>
                    setSelectedEmployee(
                      null
                    )
                  }
                >
                  <X size={17} />
                </button>

              </div>

              <div className="employee-modal-body">

                {profileLoading ? (
                  <div className="employees-loading">
                    <LoaderCircle
                      size={25}
                      className="employees-spinner"
                    />

                    Loading profile...
                  </div>
                ) : (
                  <>
                    <div className="employee-modal-profile">

                      <div className="employee-modal-avatar">
                        {getInitials(
                          selectedEmployee
                        )}
                      </div>

                      <div>

                        <h2>
                          {getName(
                            selectedEmployee
                          )}
                        </h2>

                        <p>
                          {getJobTitle(
                            selectedEmployee
                          ) ||
                            `@${getUsername(
                              selectedEmployee
                            )}`}
                        </p>

                      </div>

                    </div>

                    <div className="employee-meta">

                      {getEmail(
                        selectedEmployee
                      ) && (
                        <span className="employee-meta-item">

                          <Mail size={12} />

                          {
                            getEmail(
                              selectedEmployee
                            )
                          }

                        </span>
                      )}

                      {getDepartment(
                        selectedEmployee
                      ) && (
                        <span className="employee-meta-item">

                          <Building2
                            size={12}
                          />

                          {
                            getDepartment(
                              selectedEmployee
                            )
                          }

                        </span>
                      )}

                    </div>

                    {/* SKILLS */}

                    <div className="employee-modal-section">

                      <h3>
                        Skills
                      </h3>

                      {getSkills(
                        selectedEmployee
                      ).length > 0 ? (
                        <div className="employee-skill-tags">

                          {getSkills(
                            selectedEmployee
                          ).map(
                            (
                              skill,
                              index
                            ) => (
                              <span
                                className="employee-skill"
                                key={`${getSkillName(
                                  skill
                                )}-${index}`}
                              >
                                {getSkillName(
                                  skill
                                )}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <p className="employee-modal-about">
                          No skills added yet.
                        </p>
                      )}

                    </div>

                    {/* ABOUT */}

                    {selectedEmployee.bio && (
                      <div className="employee-modal-section">

                        <h3>
                          About
                        </h3>

                        <p className="employee-modal-about">
                          {
                            selectedEmployee.bio
                          }
                        </p>

                      </div>
                    )}

                    {/* PROJECTS */}

                    <div className="employee-modal-section">

                      <h3>
                        Recent Projects
                      </h3>

                      {getProjects(
                        selectedEmployee
                      ).length > 0 ? (
                        getProjects(
                          selectedEmployee
                        ).map(
                          (
                            project,
                            index
                          ) => (
                            <div
                              className="employee-modal-project"
                              key={`${getProjectName(
                                project
                              )}-${index}`}
                            >

                              <strong>
                                {getProjectName(
                                  project
                                )}
                              </strong>

                              {project?.description && (
                                <p>
                                  {
                                    project.description
                                  }
                                </p>
                              )}

                            </div>
                          )
                        )
                      ) : (
                        <p className="employee-modal-about">
                          No projects added yet.
                        </p>
                      )}

                    </div>

                  </>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default Employees;
