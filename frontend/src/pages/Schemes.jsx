import { useEffect, useState } from "react";
import api from "../api";
import { useLang } from "../i18n";

const CATEGORIES = ["student", "farmer", "women", "senior", "health", "business", "housing", "other"];
const OCCUPATIONS = ["student", "farmer", "business", "salaried", "unemployed", "homemaker", "artisan", "other"];

function SchemeCard({ s, saved, onToggle }) {
  const { t } = useLang();
  return (
    <div className="card">
      <div className="row between">
        <strong>{s.name}</strong>
        <span className="badge">{t("level_" + s.level)} | {t("cat_" + s.category)}</span>
      </div>
      <p>{s.description}</p>
      {s.documents_list.length > 0 && <small>{t("documents")}: {s.documents_list.join(", ")}</small>}
      {s.last_date && <small>{t("lastDate")}: {s.last_date}</small>}
      <div className="row between">
        <a href={s.official_link} target="_blank" rel="noreferrer">{t("official")}</a>
        <button onClick={() => onToggle(s.id)}>{saved ? t("saved") : t("save")}</button>
      </div>
    </div>
  );
}

export default function Schemes() {
  const { t } = useLang();
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
    try {
      await api.post(`/schemes/${id}/bookmark/`);
      await loadSaved();
    } catch (err) {
      alert("Save failed: " + (err.response?.status || "") + " " + JSON.stringify(err.response?.data || err.message));
    }
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
          <h2>{t("whichSchemes")}</h2>
          <input type="number" placeholder={t("agePh")} value={profile.age} onChange={setP("age")} />
          <input type="number" placeholder={t("incomePh")} value={profile.annual_income} onChange={setP("annual_income")} />
          <select value={profile.occupation} onChange={setP("occupation")}>
            <option value="">{t("occAny")}</option>
            {OCCUPATIONS.map((o) => <option key={o} value={o}>{t("occ_" + o)}</option>)}
          </select>
          <select value={profile.gender} onChange={setP("gender")}>
            <option value="">{t("genderAny")}</option>
            <option value="female">{t("female")}</option>
            <option value="male">{t("male")}</option>
          </select>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary">{t("checkElig")}</button>
        </form>

        {result && (
          <>
            <p className="notice">{t("matches", { n: result.count })} {t("guidance")}</p>
            {result.schemes.map((s) => (
              <SchemeCard key={s.id} s={s} saved={saved.includes(s.id)} onToggle={toggle} />
            ))}
          </>
        )}
      </section>

      <section>
        <h2>{t("browse")}</h2>
        <div className="row wrap">
          <input placeholder={t("searchPh")} value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t("allCat")}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t("cat_" + c)}</option>)}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">{t("centralState")}</option>
            <option value="central">{t("level_central")}</option>
            <option value="state">{t("level_state")}</option>
          </select>
        </div>
        <br />
        {schemes.length === 0 && <p>{t("noSchemes")}</p>}
        {schemes.map((s) => (
          <SchemeCard key={s.id} s={s} saved={saved.includes(s.id)} onToggle={toggle} />
        ))}
      </section>
    </div>
  );
}