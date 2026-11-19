import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLang } from "./i18n";
import Login from "./pages/Login";
import Citizen from "./pages/Citizen";
import Officer from "./pages/Officer";
import Schemes from "./pages/Schemes";
import Assistant from "./pages/Assistant";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  const target = { citizen: "/citizen", officer: "/officer", admin: "/admin-dashboard" }[user.role];
  return <Navigate to={target} replace />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const white = { color: "#fff" };
  return (
    <header className="nav">
      <strong>Nagrik AI</strong>
      <div className="navlinks">
        {user && (
          <>
            <Link to="/" style={white}>{user.role === "admin" ? t("dashboard") : t("complaints")}</Link>
            {user.role === "admin" && <Link to="/officer" style={white}>{t("manage")}</Link>}
            {user.role === "citizen" && (
              <>
                <Link to="/dashboard" style={white}>{t("myDashboard")}</Link>
                <Link to="/schemes" style={white}>{t("schemes")}</Link>
                <Link to="/assistant" style={white}>{t("assistant")}</Link>
              </>
            )}
          </>
        )}
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")}>{lang === "en" ? "हिंदी" : "English"}</button>
        {user && (
          <>
            <span>
              {user.username} ({user.role}
              {user.department_name ? `, ${user.department_name}` : ""})
            </span>
            <button onClick={logout}>{t("logout")}</button>
          </>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();
  const theme = user && user.role !== "citizen" ? "staff" : "citizen";

  return (
    <div className={`theme theme-${theme}`}>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/citizen" element={<Protected roles={["citizen"]}><Citizen /></Protected>} />
          <Route path="/dashboard" element={<Protected roles={["citizen"]}><Dashboard /></Protected>} />
          <Route path="/schemes" element={<Protected roles={["citizen"]}><Schemes /></Protected>} />
          <Route path="/assistant" element={<Protected roles={["citizen"]}><Assistant /></Protected>} />
          <Route path="/officer" element={<Protected roles={["officer", "admin"]}><Officer /></Protected>} />
          <Route path="/admin-dashboard" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
        </Routes>
      </main>
    </div>
  );
}