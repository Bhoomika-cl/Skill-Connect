import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  Users,
  X,
  Mail,
  Briefcase,
  Code2,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function FindPeople() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [error, setError] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [departmentFilter, setDepartmentFilter] =
    useState("All Departments");

  const [sortBy, setSortBy] =
    useState("Relevance");

  /*
   * ==========================================================
   * SEARCH PEOPLE
   * ==========================================================
   */

  const searchPeople = async (
    event,
    providedTerm = null
  ) => {
    if (event) {
      event.preventDefault();
    }

    const term = (
      providedTerm !== null
        ? providedTerm
        : searchTerm
    ).trim();

    if (!term) {
      setResults([]);
      setSearched(false);
      setError(
        "Please enter a skill to search."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await API.get(
        "/api/search/people",
        {
          params: {
            skill: term,
          },
        }
      );

      console.log(
        "Search API response:",
        response.data
      );

      /*
       * The backend may return the list directly
       * or inside results / people / data.
       *
       * We handle the possible response wrappers
       * without creating fake data.
       */

      let people = [];

      if (
        Array.isArray(response.data)
      ) {
        people = response.data;
      } else if (
        Array.isArray(
          response.data?.results
        )
      ) {
        people =
          response.data.results;
      } else if (
        Array.isArray(
          response.data?.people
        )
      ) {
        people =
          response.data.people;
      } else if (
        Array.isArray(
          response.data?.employees
        )
      ) {
        people =
          response.data.employees;
      } else if (
        Array.isArray(
          response.data?.data
        )
      ) {
        people =
          response.data.data;
      }

      setResults(people);
    } catch (err) {
      console.error(
        "Search people error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to search for people."
        );
      } else if (err.request) {
        setError(
          "The backend did not respond. Make sure FastAPI is running."
        );
      } else {
        setError(
          err.message ||
            "Unable to search for people."
        );
      }

      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================================
   * LOAD PROFILE FROM SEARCH RESULT
   * ==========================================================
   */

  const handleViewProfile = async (
    person
  ) => {
    const userId =
      person?.user_id ||
      person?.id ||
      person?._id;

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

      console.log(
        "Employee profile response:",
        response.data
      );

      const profile =
        response.data?.profile ||
        response.data;

      setSelectedEmployee(
        profile
      );
    } catch (err) {
      console.error(
        "Employee profile error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load this employee profile."
        );
      } else if (err.request) {
        setError(
          "The backend did not respond."
        );
      } else {
        setError(
          err.message ||
            "Unable to load this employee profile."
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
   * HELPERS
   * ==========================================================
   */

  const getDisplayName = (
    person
  ) => {
    return (
      person?.full_name ||
      person?.name ||
      person?.username ||
      "Employee"
    );
  };

  const getUsername = (
    person
  ) => {
    return (
      person?.username ||
      ""
    );
  };

  const getDepartment = (
    person
  ) => {
    return (
      person?.department ||
      ""
    );
  };

  const getJobTitle = (
    person
  ) => {
    return (
      person?.job_title ||
      person?.role ||
      ""
    );
  };

  const getEmail = (
    person
  ) => {
    return (
      person?.email ||
      ""
    );
  };

  const getSkills = (
    person
  ) => {
    if (
      Array.isArray(
        person?.skills
      )
    ) {
      return person.skills;
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
    person
  ) => {
    if (
      Array.isArray(
        person?.projects
      )
    ) {
      return person.projects;
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

  const getProjectDescription = (
    project
  ) => {
    if (
      typeof project === "string"
    ) {
      return "";
    }

    return (
      project?.description ||
      ""
    );
  };

  const getInitials = (
    person
  ) => {
    const name =
      getDisplayName(
        person
      ).trim();

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
   * FILTER RESULTS
   * ==========================================================
   */

  const filteredResults =
    results.filter(
      (person) => {
        if (
          departmentFilter ===
          "All Departments"
        ) {
          return true;
        }

        return (
          getDepartment(
            person
          ).toLowerCase() ===
          departmentFilter.toLowerCase()
        );
      }
    );

  /*
   * ==========================================================
   * DEPARTMENT OPTIONS
   * ==========================================================
   */

  const departments = [
    "All Departments",
    ...Array.from(
      new Set(
        results
          .map(
            (person) =>
              getDepartment(
                person
              )
          )
          .filter(Boolean)
      )
    ),
  ];

  /*
   * ==========================================================
   * SORT RESULTS
   * ==========================================================
   */

  const sortedResults = [
    ...filteredResults,
  ].sort((a, b) => {
    if (
      sortBy === "Name"
    ) {
      return getDisplayName(
        a
      ).localeCompare(
        getDisplayName(b)
      );
    }

    if (
      sortBy === "Skills"
    ) {
      return (
        getSkills(b).length -
        getSkills(a).length
      );
    }

    return 0;
  });

  /*
   * ==========================================================
   * CSS
   * ==========================================================
   */

  const pageStyles = `
    .find-page {
      min-height: 100vh;
      display: flex;
      background: #f7f9fc;
      color: #172033;
    }

    .find-sidebar {
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

    .find-brand {
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

    .find-brand span span {
      color: #2563eb;
    }

    .find-brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
    }

    .find-navigation {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .find-nav-item {
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
      transition: all 0.2s ease;
    }

    .find-nav-item:hover {
      background: #f3f6fb;
      color: #2563eb;
    }

    .find-nav-active {
      background: #edf4ff;
      color: #2563eb;
      font-weight: 700;
    }

    .find-sidebar-bottom {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .find-logout {
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
      text-align: left;
      cursor: pointer;
    }

    .find-logout:hover {
      background: #fff3f3;
      color: #d92d20;
    }

    .find-main {
      width: calc(100% - 245px);
      min-height: 100vh;
      margin-left: 245px;
    }

    .find-header {
      min-height: 82px;
      padding: 0 40px;
      border-bottom: 1px solid #e7ebf1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }

    .find-header-label {
      margin: 0 0 3px;
      color: #8b95a6;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .find-header-title {
      margin: 0;
      color: #172033;
      font-size: 21px;
      font-weight: 750;
      letter-spacing: -0.5px;
    }

    .find-header-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .find-user-name {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .find-user-name strong {
      color: #344054;
      font-size: 10px;
    }

    .find-user-name span {
      color: #98a2b3;
      font-size: 8px;
    }

    .find-user-avatar {
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

    .find-content {
      width: min(1050px, calc(100% - 70px));
      margin: 0 auto;
      padding: 35px 0 60px;
    }

    .find-intro {
      margin-bottom: 22px;
    }

    .find-intro-label {
      margin: 0 0 5px;
      color: #2563eb;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .find-intro h2 {
      margin: 0;
      color: #172033;
      font-size: 25px;
      font-weight: 760;
      letter-spacing: -0.7px;
    }

    .find-intro p {
      margin: 7px 0 0;
      color: #7b8494;
      font-size: 11px;
    }

    .find-search-card {
      padding: 22px;
      border: 1px solid #e3e8f0;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 5px 20px rgba(31, 47, 72, 0.035);
    }

    .find-search-form {
      display: flex;
      gap: 10px;
    }

    .find-search-input {
      position: relative;
      flex: 1;
    }

    .find-search-input svg {
      position: absolute;
      left: 13px;
      top: 13px;
      color: #98a2b3;
    }

    .find-search-input input {
      width: 100%;
      height: 43px;
      padding: 0 13px 0 40px;
      border: 1px solid #dfe5ed;
      border-radius: 8px;
      outline: none;
      background: #ffffff;
      color: #273248;
      font-size: 11px;
    }

    .find-search-input input:focus {
      border-color: #8bb1f5;
      box-shadow: 0 0 0 3px #edf4ff;
    }

    .find-search-button {
      height: 43px;
      padding: 0 22px;
      border: none;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: #2563eb;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .find-search-button:hover {
      background: #1d4ed8;
    }

    .find-search-button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .find-filters {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .find-filter-group {
      display: flex;
      gap: 9px;
    }

    .find-select {
      position: relative;
    }

    .find-select select {
      height: 36px;
      min-width: 150px;
      padding: 0 30px 0 11px;
      border: 1px solid #e0e6ee;
      border-radius: 7px;
      appearance: none;
      outline: none;
      background: #ffffff;
      color: #667085;
      font-size: 9px;
      cursor: pointer;
    }

    .find-select svg {
      position: absolute;
      right: 10px;
      top: 11px;
      color: #98a2b3;
      pointer-events: none;
    }

    .find-results-header {
      margin: 25px 0 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    .find-results-count {
      color: #667085;
      font-size: 10px;
    }

    .find-results-count strong {
      color: #273248;
      font-weight: 750;
    }

    .find-sort {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #8b95a6;
      font-size: 9px;
    }

    .find-sort .find-select select {
      min-width: 125px;
    }

    .find-loading {
      min-height: 230px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 9px;
      color: #7b8494;
      font-size: 10px;
    }

    .find-spinner {
      animation: find-spin 0.8s linear infinite;
    }

    @keyframes find-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .find-message {
      margin-top: 18px;
      padding: 13px 15px;
      border-radius: 9px;
      border: 1px solid #f2c6c8;
      background: #fff5f5;
      color: #b42318;
      font-size: 10px;
    }

    .find-empty {
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

    .find-empty strong {
      color: #667085;
      font-size: 11px;
    }

    .find-empty span {
      max-width: 420px;
      font-size: 9px;
      line-height: 1.5;
    }

    .find-result-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .find-result-card {
      padding: 20px;
      border: 1px solid #e3e8f0;
      border-radius: 12px;
      background: #ffffff;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    }

    .find-result-card:hover {
      border-color: #d2def2;
      box-shadow: 0 8px 25px rgba(31, 47, 72, 0.055);
      transform: translateY(-1px);
    }

    .find-result-top {
      display: flex;
      align-items: flex-start;
      gap: 13px;
    }

    .find-result-avatar {
      width: 52px;
      height: 52px;
      flex-shrink: 0;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8f0ff;
      color: #2563eb;
      font-size: 14px;
      font-weight: 800;
    }

    .find-result-info {
      min-width: 0;
      flex: 1;
    }

    .find-result-name {
      margin: 0;
      color: #273248;
      font-size: 13px;
      font-weight: 750;
    }

    .find-result-username {
      margin-top: 3px;
      color: #98a2b3;
      font-size: 8px;
    }

    .find-result-meta {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .find-result-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #7b8494;
      font-size: 8px;
    }

    .find-result-meta-item svg {
      color: #98a2b3;
    }

    .find-view-button {
      min-height: 34px;
      padding: 0 11px;
      border: 1px solid #dce5f3;
      border-radius: 7px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      color: #2563eb;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
    }

    .find-view-button:hover {
      background: #edf4ff;
      border-color: #cbdaf4;
    }

    .find-skill-section {
      margin-top: 17px;
      padding-top: 15px;
      border-top: 1px solid #eef1f5;
    }

    .find-skill-label {
      margin-bottom: 8px;
      color: #8b95a6;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    .find-skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .find-skill-tag {
      padding: 5px 8px;
      border-radius: 5px;
      background: #edf4ff;
      color: #2563eb;
      font-size: 8px;
      font-weight: 700;
    }

    .find-project-section {
      margin-top: 14px;
    }

    .find-project-title {
      margin-bottom: 7px;
      color: #8b95a6;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    .find-project-row {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #667085;
      font-size: 9px;
    }

    .find-project-row svg {
      color: #159669;
    }

    .find-mobile-menu {
      display: none;
      border: none;
      background: transparent;
      color: #344054;
      cursor: pointer;
    }

    .find-mobile-close {
      display: none;
    }

    /* PROFILE MODAL */

    .find-modal-overlay {
      position: fixed;
      z-index: 100;
      inset: 0;
      padding: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.45);
    }

    .find-modal {
      width: min(680px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 25px 70px rgba(15, 23, 42, 0.2);
    }

    .find-modal-header {
      padding: 20px 22px;
      border-bottom: 1px solid #eef1f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .find-modal-close {
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

    .find-modal-body {
      padding: 25px;
    }

    .find-modal-profile {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .find-modal-avatar {
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

    .find-modal-profile h2 {
      margin: 0 0 4px;
      color: #273248;
      font-size: 19px;
    }

    .find-modal-profile p {
      margin: 0;
      color: #8b95a6;
      font-size: 9px;
    }

    .find-modal-section {
      margin-top: 25px;
    }

    .find-modal-section h3 {
      margin: 0 0 10px;
      color: #344054;
      font-size: 11px;
    }

    .find-modal-about {
      color: #667085;
      font-size: 10px;
      line-height: 1.7;
    }

    .find-modal-project {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid #e6ebf2;
      border-radius: 8px;
      background: #fafbfd;
    }

    .find-modal-project strong {
      color: #344054;
      font-size: 10px;
    }

    .find-modal-project p {
      margin: 5px 0 0;
      color: #7b8494;
      font-size: 9px;
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .find-sidebar {
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }

      .find-sidebar-open {
        transform: translateX(0);
      }

      .find-mobile-close {
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

      .find-sidebar-overlay {
        position: fixed;
        z-index: 25;
        inset: 0;
        background: rgba(15, 23, 42, 0.3);
      }

      .find-main {
        width: 100%;
        margin-left: 0;
      }

      .find-mobile-menu {
        display: flex;
      }

      .find-header {
        gap: 15px;
        padding: 0 20px;
      }

      .find-header > div:first-of-type {
        margin-right: auto;
      }

      .find-content {
        width: calc(100% - 40px);
      }
    }

    @media (max-width: 650px) {
      .find-header {
        min-height: 72px;
      }

      .find-header-user {
        display: none;
      }

      .find-content {
        width: calc(100% - 28px);
        padding-top: 22px;
      }

      .find-search-form {
        flex-direction: column;
      }

      .find-search-button {
        width: 100%;
      }

      .find-filters {
        flex-direction: column;
      }

      .find-filter-group {
        width: 100%;
        flex-direction: column;
      }

      .find-select,
      .find-select select {
        width: 100%;
      }

      .find-results-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .find-result-top {
        flex-wrap: wrap;
      }

      .find-view-button {
        margin-left: 65px;
      }

      .find-modal-overlay {
        padding: 12px;
      }

      .find-modal-body {
        padding: 18px;
      }
    }
  `;

  return (
    <>
      <style>
        {pageStyles}
      </style>

      <div className="find-page">

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside
          className={`find-sidebar ${
            sidebarOpen
              ? "find-sidebar-open"
              : ""
          }`}
        >

          <div>

            <Link
              to="/dashboard"
              className="find-brand"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <div className="find-brand-icon">
                SC
              </div>

              <span>
                Skill<span>Connect</span>
              </span>
            </Link>

            <button
              type="button"
              className="find-mobile-close"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <X size={20} />
            </button>

            <nav className="find-navigation">

              <Link
                to="/dashboard"
                className="find-nav-item"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="find-nav-item"
              >
                <UserRound size={18} />
                My Profile
              </Link>

              <Link
                to="/find-people"
                className="find-nav-item find-nav-active"
              >
                <Search size={18} />
                Find People
              </Link>

              <Link
                to="/employees"
                className="find-nav-item"
              >
                <Users size={18} />
                Employees
              </Link>

              <Link
                to="/skills"
                className="find-nav-item"
              >
                <Award size={18} />
                Skills
              </Link>

              <Link
                to="/projects"
                className="find-nav-item"
              >
                <BriefcaseBusiness size={18} />
                Projects
              </Link>

              <Link
                to="/skill-insights"
                className="find-nav-item"
              >
                <Award size={18} />
                Skill Insights
              </Link>

            </nav>

          </div>

          <div className="find-sidebar-bottom">

            <Link
              to="/settings"
              className="find-nav-item"
            >
              <Settings size={18} />
              Settings
            </Link>

            <button
              type="button"
              className="find-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </aside>

        {sidebarOpen && (
          <div
            className="find-sidebar-overlay"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="find-main">

          <header className="find-header">

            <button
              type="button"
              className="find-mobile-menu"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="find-header-label">
                SKILLCONNECT
              </p>

              <h1 className="find-header-title">
                Find People
              </h1>
            </div>

            <div className="find-header-user">

              <div className="find-user-name">

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
                className="find-user-avatar"
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

          <section className="find-content">

            <div className="find-intro">

              <p className="find-intro-label">
                DISCOVER TALENT
              </p>

              <h2>
                Search People
              </h2>

              <p>
                Find colleagues with specific skills,
                expertise and project experience.
              </p>

            </div>

            {/* SEARCH */}

            <section className="find-search-card">

              <form
                onSubmit={searchPeople}
                className="find-search-form"
              >

                <div className="find-search-input">

                  <Search size={17} />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search by skill, e.g. Python, Azure, MongoDB..."
                  />

                </div>

                <button
                  type="submit"
                  className="find-search-button"
                  disabled={loading}
                >

                  {loading ? (
                    <LoaderCircle
                      className="find-spinner"
                      size={16}
                    />
                  ) : (
                    <Search size={16} />
                  )}

                  {loading
                    ? "Searching..."
                    : "Search"}

                </button>

              </form>

              {/* FILTERS */}

              <div className="find-filters">

                <div className="find-filter-group">

                  <div className="find-select">

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

                <div className="find-sort">

                  <span>
                    Sort by:
                  </span>

                  <div className="find-select">

                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Relevance
                      </option>

                      <option>
                        Name
                      </option>

                      <option>
                        Skills
                      </option>
                    </select>

                    <ChevronDown
                      size={14}
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* ERROR */}

            {error && (
              <div className="find-message">
                {error}
              </div>
            )}

            {/* RESULT HEADER */}

            {searched &&
              !loading && (
                <div className="find-results-header">

                  <div className="find-results-count">

                    <strong>
                      {sortedResults.length}
                    </strong>

                    {" "}
                    people found
                    {searchTerm
                      ? ` with skill "${searchTerm}"`
                      : ""}

                  </div>

                </div>
              )}

            {/* LOADING */}

            {loading && (
              <div className="find-loading">

                <LoaderCircle
                  className="find-spinner"
                  size={28}
                />

                <span>
                  Searching your organization...
                </span>

              </div>
            )}

            {/* EMPTY BEFORE SEARCH */}

            {!loading &&
              !searched && (
                <div className="find-empty">

                  <Search size={30} />

                  <strong>
                    Search for a skill
                  </strong>

                  <span>
                    Enter a skill such as Python,
                    Azure, FastAPI or MongoDB to
                    discover employees with that
                    experience.
                  </span>

                </div>
              )}

            {/* NO RESULTS */}

            {!loading &&
              searched &&
              sortedResults.length === 0 && (
                <div className="find-empty">

                  <Users size={30} />

                  <strong>
                    No matching employees found
                  </strong>

                  <span>
                    No employees were returned for
                    this search. Try another skill.
                  </span>

                </div>
              )}

            {/* RESULTS */}

            {!loading &&
              sortedResults.length > 0 && (
                <div className="find-result-list">

                  {sortedResults.map(
                    (
                      person,
                      index
                    ) => (
                      <article
                        className="find-result-card"
                        key={
                          person?.id ||
                          person?.user_id ||
                          person?._id ||
                          `${getDisplayName(
                            person
                          )}-${index}`
                        }
                      >

                        <div className="find-result-top">

                          <div className="find-result-avatar">
                            {getInitials(
                              person
                            )}
                          </div>

                          <div className="find-result-info">

                            <h3 className="find-result-name">
                              {getDisplayName(
                                person
                              )}
                            </h3>

                            {getUsername(
                              person
                            ) && (
                              <div className="find-result-username">
                                @{getUsername(
                                  person
                                )}
                              </div>
                            )}

                            <div className="find-result-meta">

                              {getJobTitle(
                                person
                              ) && (
                                <span className="find-result-meta-item">

                                  <Briefcase
                                    size={12}
                                  />

                                  {
                                    getJobTitle(
                                      person
                                    )
                                  }

                                </span>
                              )}

                              {getDepartment(
                                person
                              ) && (
                                <span className="find-result-meta-item">

                                  <Building2
                                    size={12}
                                  />

                                  {
                                    getDepartment(
                                      person
                                    )
                                  }

                                </span>
                              )}

                              {getEmail(
                                person
                              ) && (
                                <span className="find-result-meta-item">

                                  <Mail
                                    size={12}
                                  />

                                  {
                                    getEmail(
                                      person
                                    )
                                  }

                                </span>
                              )}

                            </div>

                          </div>

                          <button
                            type="button"
                            className="find-view-button"
                            onClick={() =>
                              handleViewProfile(
                                person
                              )
                            }
                          >

                            View Profile

                            <ArrowRight
                              size={13}
                            />

                          </button>

                        </div>

                        {/* SKILLS */}

                        {getSkills(
                          person
                        ).length > 0 && (
                          <div className="find-skill-section">

                            <div className="find-skill-label">
                              Skills
                            </div>

                            <div className="find-skill-tags">

                              {getSkills(
                                person
                              ).map(
                                (
                                  skill,
                                  skillIndex
                                ) => (
                                  <span
                                    className="find-skill-tag"
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

                            </div>

                          </div>
                        )}

                        {/* PROJECTS */}

                        {getProjects(
                          person
                        ).length > 0 && (
                          <div className="find-project-section">

                            <div className="find-project-title">
                              Recent Projects
                            </div>

                            {getProjects(
                              person
                            )
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  project,
                                  projectIndex
                                ) => (
                                  <div
                                    className="find-project-row"
                                    key={`${getProjectName(
                                      project
                                    )}-${projectIndex}`}
                                  >

                                    <BriefcaseBusiness
                                      size={12}
                                    />

                                    <span>
                                      {
                                        getProjectName(
                                          project
                                        )
                                      }
                                    </span>

                                  </div>
                                )
                              )}

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
            EMPLOYEE PROFILE MODAL
        ==================================================== */}

        {selectedEmployee && (
          <div
            className="find-modal-overlay"
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

            <div className="find-modal">

              <div className="find-modal-header">

                <strong>
                  Employee Profile
                </strong>

                <button
                  type="button"
                  className="find-modal-close"
                  onClick={() =>
                    setSelectedEmployee(
                      null
                    )
                  }
                >
                  <X size={17} />
                </button>

              </div>

              <div className="find-modal-body">

                {profileLoading ? (
                  <div className="find-loading">
                    <LoaderCircle
                      className="find-spinner"
                      size={25}
                    />

                    Loading profile...
                  </div>
                ) : (
                  <>
                    <div className="find-modal-profile">

                      <div className="find-modal-avatar">
                        {getInitials(
                          selectedEmployee
                        )}
                      </div>

                      <div>

                        <h2>
                          {getDisplayName(
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

                    {getEmail(
                      selectedEmployee
                    ) && (
                      <div className="find-result-meta">

                        <span className="find-result-meta-item">

                          <Mail size={12} />

                          {
                            getEmail(
                              selectedEmployee
                            )
                          }

                        </span>

                        {getDepartment(
                          selectedEmployee
                        ) && (
                          <span className="find-result-meta-item">

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
                    )}

                    {/* SKILLS */}

                    <div className="find-modal-section">

                      <h3>
                        Skills
                      </h3>

                      {getSkills(
                        selectedEmployee
                      ).length > 0 ? (
                        <div className="find-skill-tags">

                          {getSkills(
                            selectedEmployee
                          ).map(
                            (
                              skill,
                              index
                            ) => (
                              <span
                                className="find-skill-tag"
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
                        <p className="find-modal-about">
                          No skills added yet.
                        </p>
                      )}

                    </div>

                    {/* ABOUT */}

                    {selectedEmployee.bio && (
                      <div className="find-modal-section">

                        <h3>
                          About
                        </h3>

                        <div className="find-modal-about">
                          {
                            selectedEmployee.bio
                          }
                        </div>

                      </div>
                    )}

                    {/* PROJECTS */}

                    <div className="find-modal-section">

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
                              className="find-modal-project"
                              key={`${getProjectName(
                                project
                              )}-${index}`}
                            >

                              <strong>
                                {getProjectName(
                                  project
                                )}
                              </strong>

                              {getProjectDescription(
                                project
                              ) && (
                                <p>
                                  {
                                    getProjectDescription(
                                      project
                                    )
                                  }
                                </p>
                              )}

                            </div>
                          )
                        )
                      ) : (
                        <p className="find-modal-about">
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

export default FindPeople;