import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Citizen from "./pages/Citizen";
import Officer from "./pages/Officer";
import Schemes from "./pages/Schemes";
import Assistant from "./pages/Assistant";
import AdminDashboard from "./pages/AdminDashboard";

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

function Navbar() {
  const { user, logout } = useAuth();
  const white = { color: "#fff" };
  return (
    <header className="nav">
      <strong>Nagrik AI</strong>
      {user && (
        <div>
          <Link to="/" style={white}>{user.role === "admin" ? "Dashboard" : "Complaints"}</Link>
          {user.role === "admin" && <Link to="/officer" style={white}>Manage complaints</Link>}
          <Link to="/schemes" style={white}>Schemes</Link>
          <Link to="/assistant" style={white}>AI Assistant</Link>
          <span>
            {user.username} ({user.role}
            {user.department_name ? `, ${user.department_name}` : ""})
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/citizen" element={<Protected roles={["citizen"]}><Citizen /></Protected>} />
          <Route path="/officer" element={<Protected roles={["officer", "admin"]}><Officer /></Protected>} />
          <Route path="/admin-dashboard" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
        </Routes>
      </main>
    </>
  );
}