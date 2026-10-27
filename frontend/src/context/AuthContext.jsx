import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import API from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      const savedUser = localStorage.getItem("user");
      localStorage.removeItem("authToken");
      try {
        const response = await API.get("/api/auth/me");
        if (mounted) {
          const verifiedUser = response.data?.user;
          if (verifiedUser) {
            localStorage.setItem("user", JSON.stringify(verifiedUser));
            setUser(verifiedUser);
          }
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          if (mounted) setUser(null);
        } else {
          try { if (mounted) setUser(savedUser ? JSON.parse(savedUser) : null); }
          catch { if (mounted) setUser(null); }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restoreSession();
    return () => { mounted = false; };
  }, []);

  const login = (userData) => {
    if (!userData) {
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  const logout = async () => {
    try {
      if (user) {
        await API.post("/api/auth/logout");
      }
    } catch {
      // Clear the local session even if the server session already expired.
    }
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("rememberMe");

    setUser(null);
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser) {
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
