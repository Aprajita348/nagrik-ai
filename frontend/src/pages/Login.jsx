import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { useLang } from "../i18n";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
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
      navigate(me.role === "citizen" ? "/citizen" : me.role === "admin" ? "/admin-dashboard" : "/officer");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Something went wrong"));
    }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === "login" ? t("login") : t("createAccount")}</h2>
      <input placeholder={t("username")} value={form.username} onChange={set("username")} required />
      <input type="password" placeholder={t("password")} value={form.password} onChange={set("password")} required />
      {mode === "register" && (
        <>
          <input placeholder={t("fullName")} value={form.first_name} onChange={set("first_name")} />
          <input type="email" placeholder={t("email")} value={form.email} onChange={set("email")} />
          <input placeholder={t("phone")} value={form.phone} onChange={set("phone")} />
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">{mode === "login" ? t("login") : t("register")}</button>
      <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? t("newCitizen") : t("haveAccount")}
      </button>
    </form>
  );
}