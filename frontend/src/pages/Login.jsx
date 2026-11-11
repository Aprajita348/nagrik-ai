import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", first_name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        localStorage.removeItem("access");
        await api.post("/auth/register/", form);
      }
      const me = await login(form.username, form.password);
      navigate(me.role === "citizen" ? "/citizen" : "/officer");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Something went wrong"));
    }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === "login" ? "Login" : "Create citizen account"}</h2>
      <input placeholder="Username" value={form.username} onChange={set("username")} required />
      <input type="password" placeholder="Password" value={form.password} onChange={set("password")} required />
      {mode === "register" && (
        <>
          <input placeholder="Full name" value={form.first_name} onChange={set("first_name")} />
          <input type="email" placeholder="Email" value={form.email} onChange={set("email")} />
          <input placeholder="Phone" value={form.phone} onChange={set("phone")} />
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">{mode === "login" ? "Login" : "Register"}</button>
      <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "New citizen? Register" : "Already have an account? Login"}
      </button>
    </form>
  );
}