import { useEffect, useState } from "react";
import api from "../api";
import { useLang } from "../i18n";

const empty = { title: "", description: "", address: "", category: "", latitude: "", longitude: "" };
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

function Feedback({ c, onDone }) {
  const { t } = useLang();
  const [rating, setRating] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const send = async (action) => {
    setErr("");
    try {
      await api.post(`/complaints/${c.id}/feedback/`, {
        action,
        rating: rating ? Number(rating) : undefined,
        feedback: text,
      });
      onDone();
    } catch (e) {
      setErr(JSON.stringify(e.response?.data || "Failed"));
    }
  };

  return (
    <div className="notice">
      <b>{t("solved")}</b>
      <div className="row wrap">
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">{t("ratingOpt")}</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
        </select>
        <input
          style={{ flex: 1 }}
          placeholder={t("feedbackPh")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="row wrap">
        <button className="primary" onClick={() => send("close")}>{t("yesClose")}</button>
        <button onClick={() => send("reopen")}>{t("noReopen")}</button>
      </div>
      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default function Citizen() {
  const { t } = useLang();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState("");
  const [dup, setDup] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = async () => {
    const { data } = await api.get("/complaints/");
    setComplaints(data);
  };

  useEffect(() => {
    load();
    api.get("/categories/").then((r) => setCategories(r.data));
  }, []);

  const getLocation = () =>
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setForm((f) => ({
          ...f,
          latitude: p.coords.latitude.toFixed(6),
          longitude: p.coords.longitude.toFixed(6),
        })),
      () => setMsg(t("locFail"))
    );

  const send = async (duplicateAction) => {
    setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") fd.append(k, v);
    });
    if (image) fd.append("image", image);
    if (duplicateAction) fd.append("duplicate_action", duplicateAction);
    try {
      const { data } = await api.post("/complaints/", fd);
      setMsg(t("sentTo", { id: data.id, dept: data.department_name, priority: t("pr_" + data.priority) }));
      setDup(null);
      setForm(empty);
      setImage(null);
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        setDup(err.response.data);
        return;
      }
      setMsg(JSON.stringify(err.response?.data || "Failed"));
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setDup(null);
    send("");
  };

  return (
    <div className="grid">
      <form className="card" onSubmit={submit}>
        <h2>{t("fileComplaint")}</h2>
        <input placeholder={t("titlePh")} value={form.title} onChange={set("title")} required />
        <textarea placeholder={t("describePh")} rows={4} value={form.description} onChange={set("description")} required />
        <select value={form.category} onChange={set("category")}>
          <option value="">{t("autoDetect")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} - {c.department_name}</option>
          ))}
        </select>
        <input placeholder={t("addressPh")} value={form.address} onChange={set("address")} />
        <div className="row">
          <input placeholder={t("latPh")} value={form.latitude} onChange={set("latitude")} />
          <input placeholder={t("lngPh")} value={form.longitude} onChange={set("longitude")} />
          <button type="button" onClick={getLocation}>{t("useLocation")}</button>
        </div>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />

        {dup && (
          <div className="notice">
            <p><b>{t("dupDetail")}</b></p>
            <small>
              {t("existingComplaint")} #{dup.existing.id} | {dup.existing.category_name} | {dup.existing.department_name} |{" "}
              {t("status")}: {t("st_" + dup.existing.status)}
            </small>
            <div className="row wrap">
              <button type="button" className="primary" onClick={() => send("link")}>{t("dupSame")}</button>
              <button type="button" onClick={() => send("separate")}>{t("dupDiff")}</button>
              <button type="button" onClick={() => setDup(null)}>{t("cancel")}</button>
            </div>
          </div>
        )}

        {msg && <p className="notice">{msg}</p>}
        <button type="submit" className="primary">{t("submitComplaint")}</button>
      </form>

      <section>
        <h2>{t("myComplaints")}</h2>
        {complaints.length === 0 && <p>{t("noComplaints")}</p>}
        {complaints.map((c) => (
          <div className="card" key={c.id}>
            <div className="row between">
              <strong>#{c.id} {c.title}</strong>
              <span className={`badge ${c.status}`}>{t("st_" + c.status)}</span>
            </div>
            <p>{c.description}</p>
            <small>
              {c.department_name} | {c.category_name} | {t("priority")}: {t("pr_" + c.priority)}
              <br />
              {t("filed")}: {fmt(c.created_at)} | {t("expected")}: {fmt(c.expected_resolution)}
              {c.assigned_officer_name ? ` | ${t("officer")}: ${c.assigned_officer_name}` : ""}
              {c.duplicate_of ? ` | ${t("linked", { id: c.duplicate_of })}` : ""}
              {c.rating ? ` | ${t("yourRating")}: ${c.rating}/5` : ""}
            </small>
            {c.image && <img className="thumb" src={c.image} alt="complaint" />}
            <ul className="timeline">
              <li>{t("st_submitted")} - {fmt(c.created_at)}</li>
              {c.updates.map((u) => (
                <li key={u.id}>
                  {t("st_" + u.new_status)} - {fmt(u.created_at)}
                  {u.comment ? `: ${u.comment}` : ""}
                </li>
              ))}
            </ul>
            {c.status === "resolved" && <Feedback c={c} onDone={load} />}
          </div>
        ))}
      </section>
    </div>
  );
}