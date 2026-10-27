import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import FindPeople from "./pages/FindPeople.jsx";
import Employees from "./pages/Employees.jsx";
import Skills from "./pages/Skills.jsx";
import Projects from "./pages/Projects.jsx";
import SkillInsights from "./pages/SkillInsights.jsx";
import Settings from "./pages/Settings.jsx";
import EmployeeTasks from "./pages/EmployeeTasks.jsx";
import EmployeeCertifications from "./pages/EmployeeCertifications.jsx";
import AdminCertificationWorkspace from "./pages/AdminCertificationWorkspace.jsx";
import AdminOverview from "./pages/AdminOverview.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDiscover from "./pages/AdminDiscover.jsx";
import AdminProjectsTasks from "./pages/AdminProjectsTasks.jsx";
import AdminAccess from "./pages/AdminAccess.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import EmployeeLayout from "./components/EmployeeLayout.jsx";

function RoleLanding() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          {/* =========================
              PUBLIC PAGES
             ========================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/login"
            element={<Navigate to="/employee/login" replace />}
          />
          <Route path="/employee/login" element={<Login role="employee" />} />
          <Route path="/admin/login" element={<Login role="admin" />} />


          {/* =========================
              PROTECTED PAGES
             ========================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleLanding />
              </ProtectedRoute>
            }
          />
          <Route element={<ProtectedRoute role="employee"><EmployeeLayout /></ProtectedRoute>}>
            <Route path="/employee/dashboard" element={<Dashboard />} />
            <Route path="/employee/my-tasks" element={<EmployeeTasks />} />
            <Route path="/employee/certifications" element={<EmployeeCertifications />} />
            <Route path="/employee/profile" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/find-people" element={<FindPeople />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skill-insights" element={<SkillInsights />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/discover" element={<AdminDiscover />} />
            <Route path="/admin/projects-tasks" element={<AdminProjectsTasks />} />
            <Route path="/admin/certifications" element={<AdminCertificationWorkspace />} />
            <Route path="/admin/insights" element={<AdminReports />} />
            <Route path="/admin/access" element={<AdminAccess />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/preferences" element={<Settings />} />
            <Route path="/admin/employees" element={<Navigate to="/admin/access" replace />} />
            <Route path="/admin/employee-directory" element={<Navigate to="/admin/discover?type=employees" replace />} />
            <Route path="/admin/skills" element={<Navigate to="/admin/discover?type=skills" replace />} />
            <Route path="/admin/matches" element={<Navigate to="/admin/discover?type=matches" replace />} />
            <Route path="/admin/projects" element={<Navigate to="/admin/projects-tasks?tab=projects" replace />} />
            <Route path="/admin/tasks" element={<Navigate to="/admin/projects-tasks?tab=tasks" replace />} />
          </Route>

          <Route
            path="/admin"
            element={
              <Navigate to="/admin/dashboard" replace />
            }
          />


          {/* =========================
              UNKNOWN URL
             ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
