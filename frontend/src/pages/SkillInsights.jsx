import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CircleUserRound,
  GitBranch,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import API from "../services/api";


function getNodeColor(type) {
  if (type === "employee") {
    return "#2f6df6";
  }

  if (type === "project") {
    return "#13a673";
  }

  return "#7c3aed";
}


function getNodeBackground(type) {
  if (type === "employee") {
    return "#eaf1ff";
  }

  if (type === "project") {
    return "#e8f8f2";
  }

  return "#f1eaff";
}


function getNodeIcon(type) {
  if (type === "employee") {
    return <CircleUserRound size={23} />;
  }

  if (type === "project") {
    return <BriefcaseBusiness size={23} />;
  }

  return <Sparkles size={23} />;
}


function createInitialPositions(
  nodes,
  width,
  height
) {
  const employees = nodes.filter(
    (node) =>
      node.type === "employee"
  );

  const projects = nodes.filter(
    (node) =>
      node.type === "project"
  );

  const skills = nodes.filter(
    (node) =>
      node.type === "skill"
  );

  const positions = {};

  const centerX = width / 2;
  const centerY = height / 2;

  projects.forEach(
    (project, index) => {
      const total =
        projects.length || 1;

      const angle =
        (Math.PI * 2 * index) /
        total;

      const radius =
        projects.length === 1
          ? 0
          : 170;

      positions[project.id] = {
        x:
          centerX +
          Math.cos(angle) *
            radius,
        y:
          centerY +
          Math.sin(angle) *
            radius,
      };
    }
  );

  employees.forEach(
    (employee, index) => {
      const total =
        employees.length || 1;

      const angle =
        Math.PI +
        (Math.PI * index) /
          Math.max(
            employees.length - 1,
            1
          );

      const radius = 250;

      positions[employee.id] = {
        x:
          centerX +
          Math.cos(angle) *
            radius,
        y:
          centerY +
          Math.sin(angle) *
            radius,
      };
    }
  );

  skills.forEach(
    (skill, index) => {
      const total =
        skills.length || 1;

      const angle =
        -Math.PI / 2 +
        (Math.PI * index) /
          Math.max(
            skills.length - 1,
            1
          );

      const radius = 245;

      positions[skill.id] = {
        x:
          centerX +
          Math.cos(angle) *
            radius,
        y:
          centerY +
          Math.sin(angle) *
            radius,
      };
    }
  );

  return positions;
}


function MetricCard({
  icon,
  title,
  value,
  type,
}) {
  return (
    <div className="sg-metric-card">
      <div
        className="sg-metric-icon"
        style={{
          background:
            getNodeBackground(type),
          color:
            getNodeColor(type),
        }}
      >
        {icon}
      </div>

      <div>
        <div className="sg-metric-title">
          {title}
        </div>

        <div className="sg-metric-value">
          {value}
        </div>
      </div>
    </div>
  );
}


function DetailPanel({
  node,
  nodes,
  links,
  onClose,
}) {
  if (!node) {
    return (
      <div className="sg-details-empty">
        <GitBranch size={30} />

        <h3>
          Explore the graph
        </h3>

        <p>
          Click a person, project, or
          skill to see its connections.
        </p>
      </div>
    );
  }

  const relatedLinks =
    links.filter(
      (link) =>
        link.source === node.id ||
        link.target === node.id
    );

  const relatedNodeIds =
    relatedLinks.map(
      (link) =>
        link.source === node.id
          ? link.target
          : link.source
    );

  const relatedNodes =
    nodes.filter(
      (item) =>
        relatedNodeIds.includes(
          item.id
        )
    );

  const people =
    relatedNodes.filter(
      (item) =>
        item.type === "employee"
    );

  const projects =
    relatedNodes.filter(
      (item) =>
        item.type === "project"
    );

  const skills =
    relatedNodes.filter(
      (item) =>
        item.type === "skill"
    );

  return (
    <div className="sg-detail-panel">
      <button
        className="sg-detail-close"
        onClick={onClose}
        aria-label="Close details"
      >
        <X size={18} />
      </button>

      <div
        className="sg-detail-main-icon"
        style={{
          background:
            getNodeBackground(
              node.type
            ),
          color:
            getNodeColor(
              node.type
            ),
        }}
      >
        {getNodeIcon(node.type)}
      </div>

      <div className="sg-detail-title">
        {node.name}
      </div>

      <div className="sg-detail-type">
        {node.type === "employee"
          ? "Employee"
          : node.type === "project"
            ? "Project"
            : "Skill"}
      </div>

      {node.type ===
        "project" && (
        <>
          {node.description && (
            <div className="sg-detail-description">
              {node.description}
            </div>
          )}

          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              People (
              {people.length})
            </div>

            {people.length === 0 ? (
              <div className="sg-detail-muted">
                No people found.
              </div>
            ) : (
              people.map(
                (person) => (
                  <div
                    className="sg-detail-row"
                    key={person.id}
                  >
                    <div className="sg-small-avatar blue">
                      <CircleUserRound
                        size={16}
                      />
                    </div>

                    <span>
                      {person.name}
                    </span>

                    <span className="sg-type-pill blue-pill">
                      User
                    </span>
                  </div>
                )
              )
            )}
          </div>

          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              Skills Used (
              {skills.length})
            </div>

            {skills.length ===
            0 ? (
              <div className="sg-detail-muted">
                No project skills
                recorded.
              </div>
            ) : (
              skills.map(
                (skill) => (
                  <div
                    className="sg-detail-row"
                    key={skill.id}
                  >
                    <div className="sg-small-avatar purple">
                      <Sparkles
                        size={16}
                      />
                    </div>

                    <span>
                      {skill.name}
                    </span>

                    <span className="sg-type-pill purple-pill">
                      Skill
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </>
      )}

      {node.type ===
        "employee" && (
        <>
          {node.email && (
            <div className="sg-detail-description">
              {node.email}
            </div>
          )}

          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              Projects (
              {projects.length})
            </div>

            {projects.map(
              (project) => (
                <div
                  className="sg-detail-row"
                  key={project.id}
                >
                  <div className="sg-small-avatar green">
                    <BriefcaseBusiness
                      size={16}
                    />
                  </div>

                  <span>
                    {project.name}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              Skills (
              {skills.length})
            </div>

            {skills.map(
              (skill) => (
                <div
                  className="sg-detail-row"
                  key={skill.id}
                >
                  <div className="sg-small-avatar purple">
                    <Sparkles
                      size={16}
                    />
                  </div>

                  <span>
                    {skill.name}
                  </span>
                </div>
              )
            )}
          </div>
        </>
      )}

      {node.type ===
        "skill" && (
        <>
          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              Used By
            </div>

            {people.map(
              (person) => (
                <div
                  className="sg-detail-row"
                  key={person.id}
                >
                  <div className="sg-small-avatar blue">
                    <CircleUserRound
                      size={16}
                    />
                  </div>

                  <span>
                    {person.name}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="sg-detail-section">
            <div className="sg-detail-section-title">
              Projects
            </div>

            {projects.map(
              (project) => (
                <div
                  className="sg-detail-row"
                  key={project.id}
                >
                  <div className="sg-small-avatar green">
                    <BriefcaseBusiness
                      size={16}
                    />
                  </div>

                  <span>
                    {project.name}
                  </span>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}


function SkillInsights() {
  const [graphData, setGraphData] =
    useState({
      nodes: [],
      links: [],
      summary: {
        employees: 0,
        projects: 0,
        skills: 0,
        connections: 0,
      },
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState("");

  const [selectedNode, setSelectedNode] =
    useState(null);

  const loadGraph =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await API.get(
            "/api/graph"
          );

        const data =
          response.data;

        setGraphData({
          nodes:
            data.nodes || [],
          links:
            data.links || [],
          summary:
            data.summary || {
              employees: 0,
              projects: 0,
              skills: 0,
              connections: 0,
            },
        });
      } catch (err) {
        console.error(
          "Unable to load graph:",
          err
        );

        setError(
          err.response?.data
            ?.detail ||
            "Unable to load the Skill Graph."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadGraph();
  }, []);

  const projects =
    useMemo(
      () =>
        graphData.nodes.filter(
          (node) =>
            node.type ===
            "project"
        ),
      [graphData.nodes]
    );

  const filteredProjects =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return projects;
      }

      return projects.filter(
        (project) =>
          project.name
            .toLowerCase()
            .includes(value)
      );
    }, [
      projects,
      search,
    ]);

  useEffect(() => {
    if (
      projects.length === 0
    ) {
      setSelectedProject("");
      return;
    }

    const selectedStillExists =
      projects.some(
        (project) =>
          project.id ===
          selectedProject
      );

    if (
      !selectedProject ||
      !selectedStillExists
    ) {
      setSelectedProject(
        projects[0].id
      );
    }
  }, [
    projects,
    selectedProject,
  ]);

  const selectedProjectNode =
    graphData.nodes.find(
      (node) =>
        node.id ===
        selectedProject
    );

  const visibleData =
    useMemo(() => {
      if (
        !selectedProjectNode
      ) {
        return {
          nodes: [],
          links: [],
        };
      }

      const projectId =
        selectedProjectNode.id;

      const projectLinks =
        graphData.links.filter(
          (link) =>
            link.source ===
              projectId ||
            link.target ===
              projectId ||
            (
              link.type ===
                "employee-skill" &&
              graphData.links.some(
                (projectLink) =>
                  projectLink.type ===
                    "employee-project" &&
                  projectLink.source ===
                    link.source &&
                  projectLink.target ===
                    projectId
              )
            )
        );

      const connectedIds =
        new Set([
          projectId,
        ]);

      projectLinks.forEach(
        (link) => {
          connectedIds.add(
            link.source
          );

          connectedIds.add(
            link.target
          );
        }
      );

      const nodes =
        graphData.nodes.filter(
          (node) =>
            connectedIds.has(
              node.id
            )
        );

      return {
        nodes,
        links: projectLinks,
      };
    }, [
      graphData,
      selectedProjectNode,
    ]);

  const positions =
    useMemo(
      () =>
        createInitialPositions(
          visibleData.nodes,
          980,
          560
        ),
      [visibleData.nodes]
    );

  const visibleSummary =
    useMemo(() => {
      const employeeCount =
        visibleData.nodes.filter(
          (node) =>
            node.type ===
            "employee"
        ).length;

      const projectCount =
        visibleData.nodes.filter(
          (node) =>
            node.type ===
            "project"
        ).length;

      const skillCount =
        visibleData.nodes.filter(
          (node) =>
            node.type ===
            "skill"
        ).length;

      return {
        employees:
          employeeCount,
        projects:
          projectCount,
        skills:
          skillCount,
        connections:
          visibleData.links
            .length,
      };
    }, [visibleData]);

  const handleProjectSelect =
    (projectId) => {
      setSelectedProject(
        projectId
      );
      setSelectedNode(null);

      const project =
        projects.find(
          (item) =>
            item.id ===
            projectId
        );

      if (project) {
        setSearch(
          project.name
        );
      }
    };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .skill-graph-page {
          min-height: 100vh;
          background: #f5f8fc;
          color: #172033;
          padding: 32px 42px 42px;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .sg-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .sg-header-left {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .sg-title-icon {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: #315eea;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 14px 28px rgba(49, 94, 234, 0.18);
        }

        .sg-title {
          margin: 0;
          font-size: 42px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -1.6px;
        }

        .sg-subtitle {
          margin: 10px 0 0;
          color: #71809b;
          font-size: 19px;
        }

        .sg-refresh {
          border: 1px solid #dce4f0;
          background: white;
          color: #2f63e9;
          border-radius: 15px;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 700;
          box-shadow:
            0 4px 12px rgba(24, 39, 75, 0.03);
        }

        .sg-refresh:hover {
          background: #f7faff;
        }

        .sg-metrics {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 24px;
          margin-bottom: 30px;
        }

        .sg-metric-card {
          min-height: 132px;
          background: white;
          border: 1px solid #dde5f0;
          border-radius: 21px;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 26px;
          box-shadow:
            0 8px 25px rgba(28, 46, 82, 0.025);
        }

        .sg-metric-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sg-metric-title {
          color: #7a89a4;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .sg-metric-value {
          font-size: 32px;
          line-height: 1;
          font-weight: 800;
          color: #111a2e;
        }

        .sg-main-card {
          background: white;
          border: 1px solid #dce5f0;
          border-radius: 25px;
          overflow: hidden;
          box-shadow:
            0 12px 35px rgba(29, 45, 76, 0.035);
        }

        .sg-toolbar {
          padding: 27px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
          border-bottom: 1px solid #e7edf5;
        }

        .sg-toolbar-title {
          margin: 0;
          font-size: 25px;
          font-weight: 800;
          color: #172033;
        }

        .sg-toolbar-text {
          margin: 7px 0 0;
          color: #7a89a4;
          font-size: 16px;
        }

        .sg-search {
          width: 390px;
          height: 60px;
          border: 1px solid #d9e2ef;
          border-radius: 16px;
          display: flex;
          align-items: center;
          padding: 0 17px;
          gap: 12px;
          background: white;
          flex-shrink: 0;
        }

        .sg-search svg {
          color: #8a9ab5;
        }

        .sg-search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 16px;
          color: #172033;
        }

        .sg-search input::placeholder {
          color: #9aa8bd;
        }

        .sg-project-results {
          padding: 12px 30px;
          border-bottom: 1px solid #e7edf5;
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
        }

        .sg-project-label {
          color: #7a89a4;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        .sg-project-chip {
          border: 1px solid #dce4f0;
          background: #f8faff;
          color: #52627e;
          border-radius: 999px;
          padding: 9px 15px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .sg-project-chip:hover {
          border-color: #8facf5;
          color: #2f63e9;
        }

        .sg-project-chip.active {
          background: #2f63e9;
          border-color: #2f63e9;
          color: white;
        }

        .sg-legend {
          min-height: 62px;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e7edf5;
        }

        .sg-legend-items {
          display: flex;
          gap: 25px;
          align-items: center;
        }

        .sg-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #52627e;
          font-size: 15px;
          font-weight: 600;
        }

        .sg-legend-dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
        }

        .sg-instruction {
          color: #8a98af;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .sg-workspace {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) 335px;
          min-height: 590px;
        }

        .sg-graph-area {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at center,
              #ffffff 0%,
              #fbfcfe 65%,
              #f7f9fc 100%
            );
          min-height: 590px;
        }

        .sg-graph-svg {
          width: 100%;
          height: 590px;
          display: block;
        }

        .sg-link {
          stroke: #d7e1f1;
          stroke-width: 2;
        }

        .sg-link-project {
          stroke: #9bb9fa;
        }

        .sg-link-skill {
          stroke: #c9b3f8;
        }

        .sg-link-user-skill {
          stroke: #d8d2ec;
          stroke-dasharray: 5 5;
        }

        .sg-node {
          cursor: pointer;
        }

        .sg-node-circle {
          stroke: white;
          stroke-width: 5;
          filter:
            drop-shadow(
              0 8px 14px
              rgba(40, 60, 100, 0.15)
            );
        }

        .sg-node-label {
          fill: #172033;
          font-size: 14px;
          font-weight: 700;
          text-anchor: middle;
        }

        .sg-node-sub {
          fill: #8a98af;
          font-size: 11px;
          text-anchor: middle;
        }

        .sg-empty-graph {
          height: 100%;
          min-height: 590px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: #8291aa;
          text-align: center;
          padding: 40px;
        }

        .sg-empty-graph svg {
          margin-bottom: 14px;
          color: #315eea;
        }

        .sg-empty-graph h3 {
          margin: 0 0 7px;
          color: #26334b;
          font-size: 20px;
        }

        .sg-empty-graph p {
          margin: 0;
          max-width: 430px;
          line-height: 1.6;
        }

        .sg-details {
          border-left: 1px solid #e1e8f2;
          background: #ffffff;
          min-height: 590px;
        }

        .sg-details-empty {
          min-height: 590px;
          padding: 45px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #8997ad;
        }

        .sg-details-empty svg {
          color: #315eea;
          margin-bottom: 15px;
        }

        .sg-details-empty h3 {
          color: #25324a;
          margin: 0 0 8px;
          font-size: 19px;
        }

        .sg-details-empty p {
          line-height: 1.6;
          margin: 0;
        }

        .sg-detail-panel {
          padding: 28px 25px;
          position: relative;
          min-height: 590px;
        }

        .sg-detail-close {
          position: absolute;
          right: 20px;
          top: 20px;
          width: 34px;
          height: 34px;
          border: 1px solid #e0e7f0;
          border-radius: 10px;
          background: white;
          color: #78879f;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sg-detail-main-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 17px;
        }

        .sg-detail-title {
          font-size: 23px;
          font-weight: 800;
          color: #182238;
          padding-right: 35px;
        }

        .sg-detail-type {
          margin-top: 4px;
          color: #8a98af;
          font-size: 14px;
        }

        .sg-detail-description {
          margin-top: 17px;
          padding: 14px;
          background: #f7f9fc;
          border: 1px solid #e7edf5;
          border-radius: 12px;
          color: #65758f;
          font-size: 14px;
          line-height: 1.55;
        }

        .sg-detail-section {
          margin-top: 25px;
        }

        .sg-detail-section-title {
          color: #26334b;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 11px;
        }

        .sg-detail-row {
          min-height: 45px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid #edf1f6;
          color: #465670;
          font-size: 14px;
        }

        .sg-detail-row span:nth-child(2) {
          flex: 1;
          font-weight: 600;
        }

        .sg-small-avatar {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sg-small-avatar.blue {
          background: #eaf1ff;
          color: #2f6df6;
        }

        .sg-small-avatar.green {
          background: #e8f8f2;
          color: #13a673;
        }

        .sg-small-avatar.purple {
          background: #f1eaff;
          color: #7c3aed;
        }

        .sg-type-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 999px;
        }

        .blue-pill {
          color: #2f6df6;
          background: #eaf1ff;
        }

        .purple-pill {
          color: #7c3aed;
          background: #f1eaff;
        }

        .sg-detail-muted {
          color: #9aa7ba;
          font-size: 13px;
          padding: 7px 0;
        }

        @media (max-width: 1100px) {
          .skill-graph-page {
            padding: 25px;
          }

          .sg-metrics {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .sg-workspace {
            grid-template-columns:
              1fr;
          }

          .sg-details {
            border-left: none;
            border-top: 1px solid #e1e8f2;
          }

          .sg-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .sg-search {
            width: 100%;
          }
        }

        @media (max-width: 700px) {
          .skill-graph-page {
            padding: 18px;
          }

          .sg-header {
            flex-direction: column;
            gap: 20px;
          }

          .sg-title {
            font-size: 32px;
          }

          .sg-title-icon {
            width: 56px;
            height: 56px;
          }

          .sg-metrics {
            grid-template-columns:
              1fr;
          }

          .sg-legend {
            align-items: flex-start;
            flex-direction: column;
            padding: 16px 20px;
            gap: 10px;
          }

          .sg-toolbar {
            padding: 22px 20px;
          }

          .sg-project-results {
            padding: 12px 20px;
          }
        }
      `}</style>

      <div className="skill-graph-page">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="sg-header">

          <div className="sg-header-left">

            <div className="sg-title-icon">
              <GitBranch
                size={34}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className="sg-title">
                Skill Graph
              </h1>

              <p className="sg-subtitle">
                Explore the connections between
                people, projects and skills.
              </p>
            </div>

          </div>

          <button
            className="sg-refresh"
            onClick={loadGraph}
          >
            <RefreshCw
              size={18}
            />

            Refresh
          </button>

        </div>


        {/* ================================================= */}
        {/* METRICS */}
        {/* ================================================= */}

        <div className="sg-metrics">

          <MetricCard
            type="employee"
            title="Users"
            value={
              visibleSummary.employees
            }
            icon={
              <Users
                size={30}
              />
            }
          />

          <MetricCard
            type="project"
            title="Projects"
            value={
              visibleSummary.projects
            }
            icon={
              <BriefcaseBusiness
                size={30}
              />
            }
          />

          <MetricCard
            type="skill"
            title="Skills"
            value={
              visibleSummary.skills
            }
            icon={
              <Sparkles
                size={30}
              />
            }
          />

          <MetricCard
            type="project"
            title="Connections"
            value={
              visibleSummary.connections
            }
            icon={
              <GitBranch
                size={30}
              />
            }
          />

        </div>


        {/* ================================================= */}
        {/* MAIN GRAPH CARD */}
        {/* ================================================= */}

        <div className="sg-main-card">

          {/* Toolbar */}

          <div className="sg-toolbar">

            <div>
              <h2 className="sg-toolbar-title">
                People · Projects · Skills
              </h2>

              <p className="sg-toolbar-text">
                Search for a project to see
                who worked on it and which
                skills they used.
              </p>
            </div>

            <div className="sg-search">

              <Search
                size={22}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search projects..."
              />

            </div>

          </div>


          {/* Project search results */}

          {filteredProjects.length >
            0 && (

            <div className="sg-project-results">

              <span className="sg-project-label">
                Projects:
              </span>

              {filteredProjects.map(
                (project) => (

                  <button
                    key={project.id}
                    className={
                      "sg-project-chip " +
                      (
                        selectedProject ===
                        project.id
                          ? "active"
                          : ""
                      )
                    }
                    onClick={() =>
                      handleProjectSelect(
                        project.id
                      )
                    }
                  >
                    {project.name}
                  </button>

                )
              )}

            </div>

          )}


          {/* Legend */}

          <div className="sg-legend">

            <div className="sg-legend-items">

              <div className="sg-legend-item">

                <span
                  className="sg-legend-dot"
                  style={{
                    background:
                      "#2f6df6",
                  }}
                />

                Users

              </div>

              <div className="sg-legend-item">

                <span
                  className="sg-legend-dot"
                  style={{
                    background:
                      "#13a673",
                  }}
                />

                Projects

              </div>

              <div className="sg-legend-item">

                <span
                  className="sg-legend-dot"
                  style={{
                    background:
                      "#7c3aed",
                  }}
                />

                Skills

              </div>

            </div>

            <div className="sg-instruction">

              <Sparkles
                size={17}
              />

              Click any node to explore
              its connections

            </div>

          </div>


          {/* Workspace */}

          <div className="sg-workspace">

            <div className="sg-graph-area">

              {loading && (

                <div className="sg-empty-graph">

                  <RefreshCw
                    size={32}
                    className="spin"
                  />

                  <h3>
                    Loading Skill Graph...
                  </h3>

                  <p>
                    Loading people,
                    projects and skills
                    from MongoDB.
                  </p>

                </div>

              )}


              {!loading &&
                error && (

                  <div className="sg-empty-graph">

                    <GitBranch
                      size={36}
                    />

                    <h3>
                      Unable to load
                      Skill Graph
                    </h3>

                    <p>
                      {error}
                    </p>

                  </div>

                )}


              {!loading &&
                !error &&
                visibleData.nodes
                  .length === 0 && (

                  <div className="sg-empty-graph">

                    <Search
                      size={36}
                    />

                    <h3>
                      No project found
                    </h3>

                    <p>
                      Search for a project
                      to explore the people
                      and skills connected
                      to it.
                    </p>

                  </div>

                )}


              {!loading &&
                !error &&
                visibleData.nodes
                  .length > 0 && (

                  <svg
                    className="sg-graph-svg"
                    viewBox="0 0 980 560"
                    preserveAspectRatio="xMidYMid meet"
                  >

                    {/* -------------------------------- */}
                    {/* CONNECTION LINES */}
                    {/* -------------------------------- */}

                    {visibleData.links.map(
                      (
                        link,
                        index
                      ) => {

                        const source =
                          positions[
                            link.source
                          ];

                        const target =
                          positions[
                            link.target
                          ];

                        if (
                          !source ||
                          !target
                        ) {
                          return null;
                        }

                        let lineClass =
                          "sg-link";

                        if (
                          link.type ===
                          "employee-project"
                        ) {
                          lineClass +=
                            " sg-link-project";
                        }

                        if (
                          link.type ===
                          "project-skill"
                        ) {
                          lineClass +=
                            " sg-link-skill";
                        }

                        if (
                          link.type ===
                          "employee-skill"
                        ) {
                          lineClass +=
                            " sg-link-user-skill";
                        }

                        return (
                          <line
                            key={
                              `link-${index}`
                            }
                            x1={
                              source.x
                            }
                            y1={
                              source.y
                            }
                            x2={
                              target.x
                            }
                            y2={
                              target.y
                            }
                            className={
                              lineClass
                            }
                          />
                        );
                      }
                    )}


                    {/* -------------------------------- */}
                    {/* NODES */}
                    {/* -------------------------------- */}

                    {visibleData.nodes.map(
                      (node) => {

                        const position =
                          positions[
                            node.id
                          ];

                        if (
                          !position
                        ) {
                          return null;
                        }

                        const isSelected =
                          selectedNode
                            ?.id ===
                          node.id;

                        const isProject =
                          node.type ===
                          "project";

                        const radius =
                          isProject
                            ? 48
                            : 32;

                        return (
                          <g
                            key={
                              node.id
                            }
                            className="sg-node"
                            onClick={() =>
                              setSelectedNode(
                                node
                              )
                            }
                          >

                            <circle
                              cx={
                                position.x
                              }
                              cy={
                                position.y
                              }
                              r={
                                radius +
                                (
                                  isSelected
                                    ? 7
                                    : 0
                                )
                              }
                              fill={
                                getNodeColor(
                                  node.type
                                )
                              }
                              opacity={
                                isSelected
                                  ? 0.12
                                  : 0.08
                              }
                            />

                            <circle
                              cx={
                                position.x
                              }
                              cy={
                                position.y
                              }
                              r={
                                radius
                              }
                              fill={
                                getNodeColor(
                                  node.type
                                )
                              }
                              className="sg-node-circle"
                            />

                            <foreignObject
                              x={
                                position.x -
                                18
                              }
                              y={
                                position.y -
                                18
                              }
                              width="36"
                              height="36"
                            >

                              <div
                                style={{
                                  width:
                                    "36px",
                                  height:
                                    "36px",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  color:
                                    "white",
                                }}
                              >
                                {getNodeIcon(
                                  node.type
                                )}
                              </div>

                            </foreignObject>

                            <text
                              x={
                                position.x
                              }
                              y={
                                position.y +
                                radius +
                                24
                              }
                              className="sg-node-label"
                            >
                              {node.name}
                            </text>

                            <text
                              x={
                                position.x
                              }
                              y={
                                position.y +
                                radius +
                                41
                              }
                              className="sg-node-sub"
                            >
                              {node.type ===
                              "employee"
                                ? "User"
                                : node.type ===
                                    "project"
                                  ? "Project"
                                  : "Skill"}
                            </text>

                          </g>
                        );
                      }
                    )}

                  </svg>

                )}

            </div>


            {/* Details panel */}

            <div className="sg-details">

              <DetailPanel
                node={
                  selectedNode
                }
                nodes={
                  visibleData.nodes
                }
                links={
                  visibleData.links
                }
                onClose={() =>
                  setSelectedNode(
                    null
                  )
                }
              />

            </div>

          </div>

        </div>

      </div>
    </>
  );
}


export default SkillInsights;