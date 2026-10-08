import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      if (urlToken) {
        localStorage.setItem("token", urlToken);
        return urlToken;
      }
    } catch (e) {
      console.warn("Could not parse token from URL:", e);
    }
    return localStorage.getItem("token") || "";
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync / verify user session with backend on load or when token changes
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      let storedToken = localStorage.getItem("token");
      if (!storedToken) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get("token");
          if (urlToken) {
            storedToken = urlToken;
            localStorage.setItem("token", urlToken);
            setToken(urlToken);
          }
        } catch (e) {
          console.warn("Could not check token in URL:", e);
        }
      }

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
            "X-Auth-Token": storedToken,
          },
        });

        if (response.ok) {
          const freshUser = await response.json();
          if (isMounted) {
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
        } else {
          console.warn("Auth session check status:", response.status);
          // Never delete token or user here - let explicit logout action do that
        }
      } catch (err) {
        console.warn("Auth session verification fallback to cached state:", err.message);
        // Keep cached user if network fails so offline/slow reloads don't flash-logout
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("token", newToken);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      if (newUser.role === "admin") {
        localStorage.setItem("gb_admin_token", newToken);
        localStorage.setItem("admin_token", newToken);
        localStorage.setItem("admin_user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("gb_admin_token");
      }
    }
    setToken(newToken);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("gb_admin_token");
    setToken("");
    setUser(null);
  }, []);

  const role = user?.role || "student";
  const isStudent = role === "student";
  const isRecruiter = role === "recruiter";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isStudent,
        isRecruiter,
        isAdmin,
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};