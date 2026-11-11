import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
          localStorage.removeItem("access");
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    localStorage.removeItem("access");
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    const me = await api.get("/auth/me/");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem("access");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}