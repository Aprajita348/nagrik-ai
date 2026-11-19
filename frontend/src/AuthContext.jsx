import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem("access")) {
        try {
          const { data } = await api.get("/auth/me/");
          setUser(data);
        } catch {
          clearTokens();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Back button se browser ka cached page khule aur login na ho, to login par bhej do
  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted && !localStorage.getItem("access")) {
        window.location.replace("/login");
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const login = async (username, password) => {
    clearTokens();
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    const me = await api.get("/auth/me/");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}