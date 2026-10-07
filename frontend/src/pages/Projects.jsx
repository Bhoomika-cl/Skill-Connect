import { useEffect, useMemo, useState } from "react";

import {
  FolderKanban,
  Plus,
  Trash2,
  LoaderCircle,
  Search,
  UserRound,
  CalendarDays,
  Code2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import API from "../services/api.js";

import { useAuth } from "../context/AuthContext.jsx";


function Projects() {

  const { user } = useAuth();

  const userId =
    user?.id ||
    user?._id ||
    user?.user_id;


  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);


  const [formData, setFormData] =
    useState({
      project_name: "",
      description: "",
      skills_used: "",
    });


  /*
   * =====================================================
   * LOAD PROJECTS FROM ALL EMPLOYEES
   * =====================================================
   *
   * /api/employees already returns employees together
   * with their skills and projects.
   *
   * Therefore we can build the global Projects page
   * using real MongoDB data without fake projects.
   */

  const loadProjects = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await API.get(
          "/api/employees"
        );


      const employees =
        Array.isArray(
          response.data
        )
          ? response.data
          : response.data?.employees || [];


      const allProjects = [];


      employees.forEach(
        (employee) => {

          const employeeProjects =
            Array.isArray(
              employee.projects
            )
              ? employee.projects
              : [];


          employeeProjects.forEach(
            (project) => {

              allProjects.push({

                ...project,

                owner_id:
                  employee.id ||
                  employee._id ||
                  employee.user_id,

                owner_name:
                  employee.full_name ||
                  employee.username ||
                  "Unknown employee",

                owner_username:
                  employee.username ||
                  "",

                owner_email:
                  employee.email ||
                  "",

              });

            }
          );

        }
      );


      /*
       * Sort newest projects first.
       *
       * We use updated_at first and then
       * created_at when available.
       */

      allProjects.sort(
        (a, b) => {

          const dateA =
            new Date(
              a.updated_at ||
              a.created_at ||
              0
            ).getTime();

          const dateB =
            new Date(
              b.updated_at ||
              b.created_at ||
              0
            ).getTime();

          return dateB - dateA;

        }
      );


      setProjects(
        allProjects
      );


    } catch (err) {

      console.error(
        "Unable to load projects:",
        err
      );


      setError(
        err.response?.data?.detail ||
        "Unable to load projects from the server."
      );

    } finally {

      setLoading(false);

    }

  };


  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {

    loadProjects();

  }, []);


  /*
   * =====================================================
   * FORM CHANGE
   * =====================================================
   */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");

    setMessage("");

  };


  /*
   * =====================================================
   * ADD PROJECT
   * =====================================================
   */

  const handleAddProject =
    async (event) => {

      event.preventDefault();


      setError("");

      setMessage("");


      if (!userId) {

        setError(
          "Your user information is unavailable. Please sign in again."
        );

        return;

      }


      const projectName =
        formData.project_name.trim();


      const description =
        formData.description.trim();


      const skillsUsed =
        formData.skills_used
          .split(",")
          .map(
            (skill) =>
              skill.trim()
          )
          .filter(
            (skill) =>
              skill.length > 0
          );


      if (!projectName) {

        setError(
          "Please enter a project name."
        );

        return;

      }


      if (!description) {

        setError(
          "Please enter a project description."
        );

        return;

      }


      try {

        setAdding(true);


        await API.post(
          "/api/projects",
          {
            user_id: userId,

            project_name:
              projectName,

            description:
              description,

            skills_used:
              skillsUsed,
          }
        );


        setFormData({
          project_name: "",
          description: "",
          skills_used: "",
        });


        setShowAddForm(false);


        setMessage(
          "Project added successfully."
        );


        await loadProjects();


      } catch (err) {

        console.error(
          "Add project error:",
          err
        );


        setError(
          err.response?.data?.detail ||
          "Unable to add project."
        );

      } finally {

        setAdding(false);

      }

    };


  /*
   * =====================================================
   * DELETE PROJECT
   * =====================================================
   */

  const handleDelete =
    async (project) => {

      const projectId =
        project?._id ||
        project?.id;


      if (!projectId) {

        setError(
          "This project does not have a valid ID."
        );

        return;

      }


      /*
       * Only allow the currently logged-in
       * employee to delete their own project.
       */

      const projectOwnerId =
        project.owner_id;


      if (
        projectOwnerId &&
        String(projectOwnerId) !==
          String(userId)
      ) {

        setError(
          "You can only delete your own projects."
        );

        return;

      }


      const confirmed =
        window.confirm(
          "Are you sure you want to delete this project?"
        );


      if (!confirmed) {

        return;

      }


      try {

        setDeletingId(
          projectId
        );

        setError("");

        setMessage("");


        await API.delete(
          `/api/projects/${projectId}`
        );


        setMessage(
          "Project deleted successfully."
        );


        await loadProjects();


      } catch (err) {

        console.error(
          "Delete project error:",
          err
        );


        setError(
          err.response?.data?.detail ||
          "Unable to delete project."
        );

      } finally {

        setDeletingId(null);

      }

    };


  /*
   * =====================================================
   * SEARCH PROJECTS
   * =====================================================
   */

  const filteredProjects =
    useMemo(() => {

      const query =
        searchTerm
          .trim()
          .toLowerCase();


      if (!query) {

        return projects;

      }


      return projects.filter(
        (project) => {

          const name =
            project.project_name ||
            project.name ||
            "";


          const description =
            project.description ||
            "";


          const owner =
            project.owner_name ||
            "";


          const skills =
            Array.isArray(
              project.skills_used
            )
              ? project.skills_used.join(
                  " "
                )
              : "";


          const searchableText =
            `
              ${name}
              ${description}
              ${owner}
              ${skills}
            `
              .toLowerCase();


          return searchableText.includes(
            query
          );

        }
      );

    }, [
      projects,
      searchTerm,
    ]);


  /*
   * =====================================================
   * FORMAT DATE
   * =====================================================
   */

  const formatDate = (
    dateValue
  ) => {

    if (!dateValue) {

      return "Recently";

    }


    const date =
      new Date(
        dateValue
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "Recently";

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  };


  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (

    <div className="projects-page">

      <style>
        {`

          * {
            box-sizing: border-box;
          }


          .projects-page {

            min-height: 100vh;

            padding: 36px;

            background:
              #f6f8fc;

            color:
              #172033;

            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;

          }


          .projects-container {

            max-width:
              1200px;

            margin:
              0 auto;

          }


          /* ===============================
             HEADER
             =============================== */

          .projects-header {

            display:
              flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap:
              20px;

            margin-bottom:
              26px;

          }


          .projects-header h1 {

            margin:
              0;

            font-size:
              30px;

            font-weight:
              780;

            letter-spacing:
              -0.7px;

          }


          .projects-header p {

            margin:
              7px 0 0;

            color:
              #7b8494;

            font-size:
              13px;

          }


          .projects-header-actions {

            display:
              flex;

            align-items:
              center;

            gap:
              10px;

          }


          .projects-count {

            padding:
              9px 13px;

            border-radius:
              20px;

            background:
              #f0edff;

            color:
              #7c3aed;

            font-size:
              11px;

            font-weight:
              700;

          }


          .add-project-button {

            height:
              40px;

            padding:
              0 15px;

            border:
              none;

            border-radius:
              8px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            gap:
              7px;

            background:
              #2563eb;

            color:
              #ffffff;

            font-size:
              11px;

            font-weight:
              700;

            cursor:
              pointer;

          }


          .add-project-button:hover {

            background:
              #1d4ed8;

          }


          /* ===============================
             ALERTS
             =============================== */

          .projects-alert {

            display:
              flex;

            align-items:
              center;

            gap:
              8px;

            margin-bottom:
              18px;

            padding:
              12px 15px;

            border-radius:
              9px;

            font-size:
              12px;

          }


          .projects-success {

            border:
              1px solid #b7e4c7;

            background:
              #effcf3;

            color:
              #15803d;

          }


          .projects-error {

            border:
              1px solid #f2c4c5;

            background:
              #fff5f5;

            color:
              #b42318;

          }


          /* ===============================
             SEARCH
             =============================== */

          .projects-toolbar {

            display:
              flex;

            justify-content:
              space-between;

            align-items:
              center;

            gap:
              15px;

            margin-bottom:
              18px;

          }


          .projects-search {

            position:
              relative;

            width:
              310px;

          }


          .projects-search svg {

            position:
              absolute;

            left:
              12px;

            top:
              50%;

            transform:
              translateY(-50%);

            color:
              #98a2b3;

          }


          .projects-search input {

            width:
              100%;

            height:
              40px;

            padding:
              0 12px 0 37px;

            border:
              1px solid #dfe4ec;

            border-radius:
              8px;

            outline:
              none;

            background:
              #ffffff;

            color:
              #273248;

            font-size:
              11px;

          }


          .projects-search input:focus {

            border-color:
              #6f9ef1;

            box-shadow:
              0 0 0 3px
              rgba(
                37,
                99,
                235,
                0.08
              );

          }


          .recent-label {

            color:
              #667085;

            font-size:
              12px;

            font-weight:
              700;

          }


          /* ===============================
             PROJECT GRID
             =============================== */

          .projects-grid {

            display:
              grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap:
              16px;

          }


          .project-card {

            background:
              #ffffff;

            border:
              1px solid #e3e8f0;

            border-radius:
              15px;

            padding:
              20px;

            box-shadow:
              0 5px 20px
              rgba(
                30,
                50,
                80,
                0.04
              );

            transition:
              0.2s ease;

          }


          .project-card:hover {

            transform:
              translateY(-2px);

            border-color:
              #d4dced;

            box-shadow:
              0 9px 25px
              rgba(
                30,
                50,
                80,
                0.07
              );

          }


          .project-card-top {

            display:
              flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap:
              12px;

          }


          .project-title-area {

            display:
              flex;

            align-items:
              flex-start;

            gap:
              11px;

            min-width:
              0;

          }


          .project-icon {

            width:
              42px;

            height:
              42px;

            flex-shrink:
              0;

            border-radius:
              10px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            background:
              #f0edff;

            color:
              #7c3aed;

          }


          .project-name {

            margin:
              0;

            color:
              #273248;

            font-size:
              14px;

            font-weight:
              750;

            word-break:
              break-word;

          }


          .project-owner {

            display:
              flex;

            align-items:
              center;

            gap:
              5px;

            margin-top:
              5px;

            color:
              #7b8494;

            font-size:
              10px;

          }


          .project-delete {

            width:
              31px;

            height:
              31px;

            flex-shrink:
              0;

            border:
              none;

            border-radius:
              7px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            background:
              #fff2f2;

            color:
              #d92d20;

            cursor:
              pointer;

          }


          .project-delete:hover {

            background:
              #ffe3e3;

          }


          .project-delete:disabled {

            opacity:
              0.5;

            cursor:
              not-allowed;

          }


          .project-description {

            margin:
              16px 0;

            color:
              #667085;

            font-size:
              11px;

            line-height:
              1.65;

          }


          .project-meta {

            display:
              flex;

            align-items:
              center;

            gap:
              6px;

            margin-bottom:
              12px;

            color:
              #8a93a3;

            font-size:
              9px;

          }


          .project-skills-label {

            margin:
              0 0 7px;

            color:
              #8a93a3;

            font-size:
              9px;

            font-weight:
              700;

            text-transform:
              uppercase;

            letter-spacing:
              0.5px;

          }


          .project-skills {

            display:
              flex;

            flex-wrap:
              wrap;

            gap:
              6px;

          }


          .project-skill {

            padding:
              5px 8px;

            border-radius:
              20px;

            background:
              #eef4ff;

            color:
              #2563eb;

            font-size:
              9px;

            font-weight:
              650;

          }


          /* ===============================
             EMPTY
             =============================== */

          .empty-projects {

            min-height:
              390px;

            display:
              flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              center;

            background:
              #ffffff;

            border:
              1px solid #e3e8f0;

            border-radius:
              15px;

            text-align:
              center;

          }


          .empty-projects-icon {

            width:
              60px;

            height:
              60px;

            margin-bottom:
              13px;

            border-radius:
              15px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            background:
              #f0edff;

            color:
              #a78bfa;

          }


          .empty-projects h3 {

            margin:
              0;

            color:
              #667085;

            font-size:
              14px;

          }


          .empty-projects p {

            max-width:
              330px;

            margin:
              7px 0 0;

            color:
              #98a2b3;

            font-size:
              10px;

            line-height:
              1.6;

          }


          /* ===============================
             LOADING
             =============================== */

          .projects-loading {

            min-height:
              390px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            color:
              #2563eb;

          }


          .spin {

            animation:
              project-spin
              0.8s linear infinite;

          }


          @keyframes project-spin {

            to {

              transform:
                rotate(360deg);

            }

          }


          /* ===============================
             ADD PROJECT MODAL
             =============================== */

          .project-modal-overlay {

            position:
              fixed;

            inset:
              0;

            z-index:
              1000;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            padding:
              20px;

            background:
              rgba(
                15,
                23,
                42,
                0.45
              );

          }


          .project-modal {

            width:
              min(
                500px,
                100%
              );

            background:
              #ffffff;

            border-radius:
              16px;

            padding:
              25px;

            box-shadow:
              0 25px 60px
              rgba(
                0,
                0,
                0,
                0.18
              );

          }


          .project-modal-header {

            display:
              flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap:
              15px;

            margin-bottom:
              20px;

          }


          .project-modal-header h2 {

            margin:
              0;

            font-size:
              18px;

          }


          .project-modal-header p {

            margin:
              5px 0 0;

            color:
              #8a93a3;

            font-size:
              10px;

          }


          .close-modal {

            width:
              32px;

            height:
              32px;

            border:
              none;

            border-radius:
              7px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            background:
              #f2f4f7;

            color:
              #667085;

            cursor:
              pointer;

          }


          .project-form {

            display:
              flex;

            flex-direction:
              column;

            gap:
              14px;

          }


          .project-form-group {

            display:
              flex;

            flex-direction:
              column;

            gap:
              7px;

          }


          .project-form-group label {

            color:
              #344054;

            font-size:
              11px;

            font-weight:
              700;

          }


          .project-form-group input,
          .project-form-group textarea {

            width:
              100%;

            border:
              1px solid #dfe4ec;

            border-radius:
              8px;

            padding:
              11px 12px;

            outline:
              none;

            color:
              #273248;

            font-size:
              11px;

          }


          .project-form-group input {

            height:
              42px;

          }


          .project-form-group textarea {

            min-height:
              100px;

            resize:
              vertical;

          }


          .project-form-group input:focus,
          .project-form-group textarea:focus {

            border-color:
              #6f9ef1;

            box-shadow:
              0 0 0 3px
              rgba(
                37,
                99,
                235,
                0.08
              );

          }


          .project-form-actions {

            display:
              flex;

            justify-content:
              flex-end;

            gap:
              9px;

            margin-top:
              5px;

          }


          .cancel-button,
          .save-project-button {

            height:
              40px;

            padding:
              0 15px;

            border-radius:
              8px;

            font-size:
              11px;

            font-weight:
              700;

            cursor:
              pointer;

          }


          .cancel-button {

            border:
              1px solid #dfe4ec;

            background:
              #ffffff;

            color:
              #667085;

          }


          .save-project-button {

            border:
              none;

            background:
              #2563eb;

            color:
              #ffffff;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            gap:
              7px;

          }


          .save-project-button:disabled {

            opacity:
              0.6;

            cursor:
              not-allowed;

          }


          /* ===============================
             RESPONSIVE
             =============================== */

          @media (
            max-width: 850px
          ) {

            .projects-page {

              padding:
                22px;

            }


            .projects-grid {

              grid-template-columns:
                1fr;

            }

          }


          @media (
            max-width: 600px
          ) {

            .projects-page {

              padding:
                15px;

            }


            .projects-header {

              flex-direction:
                column;

            }


            .projects-header-actions {

              width:
                100%;

              justify-content:
                space-between;

            }


            .projects-toolbar {

              flex-direction:
                column;

              align-items:
                stretch;

            }


            .projects-search {

              width:
                100%;

            }

          }

        `}
      </style>


      <div className="projects-container">


        {/* ==========================================
            HEADER
           ========================================== */}

        <div className="projects-header">

          <div>

            <h1>
              Projects
            </h1>

            <p>
              Discover the projects being worked on
              across your organization.
            </p>

          </div>


          <div className="projects-header-actions">

            <div className="projects-count">

              {projects.length}{" "}

              {projects.length === 1
                ? "Project"
                : "Projects"}

            </div>


            <button
              type="button"
              className="add-project-button"
              onClick={() => {

                setShowAddForm(true);

                setError("");

                setMessage("");

              }}
            >

              <Plus size={15} />

              Add Project

            </button>

          </div>

        </div>


        {/* ==========================================
            ALERTS
           ========================================== */}

        {message && (

          <div
            className="
              projects-alert
              projects-success
            "
          >

            <CheckCircle2
              size={16}
            />

            {message}

          </div>

        )}


        {error && (

          <div
            className="
              projects-alert
              projects-error
            "
          >

            <AlertCircle
              size={16}
            />

            {error}

          </div>

        )}


        {/* ==========================================
            SEARCH / TOOLBAR
           ========================================== */}

        <div className="projects-toolbar">

          <div className="recent-label">

            Recently Updated Projects

          </div>


          <div className="projects-search">

            <Search
              size={15}
            />

            <input
              type="text"
              value={
                searchTerm
              }
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="
                Search projects, people or skills...
              "
            />

          </div>

        </div>


        {/* ==========================================
            PROJECT CONTENT
           ========================================== */}

        {loading ? (

          <div className="projects-loading">

            <LoaderCircle
              size={32}
              className="spin"
            />

          </div>

        ) : filteredProjects.length === 0 ? (

          <div className="empty-projects">

            <div className="empty-projects-icon">

              <FolderKanban
                size={27}
              />

            </div>


            <h3>
              No projects found
            </h3>


            <p>

              There are currently no projects
              available in MongoDB.

              Add a project to start building
              your organization's project history.

            </p>

          </div>

        ) : (

          <div className="projects-grid">

            {filteredProjects.map(
              (
                project,
                index
              ) => {

                const projectId =
                  project._id ||
                  project.id ||
                  `project-${index}`;


                const projectName =
                  project.project_name ||
                  project.name ||
                  "Untitled Project";


                const description =
                  project.description ||
                  "No description available.";


                const skills =
                  Array.isArray(
                    project.skills_used
                  )
                    ? project.skills_used
                    : [];


                const isOwner =
                  project.owner_id &&
                  userId &&
                  String(
                    project.owner_id
                  ) ===
                    String(
                      userId
                    );


                return (

                  <article
                    className="project-card"
                    key={
                      String(
                        projectId
                      )
                    }
                  >


                    <div className="project-card-top">


                      <div className="project-title-area">


                        <div className="project-icon">

                          <FolderKanban
                            size={19}
                          />

                        </div>


                        <div>

                          <h2 className="project-name">

                            {projectName}

                          </h2>


                          <div className="project-owner">

                            <UserRound
                              size={12}
                            />

                            {project.owner_name}

                            {isOwner &&
                              " • You"}

                          </div>

                        </div>

                      </div>


                      {isOwner && (

                        <button
                          type="button"
                          className="project-delete"
                          disabled={
                            deletingId ===
                            projectId
                          }
                          onClick={() =>
                            handleDelete(
                              project
                            )
                          }
                          title="
                            Delete your project
                          "
                        >

                          {deletingId ===
                          projectId ? (

                            <LoaderCircle
                              size={14}
                              className="spin"
                            />

                          ) : (

                            <Trash2
                              size={14}
                            />

                          )}

                        </button>

                      )}

                    </div>


                    <p className="project-description">

                      {description}

                    </p>


                    <div className="project-meta">

                      <CalendarDays
                        size={12}
                      />

                      Updated{" "}

                      {formatDate(
                        project.updated_at ||
                        project.created_at
                      )}

                    </div>


                    {skills.length > 0 && (

                      <>

                        <p className="project-skills-label">

                          Skills Used

                        </p>


                        <div className="project-skills">

                          {skills.map(
                            (
                              skill,
                              skillIndex
                            ) => (

                              <span
                                className="project-skill"
                                key={
                                  `${projectId}-${skillIndex}`
                                }
                              >

                                <Code2
                                  size={9}
                                  style={{
                                    marginRight:
                                      "4px",
                                    verticalAlign:
                                      "middle",
                                  }}
                                />

                                {skill}

                              </span>

                            )
                          )}

                        </div>

                      </>

                    )}

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>


      {/* ==========================================
          ADD PROJECT MODAL
         ========================================== */}

      {showAddForm && (

        <div className="project-modal-overlay">

          <div className="project-modal">


            <div className="project-modal-header">

              <div>

                <h2>
                  Add Project
                </h2>

                <p>
                  Add a project you have worked on.
                </p>

              </div>


              <button
                type="button"
                className="close-modal"
                onClick={() =>
                  setShowAddForm(false)
                }
              >

                <X size={16} />

              </button>

            </div>


            <form
              className="project-form"
              onSubmit={
                handleAddProject
              }
            >


              <div className="project-form-group">

                <label>
                  Project Name
                </label>

                <input
                  type="text"
                  name="project_name"
                  value={
                    formData.project_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="
                    e.g. SkillConnect
                  "
                />

              </div>


              <div className="project-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="
                    Describe your project...
                  "
                />

              </div>


              <div className="project-form-group">

                <label>
                  Skills Used
                </label>

                <input
                  type="text"
                  name="skills_used"
                  value={
                    formData.skills_used
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="
                    Python, FastAPI, MongoDB
                  "
                />

              </div>


              <div className="project-form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowAddForm(false)
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="save-project-button"
                  disabled={
                    adding
                  }
                >

                  {adding ? (

                    <>

                      <LoaderCircle
                        size={14}
                        className="spin"
                      />

                      Saving...

                    </>

                  ) : (

                    <>

                      <Plus
                        size={14}
                      />

                      Save Project

                    </>

                  )}

                </button>

              </div>


            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Projects;