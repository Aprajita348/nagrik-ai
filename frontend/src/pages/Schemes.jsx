import { useEffect, useState } from "react";
import api from "../api";

const CATEGORIES = ["student", "farmer", "women", "senior", "health", "business", "housing", "other"];
const OCCUPATIONS = ["student", "farmer", "business", "salaried", "unemployed", "homemaker", "artisan", "other"];

function SchemeCard({ s, saved, onToggle }) {
  return (
    <div className="card">
      <div className="row between">
        <strong>{s.name}</strong>
        <span className="badge">{s.level} | {s.category}</span>
      </div>
      <p>{s.description}</p>
      {s.documents_list.length > 0 && <small>Documents: {s.documents_list.join(", ")}</small>}
      {s.last_date && <small>Last date: {s.last_date}</small>}
      <div className="row between">
        <a href={s.official_link} target="_blank" rel="noreferrer">Official website</a>
        <button onClick={() => onToggle(s.id)}>{saved ? "Saved (remove)" : "Save"}</button>
      </div>
    </div>
  );
}

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [saved, setSaved] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [profile, setProfile] = useState({ age: "", annual_income: "", occupation: "", gender: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const setP = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  const loadSaved = () =>
    api.get("/schemes/bookmarks/").then((r) => setSaved(r.data.map((x) => x.id))).catch(() => {});

  useEffect(() => { loadSaved(); }, []);

  useEffect(() => {
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    if (level) params.level = level;
    api.get("/schemes/", { params }).then((r) => setSchemes(r.data));
  }, [q, category, level]);

  const toggle = async (id) => {
    await api.post(`/schemes/${id}/bookmark/`);
    loadSaved();
  };

  const check = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/schemes/check/", profile);
      setResult(data);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Failed"));
    }
  };

  return (
    <div className="grid">
      <section>
        <form className="card" onSubmit={check}>
          <h2>Which schemes can I get?</h2>
          <input type="number" placeholder="Age" value={profile.age} onChange={setP("age")} />
          <input type="number" placeholder="Annual family income (Rs)" value={profile.annual_income} onChange={setP("annual_income")} />
          <select value={profile.occupation} onChange={setP("occupation")}>
            <option value="">Occupation (any)</option>
            {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={profile.gender} onChange={setP("gender")}>
            <option value="">Gender (any)</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary">Check eligibility</button>
        </form>

        {result && (
          <>
            <p className="notice">{result.count} schemes match. {result.note}</p>
            {result.schemes.map((s) => (
              <SchemeCard key={s.id} s={s} saved={saved.includes(s.id)} onToggle={toggle} />
            ))}
          </>
        )}
      </section>

      <section>
        <h2>Browse all schemes</h2>
        <div className="row wrap">
          <input placeholder="Search schemes" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Central + State</option>
            <option value="central">Central</option>
            <option value="state">Uttarakhand</option>
          </select>
        </div>
        <br />
        {schemes.length === 0 && <p>No schemes found.</p>}
        {schemes.map((s) => (
          <SchemeCard key={s.id} s={s} saved={saved.includes(s.id)} onToggle={toggle} />
        ))}
      </section>
    </div>
  );
}