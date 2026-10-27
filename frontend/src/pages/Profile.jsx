import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  FileText,
  Plus,
  Trash2,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Code2,
  FolderKanban,
  Pencil,
} from "lucide-react";

import API from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Profile() {
  const { user, updateUser } = useAuth();

  const userId =
    user?.id ||
    user?._id ||
    user?.user_id;

  const [profile, setProfile] = useState(null);

  const [skills, setSkills] = useState([]);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [addingSkill, setAddingSkill] =
    useState(false);

  const [addingProject, setAddingProject] =
    useState(false);

  const [deletingSkillId, setDeletingSkillId] =
    useState(null);
  const [editingSkillId, setEditingSkillId] = useState("");

  const [deletingProjectId, setDeletingProjectId] =
    useState(null);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    username: "",
    email: "",
    department: "",
    job_title: "",
    bio: "",
    teams_link: "",
  });

  const [skillForm, setSkillForm] = useState({
    skill_name: "",
    proficiency: "",
    category: "",
    years_experience: "",
  });

  const [projectForm, setProjectForm] = useState({
    project_name: "",
    description: "",
    skills_used: "",
  });

  /*
   * ----------------------------------------------------
   * LOAD PROFILE
   * ----------------------------------------------------
   */

  const loadProfile = async () => {
    if (!userId) {
      setError(
        "User information is not available. Please sign in again."
      );

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await API.get(
        `/api/profile/${userId}`
      );

      const profileData =
        response.data?.profile ||
        response.data;

      if (!profileData) {
        throw new Error(
          "Profile information was not returned."
        );
      }

      setProfile(profileData);

      setProfileForm({
        full_name:
          profileData.full_name || "",

        username:
          profileData.username || "",

        email:
          profileData.email || "",

        department:
          profileData.department || "",

        job_title:
          profileData.job_title || "",

        bio:
          profileData.bio || "",
        teams_link:
          profileData.teams_link || "",
      });

      /*
       * Some backend versions return skills/projects
       * together with the profile.
       */

      if (
        Array.isArray(
          profileData.skills
        )
      ) {
        setSkills(
          profileData.skills
        );
      }

      if (
        Array.isArray(
          profileData.projects
        )
      ) {
        setProjects(
          profileData.projects
        );
      }

      /*
       * Also try the dedicated APIs.
       * If they exist, they provide the latest data.
       */

      try {
        const skillsResponse =
          await API.get(
            `/api/skills/${userId}`
          );

        const loadedSkills =
          skillsResponse.data?.skills ||
          skillsResponse.data;

        if (
          Array.isArray(loadedSkills)
        ) {
          setSkills(
            loadedSkills
          );
        }
      } catch (skillError) {
        console.log(
          "Dedicated skills GET unavailable. Using profile skills.",
          skillError
        );
      }

      try {
        const projectsResponse =
          await API.get(
            `/api/projects/${userId}`
          );

        const loadedProjects =
          projectsResponse.data?.projects ||
          projectsResponse.data;

        if (
          Array.isArray(
            loadedProjects
          )
        ) {
          setProjects(
            loadedProjects
          );
        }
      } catch (projectError) {
        console.log(
          "Dedicated projects GET unavailable. Using profile projects.",
          projectError
        );
      }
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to load your profile."
        );
      } else {
        setError(
          "Unable to connect to the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------
   */

  useEffect(() => {
    loadProfile();
  }, [userId]);

  /*
   * ----------------------------------------------------
   * PROFILE FORM CHANGE
   * ----------------------------------------------------
   */

  const handleProfileChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfileForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /*
   * ----------------------------------------------------
   * SAVE PROFILE
   * ----------------------------------------------------
   */

  const handleSaveProfile = async (
    event
  ) => {
    event.preventDefault();

    if (!userId) {
      setError(
        "User ID is missing."
      );

      return;
    }

    try {
      setSavingProfile(true);

      setMessage("");

      setError("");

      const response =
        await API.put(
          `/api/profile/${userId}`,
          {
            full_name:
              profileForm.full_name,

            username:
              profileForm.username,

            email:
              profileForm.email,

            department:
              profileForm.department,

            job_title:
              profileForm.job_title,

            bio:
              profileForm.bio,

            teams_link:
              profileForm.teams_link,

            skills:
              skills,

            projects:
              projects,
          }
        );

      const updatedProfile =
        response.data?.profile ||
        response.data;

      if (updatedProfile) {
        setProfile(
          updatedProfile
        );

        /*
         * Update locally stored user information
         * so the dashboard/navbar has the latest name.
         */

        updateUser({
          ...(user || {}),
          id:
            user?.id ||
            userId,

          full_name:
            updatedProfile.full_name ||
            profileForm.full_name,

          username:
            updatedProfile.username ||
            profileForm.username,

          email:
            updatedProfile.email ||
            profileForm.email,
        });
      }

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to save profile changes."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /*
   * ----------------------------------------------------
   * SKILL FORM CHANGE
   * ----------------------------------------------------
   */

  const handleSkillChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setSkillForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /*
   * ----------------------------------------------------
   * ADD SKILL
   * ----------------------------------------------------
   */

  const handleAddSkill = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");

    setError("");

    const skillName =
      skillForm.skill_name.trim();

    const proficiency =
      skillForm.proficiency.trim();

    if (!skillName) {
      setError(
        "Please enter a skill name."
      );

      return;
    }

    if (!proficiency) {
      setError(
        "Please select a proficiency level."
      );

      return;
    }

    if (!userId) {
      setError(
        "User ID is missing. Please sign in again."
      );

      return;
    }

    try {
      setAddingSkill(true);

      const skillPayload = {
        user_id: userId,
        skill_name: skillName,
        proficiency,
        category: skillForm.category,
        years_experience: skillForm.years_experience ? Number(skillForm.years_experience) : null,
      };
      const response = editingSkillId
        ? await API.patch(`/api/skills/${editingSkillId}`, skillPayload)
        : await API.post("/api/skills", skillPayload);

      console.log(
        "Add skill response:",
        response.data
      );

      setSkillForm({
        skill_name: "",
        proficiency: "",
        category: "",
        years_experience: "",
      });
      setEditingSkillId("");

      setMessage(
        editingSkillId ? "Skill updated successfully." : "Skill added successfully."
      );

      /*
       * Refresh data from MongoDB.
       */

      await loadProfile();
    } catch (err) {
      console.error(
        "Add skill error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to add skill."
      );
    } finally {
      setAddingSkill(false);
    }
  };

  /*
   * ----------------------------------------------------
   * DELETE SKILL
   * ----------------------------------------------------
   */

  const handleDeleteSkill = async (
    skill
  ) => {
    const skillId =
      skill?._id ||
      skill?.id;

    if (!skillId) {
      setError(
        "This skill does not have a valid ID."
      );

      return;
    }

    try {
      setDeletingSkillId(
        skillId
      );

      setMessage("");

      setError("");

      await API.delete(
        `/api/skills/${skillId}`
      );

      setMessage(
        "Skill deleted successfully."
      );

      await loadProfile();
    } catch (err) {
      console.error(
        "Delete skill error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to delete skill."
      );
    } finally {
      setDeletingSkillId(
        null
      );
    }
  };

  /*
   * ----------------------------------------------------
   * PROJECT FORM CHANGE
   * ----------------------------------------------------
   */

  const handleProjectChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProjectForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /*
   * ----------------------------------------------------
   * ADD PROJECT
   * ----------------------------------------------------
   */

  const handleAddProject = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");

    setError("");

    const projectName =
      projectForm.project_name.trim();

    const description =
      projectForm.description.trim();

    const skillsUsed =
      projectForm.skills_used
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

    if (!userId) {
      setError(
        "User ID is missing. Please sign in again."
      );

      return;
    }

    try {
      setAddingProject(true);

      const response =
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

      console.log(
        "Add project response:",
        response.data
      );

      setProjectForm({
        project_name: "",
        description: "",
        skills_used: "",
      });

      setMessage(
        "Project added successfully."
      );

      /*
       * Refresh from MongoDB.
       */

      await loadProfile();
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
      setAddingProject(false);
    }
  };

  /*
   * ----------------------------------------------------
   * DELETE PROJECT
   * ----------------------------------------------------
   */

  const handleDeleteProject = async (
    project
  ) => {
    const projectId =
      project?._id ||
      project?.id;

    if (!projectId) {
      setError(
        "This project does not have a valid ID."
      );

      return;
    }

    try {
      setDeletingProjectId(
        projectId
      );

      setMessage("");

      setError("");

      await API.delete(
        `/api/projects/${projectId}`
      );

      setMessage(
        "Project deleted successfully."
      );

      await loadProfile();
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
      setDeletingProjectId(
        null
      );
    }
  };

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <div className="profile-loading-page">

        <LoaderCircle
          className="profile-spinner"
          size={32}
        />

        <p>
          Loading your profile...
        </p>

      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * PAGE
   * ----------------------------------------------------
   */

  return (
    <div className="profile-page">

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .profile-page {
            min-height: 100vh;
            background: #f6f8fc;
            padding: 36px;
            color: #172033;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .profile-container {
            max-width: 1180px;
            margin: 0 auto;
          }

          .profile-header {
            margin-bottom: 26px;
          }

          .profile-header h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 780;
            letter-spacing: -0.7px;
          }

          .profile-header p {
            margin: 7px 0 0;
            color: #7b8494;
            font-size: 13px;
          }

          .profile-alert {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            padding: 12px 15px;
            border-radius: 9px;
            font-size: 12px;
          }

          .profile-success {
            border: 1px solid #b7e4c7;
            background: #effcf3;
            color: #15803d;
          }

          .profile-error {
            border: 1px solid #f2c4c5;
            background: #fff5f5;
            color: #b42318;
          }

          .profile-card {
            background: #ffffff;
            border: 1px solid #e3e8f0;
            border-radius: 16px;
            padding: 26px;
            margin-bottom: 24px;
            box-shadow:
              0 5px 20px
              rgba(30, 50, 80, 0.04);
          }

          .profile-card-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 22px;
          }

          .profile-card-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #edf4ff;
            color: #2563eb;
          }

          .profile-card-title h2 {
            margin: 0;
            font-size: 17px;
            font-weight: 750;
          }

          .profile-card-title p {
            margin: 3px 0 0;
            color: #8a93a3;
            font-size: 11px;
          }

          .profile-form-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .profile-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .profile-field.full {
            grid-column: 1 / -1;
          }

          .profile-field label {
            color: #344054;
            font-size: 11px;
            font-weight: 700;
          }

          .profile-field input,
          .profile-field textarea,
          .profile-field select {
            width: 100%;
            border: 1px solid #dfe4ec;
            border-radius: 9px;
            padding: 12px 13px;
            outline: none;
            background: #ffffff;
            color: #273248;
            font-size: 12px;
            transition: 0.2s ease;
          }

          .profile-field textarea {
            min-height: 95px;
            resize: vertical;
          }

          .profile-field input:focus,
          .profile-field textarea:focus,
          .profile-field select:focus {
            border-color: #6f9ef1;
            box-shadow:
              0 0 0 3px
              rgba(37, 99, 235, 0.08);
          }

          .profile-save-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }

          .profile-primary-button {
            border: none;
            border-radius: 9px;
            padding: 11px 18px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #2563eb;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .profile-primary-button:hover {
            background: #1d4ed8;
          }

          .profile-primary-button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .profile-section-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 24px;
            align-items: start;
          }

          .profile-section {
            background: #ffffff;
            border: 1px solid #e3e8f0;
            border-radius: 16px;
            padding: 24px;
            box-shadow:
              0 5px 20px
              rgba(30, 50, 80, 0.04);
          }

          .profile-section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
          }

          .profile-section-icon {
            width: 36px;
            height: 36px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0edff;
            color: #7c3aed;
          }

          .profile-section-header h2 {
            margin: 0;
            font-size: 17px;
            font-weight: 750;
          }

          .profile-section-header p {
            margin: 3px 0 0;
            color: #8a93a3;
            font-size: 11px;
          }

          .add-form {
            padding: 16px;
            border-radius: 12px;
            background: #f8faff;
            border: 1px solid #e7edf6;
            margin-bottom: 20px;
          }

          .add-form h3 {
            margin: 0 0 14px;
            font-size: 13px;
            font-weight: 750;
          }

          .add-form-fields {
            display: flex;
            flex-direction: column;
            gap: 11px;
          }

          .add-form input,
          .add-form textarea,
          .add-form select {
            width: 100%;
            border: 1px solid #dfe4ec;
            border-radius: 8px;
            padding: 10px 11px;
            background: #ffffff;
            color: #273248;
            outline: none;
            font-size: 11px;
          }

          .add-form textarea {
            min-height: 80px;
            resize: vertical;
          }

          .add-form input:focus,
          .add-form textarea:focus,
          .add-form select:focus {
            border-color: #7da5ef;
          }

          .add-button {
            border: none;
            border-radius: 8px;
            padding: 10px 15px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            background: #2563eb;
            color: white;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .add-button:hover {
            background: #1d4ed8;
          }

          .add-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .items-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .empty-state {
            padding: 22px;
            border: 1px dashed #d7deea;
            border-radius: 10px;
            text-align: center;
            color: #8a93a3;
            font-size: 11px;
          }

          .skill-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 13px;
            border: 1px solid #e7ebf2;
            border-radius: 10px;
            background: #ffffff;
          }

          .skill-item-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }

          .skill-icon {
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef5ff;
            color: #2563eb;
          }

          .skill-name {
            margin: 0;
            color: #344054;
            font-size: 12px;
            font-weight: 700;
          }

          .skill-proficiency {
            margin: 3px 0 0;
            color: #8a93a3;
            font-size: 10px;
          }

          .delete-button {
            width: 31px;
            height: 31px;
            flex-shrink: 0;
            border: none;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff2f2;
            color: #d92d20;
            cursor: pointer;
          }

          .delete-button:hover {
            background: #ffe4e4;
          }

          .delete-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .project-item {
            padding: 15px;
            border: 1px solid #e7ebf2;
            border-radius: 11px;
            background: #ffffff;
          }

          .project-top {
            display: flex;
            justify-content: space-between;
            gap: 10px;
          }

          .project-name {
            margin: 0;
            color: #273248;
            font-size: 13px;
            font-weight: 750;
          }

          .project-description {
            margin: 7px 0 10px;
            color: #667085;
            font-size: 10px;
            line-height: 1.6;
          }

          .project-skills {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .project-skill-chip {
            padding: 5px 8px;
            border-radius: 20px;
            background: #eef4ff;
            color: #2563eb;
            font-size: 9px;
            font-weight: 650;
          }

          .profile-loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f6f8fc;
            color: #667085;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .profile-spinner {
            color: #2563eb;
            animation:
              profile-spin 0.8s linear infinite;
          }

          @keyframes profile-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 850px) {
            .profile-page {
              padding: 22px;
            }

            .profile-section-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .profile-form-grid {
              grid-template-columns: 1fr;
            }

            .profile-field.full {
              grid-column: auto;
            }

            .profile-page {
              padding: 15px;
            }
          }
        `}
      </style>

      <div className="profile-container">

        {/* HEADER */}

        <div className="profile-header">

          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal information,
            skills and projects.
          </p>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="profile-alert profile-success">

            <CheckCircle2
              size={16}
            />

            {message}

          </div>
        )}

        {error && (
          <div className="profile-alert profile-error">

            <AlertCircle
              size={16}
            />

            {error}

          </div>
        )}

        {/* PERSONAL INFORMATION */}

        <section className="profile-card">

          <div className="profile-card-title">

            <div className="profile-card-icon">
              <User size={18} />
            </div>

            <div>
              <h2>
                Personal Information
              </h2>

              <p>
                Update your basic profile
                information.
              </p>
            </div>

          </div>

          <form
            onSubmit={
              handleSaveProfile
            }
          >

            <div className="profile-form-grid">

              <div className="profile-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={
                    profileForm.full_name
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter your full name"
                />

              </div>

              <div className="profile-field">

                <label>
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    profileForm.username
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter your username"
                />

              </div>

              <div className="profile-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    profileForm.email
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter your email"
                />

              </div>

              <div className="profile-field">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={
                    profileForm.department
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="e.g. Engineering"
                />

              </div>

              <div className="profile-field">

                <label>
                  Job Title
                </label>

                <input
                  type="text"
                  name="job_title"
                  value={
                    profileForm.job_title
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="e.g. Data Science Intern"
                />

              </div>

              <div className="profile-field full">

                <label>
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={
                    profileForm.bio
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Tell your colleagues about yourself..."
                />

              </div>

              <div className="profile-field full">
                <label>Microsoft Teams Contact Link</label>
                <input
                  type="url"
                  name="teams_link"
                  value={profileForm.teams_link}
                  onChange={handleProfileChange}
                  placeholder="https://teams.microsoft.com/..."
                />
                <small>Save a trusted HTTPS Teams link so an authorized administrator can contact you. Paste a link provided by your organization.</small>
              </div>

            </div>

            <div className="profile-save-row">

              <button
                type="submit"
                className="profile-primary-button"
                disabled={
                  savingProfile
                }
              >

                {savingProfile ? (
                  <>
                    <LoaderCircle
                      size={15}
                      className="profile-spinner"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={15}
                    />

                    Save Profile
                  </>
                )}

              </button>

            </div>

          </form>

        </section>

        {/* SKILLS + PROJECTS */}

        <div className="profile-section-grid">

          {/* SKILLS */}

          <section className="profile-section">

            <div className="profile-section-header">

              <div className="profile-section-icon">
                <Code2 size={18} />
              </div>

              <div>

                <h2>
                  My Skills
                </h2>

                <p>
                  Add the skills you have
                  experience with.
                </p>

              </div>

            </div>

            <form
              className="add-form"
              onSubmit={
                handleAddSkill
              }
            >

              <h3>
                  {editingSkillId ? "Edit Skill" : "Add a New Skill"}
              </h3>

              <div className="add-form-fields">

                <input
                  type="text"
                  name="skill_name"
                  value={
                    skillForm.skill_name
                  }
                  onChange={
                    handleSkillChange
                  }
                  placeholder="e.g. Python, Azure, Power BI"
                />

                <select
                  name="proficiency"
                  value={
                    skillForm.proficiency
                  }
                  onChange={
                    handleSkillChange
                  }
                >

                  <option value="">
                    Select proficiency
                  </option>

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>

                  <option value="Expert">
                    Expert
                  </option>

                </select>

                <input
                  type="text"
                  name="category"
                  value={skillForm.category}
                  onChange={handleSkillChange}
                  placeholder="Category (e.g. Backend)"
                />

                <input
                  type="number"
                  name="years_experience"
                  min="0"
                  max="80"
                  step="0.5"
                  value={skillForm.years_experience}
                  onChange={handleSkillChange}
                  placeholder="Years of experience"
                />

                <button
                  type="submit"
                  className="add-button"
                  disabled={
                    addingSkill
                  }
                >

                  {addingSkill ? (
                    <>
                      <LoaderCircle
                        size={14}
                        className="profile-spinner"
                      />

                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={14}
                      />

                      {editingSkillId ? "Save Skill" : "Add Skill"}
                    </>
                  )}

                </button>

              </div>

            </form>

            <div className="items-list">

              {skills.length === 0 ? (
                <div className="empty-state">
                  No skills added yet.
                </div>
              ) : (
                skills.map(
                  (skill, index) => {

                    const skillId =
                      skill?._id ||
                      skill?.id ||
                      `skill-${index}`;

                    return (
                      <div
                        className="skill-item"
                        key={
                          skillId
                        }
                      >

                        <div className="skill-item-left">

                          <div className="skill-icon">
                            <Code2
                              size={16}
                            />
                          </div>

                          <div>

                            <p className="skill-name">
                              {
                                skill.skill_name ||
                                skill.name
                              }
                            </p>

                            <p className="skill-proficiency">
                              {
                                skill.proficiency ||
                                "Not specified"
                              }
                            </p>

                          </div>

                        </div>

                        <button
                          type="button"
                          className="delete-button"
                          aria-label="Edit skill"
                          onClick={() => {
                            setEditingSkillId(skillId);
                            setSkillForm({
                              skill_name: skill.skill_name || skill.name || "",
                              proficiency: skill.proficiency || "",
                              category: skill.category || "",
                              years_experience: skill.years_experience == null ? "" : String(skill.years_experience),
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          disabled={
                            deletingSkillId ===
                            skillId
                          }
                          onClick={() =>
                            handleDeleteSkill(
                              skill
                            )
                          }
                        >

                          {deletingSkillId ===
                          skillId ? (
                            <LoaderCircle
                              size={14}
                              className="profile-spinner"
                            />
                          ) : (
                            <Trash2
                              size={14}
                            />
                          )}

                        </button>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </section>

          {/* PROJECTS */}

          <section className="profile-section">

            <div className="profile-section-header">

              <div className="profile-section-icon">
                <FolderKanban
                  size={18}
                />
              </div>

              <div>

                <h2>
                  My Projects
                </h2>

                <p>
                  Add projects and the skills
                  you used.
                </p>

              </div>

            </div>

            <form
              className="add-form"
              onSubmit={
                handleAddProject
              }
            >

              <h3>
                Add a New Project
              </h3>

              <div className="add-form-fields">

                <input
                  type="text"
                  name="project_name"
                  value={
                    projectForm.project_name
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Project name"
                />

                <textarea
                  name="description"
                  value={
                    projectForm.description
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Describe your project..."
                />

                <input
                  type="text"
                  name="skills_used"
                  value={
                    projectForm.skills_used
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Skills used: Python, FastAPI, MongoDB"
                />

                <button
                  type="submit"
                  className="add-button"
                  disabled={
                    addingProject
                  }
                >

                  {addingProject ? (
                    <>
                      <LoaderCircle
                        size={14}
                        className="profile-spinner"
                      />

                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={14}
                      />

                      Add Project
                    </>
                  )}

                </button>

              </div>

            </form>

            <div className="items-list">

              {projects.length === 0 ? (
                <div className="empty-state">
                  No projects added yet.
                </div>
              ) : (
                projects.map(
                  (project, index) => {

                    const projectId =
                      project?._id ||
                      project?.id ||
                      `project-${index}`;

                    const projectSkills =
                      Array.isArray(
                        project.skills_used
                      )
                        ? project.skills_used
                        : [];

                    return (
                      <div
                        className="project-item"
                        key={
                          projectId
                        }
                      >

                        <div className="project-top">

                          <h3 className="project-name">
                            {
                              project.project_name ||
                              project.name
                            }
                          </h3>

                          <button
                            type="button"
                            className="delete-button"
                            disabled={
                              deletingProjectId ===
                              projectId
                            }
                            onClick={() =>
                              handleDeleteProject(
                                project
                              )
                            }
                          >

                            {deletingProjectId ===
                            projectId ? (
                              <LoaderCircle
                                size={14}
                                className="profile-spinner"
                              />
                            ) : (
                              <Trash2
                                size={14}
                              />
                            )}

                          </button>

                        </div>

                        <p className="project-description">
                          {
                            project.description
                          }
                        </p>

                        {projectSkills.length >
                          0 && (
                          <div className="project-skills">

                            {projectSkills.map(
                              (
                                skill,
                                skillIndex
                              ) => (
                                <span
                                  className="project-skill-chip"
                                  key={
                                    `${projectId}-${skillIndex}`
                                  }
                                >
                                  {
                                    skill
                                  }
                                </span>
                              )
                            )}

                          </div>
                        )}

                      </div>
                    );
                  }
                )
              )}

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

export default Profile;
