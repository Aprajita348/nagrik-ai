import { useEffect, useState } from "react";
import api from "../api";

const empty = { title: "", description: "", address: "", category: "", latitude: "", longitude: "" };
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

export default function Citizen() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState("");
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
      () => setMsg("Could not get your location")
    );

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "") fd.append(k, v);
    });
    if (image) fd.append("image", image);
    try {
      const { data } = await api.post("/complaints/", fd);
      setMsg(`Complaint #${data.id} sent to ${data.department_name} (priority: ${data.priority})`);
      setForm(empty);
      setImage(null);
      load();
    } catch (err) {
      setMsg(JSON.stringify(err.response?.data || "Failed"));
    }
  };

  return (
    <div className="grid">
      <form className="card" onSubmit={submit}>
        <h2>File a complaint</h2>
        <input placeholder="Title" value={form.title} onChange={set("title")} required />
        <textarea placeholder="Describe the problem" rows={4} value={form.description} onChange={set("description")} required />
        <select value={form.category} onChange={set("category")}>
          <option value="">Auto-detect department (AI)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} - {c.department_name}</option>
          ))}
        </select>
        <input placeholder="Address / landmark" value={form.address} onChange={set("address")} />
        <div className="row">
          <input placeholder="Latitude" value={form.latitude} onChange={set("latitude")} />
          <input placeholder="Longitude" value={form.longitude} onChange={set("longitude")} />
          <button type="button" onClick={getLocation}>Use my location</button>
        </div>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        {msg && <p className="notice">{msg}</p>}
        <button type="submit" className="primary">Submit complaint</button>
      </form>

      <section>
        <h2>My complaints</h2>
        {complaints.length === 0 && <p>No complaints yet.</p>}
        {complaints.map((c) => (
          <div className="card" key={c.id}>
            <div className="row between">
              <strong>#{c.id} {c.title}</strong>
              <span className={`badge ${c.status}`}>{c.status.replace("_", " ")}</span>
            </div>
            <p>{c.description}</p>
            <small>
              {c.department_name} | {c.category_name} | Priority: {c.priority}
              <br />
              Filed: {fmt(c.created_at)} | Expected resolution: {fmt(c.expected_resolution)}
            </small>
            {c.image && <img className="thumb" src={c.image} alt="complaint" />}
            <ul className="timeline">
              <li>Submitted - {fmt(c.created_at)}</li>
              {c.updates.map((u) => (
                <li key={u.id}>
                  {u.new_status.replace("_", " ")} - {fmt(u.created_at)}
                  {u.comment ? `: ${u.comment}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}