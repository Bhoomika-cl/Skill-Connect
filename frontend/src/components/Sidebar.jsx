import {
  LayoutDashboard,
  Search,
  Users,
  Sparkles,
  FolderKanban,
  BarChart3,
  Settings,
  UserCircle,
  X
} from "lucide-react";

import { NavLink } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Find People",
      path: "/find-people",
      icon: Search
    },
    {
      name: "Employees",
      path: "/employees",
      icon: Users
    },
    {
      name: "Skills",
      path: "/skills",
      icon: Sparkles
    },
    {
      name: "Projects",
      path: "/projects",
      icon: FolderKanban
    },
    {
      name: "Skill Insights",
      path: "/skill-insights",
      icon: BarChart3
    }
  ];

  const accountItems = [
    {
      name: "My Profile",
      path: "/profile",
      icon: UserCircle
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings
    }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`skill-sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <Sparkles size={22} />
            </div>

            <div>
              <h2>SkillConnect</h2>
              <span>Employee Skills Hub</span>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <p className="sidebar-section-title">
              WORKSPACE
            </p>

            <nav>
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive
                          ? "sidebar-link-active"
                          : ""
                      }`
                    }
                  >
                    <Icon size={19} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-section-title">
              ACCOUNT
            </p>

            <nav>
              {accountItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive
                          ? "sidebar-link-active"
                          : ""
                      }`
                    }
                  >
                    <Icon size={19} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <Sparkles size={18} />
          </div>

          <div>
            <strong>SkillConnect</strong>
            <p>Connect people with skills</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;