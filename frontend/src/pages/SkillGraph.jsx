import { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import API from "../services/api";

function SkillGraph() {

  const [graphData, setGraphData] = useState({
    nodes: [],
    links: []
  });

  const [summary, setSummary] = useState({
    employees: 0,
    skills: 0,
    projects: 0,
    connections: 0
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    const fetchGraphData = async () => {

      try {

        const response = await API.get(
          "/api/graph"
        );

        console.log(
          "Graph data:",
          response.data
        );

        setGraphData({
          nodes: response.data.nodes || [],
          links: response.data.links || []
        });

        setSummary(
          response.data.summary || {
            employees: 0,
            skills: 0,
            projects: 0,
            connections: 0
          }
        );

      } catch (error) {

        console.error(
          "Graph error:",
          error
        );

        setError(
          "Unable to load employee skill graph."
        );

      } finally {

        setLoading(false);
      }
    };

    fetchGraphData();

  }, []);


  const getNodeColor = (node) => {

    if (node.type === "employee") {
      return "#2563eb";
    }

    if (node.type === "skill") {
      return "#16a34a";
    }

    if (node.type === "project") {
      return "#9333ea";
    }

    return "#64748b";
  };


  const getNodeRadius = (node) => {

    if (node.type === "employee") {
      return 8;
    }

    if (node.type === "skill") {
      return 7;
    }

    if (node.type === "project") {
      return 7;
    }

    return 6;
  };


  if (loading) {

    return (
      <div>
        <h1>
          Loading Skill Network...
        </h1>
      </div>
    );
  }


  return (
    <div
      style={{
        padding: "24px"
      }}
    >

      <h1>
        Employee Skill Network
      </h1>

      <p>
        Visualize relationships between
        employees, skills and projects.
      </p>


      {error && (
        <p>
          {error}
        </p>
      )}


      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "16px",
          marginTop: "24px",
          marginBottom: "24px"
        }}
      >

        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        >

          <h3>
            Employees
          </h3>

          <h2>
            {summary.employees}
          </h2>

        </div>


        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        >

          <h3>
            Skills
          </h3>

          <h2>
            {summary.skills}
          </h2>

        </div>


        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        >

          <h3>
            Projects
          </h3>

          <h2>
            {summary.projects}
          </h2>

        </div>


        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        >

          <h3>
            Connections
          </h3>

          <h2>
            {summary.connections}
          </h2>

        </div>

      </div>


      {/* LEGEND */}

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "16px",
          flexWrap: "wrap"
        }}
      >

        <div>
          🔵 Employees
        </div>

        <div>
          🟢 Skills
        </div>

        <div>
          🟣 Projects
        </div>

      </div>


      {/* GRAPH */}

      {graphData.nodes.length === 0 ? (

        <div
          style={{
            padding: "40px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            textAlign: "center"
          }}
        >

          <h2>
            No graph data available
          </h2>

          <p>
            Add employees, skills and projects
            to see the network.
          </p>

        </div>

      ) : (

        <div
          style={{
            width: "100%",
            height: "650px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#f8fafc"
          }}
        >

          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node) => {
              return `${node.type}: ${node.name}`;
            }}
            nodeColor={getNodeColor}
            nodeRelSize={6}
            nodeVal={getNodeRadius}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}
            linkWidth={1.5}
            linkColor={() => "#94a3b8"}
            cooldownTicks={100}
            onNodeClick={(node) => {

              alert(
                `${node.type.toUpperCase()}\n\n${node.name}`
              );

            }}
          />

        </div>

      )}

    </div>
  );
}

export default SkillGraph;