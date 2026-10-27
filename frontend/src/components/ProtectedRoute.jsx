import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({
  children,
  requireAdmin = false,
  role,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, Arial, sans-serif",
          color: "#2563eb",
          background: "#f6f8fc",
          fontSize: "14px",
        }}
      >
        Loading SkillConnect...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/employee/login"}
        replace
      />
    );
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  if (role && user.role !== role && !(role === "employee" && user.role === "admin")) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"} replace />;
  }

  return children;
}

export default ProtectedRoute;
