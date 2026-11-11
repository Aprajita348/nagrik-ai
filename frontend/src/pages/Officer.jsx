import { useEffect, useState } from "react";
import api from "../api";

const STATUSES = ["submitted", "acknowledged", "in_progress", "resolved", "closed", "rejected"];
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");
const isOverdue = (c) =>
  c.due_at && new Date(c.due_at) < new Date() && !["resolved", "closed", "rejected"].includes(c.status);

function Row({ c, onDone }) {
  const [status, setStatus] = useState(c.status);
  const [comment, setComment] = useState("");
  const [eta, setEta] = useState("");
  const [err, setErr] = useState("");

  const update = async () => {
    setErr("");
    const body = { status, comment };
    if (eta) body.expected_resolution = new Date(eta).toISOString();
    try {
      await api.post(`/complaints/${c.id}/status/`, body);
      setComment("");
      onDone();
    } catch (e) {
      setErr(JSON.stringify(e.response?.data || "Failed"));
    }
  };

  return (
    <div className="card">
      <div className="row between">
        <strong>#{c.id} {c.title}</strong>
        <span>
          {isOverdue(c) && <span className="badge overdue">OVERDUE</span>}{" "}
          <span className={`badge ${c.status}`}>{c.status.replace("_", " ")}</span>
        </span>
      </div>
      <p>{c.description}</p>
      <small>
        {c.department_name} | {c.category_name} | Priority: {c.priority}
        {c.address ? ` | ${c.address}` : ""}
        <br />
        Filed: {fmt(c.created_at)} | Due: {fmt(c.due_at)} | Expected: {fmt(c.expected_resolution)}
      </small>
      {c.image && <img className="thumb" src={c.image} alt="complaint" />}
      <div className="row wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
        <input placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="primary" onClick={update}>Update</button>
      </div>
      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default function Officer() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const { data } = await api.get("/complaints/");
    setComplaints(data);
  };
  useEffect(() => { load(); }, []);

  const shown = complaints.filter((c) => filter === "all" || c.status === filter);
  const overdue = complaints.filter(isOverdue).length;
  const pending = complaints.filter((c) => c.status === "submitted").length;

  return (
    <div>
      <h2>Complaint queue</h2>
      <div className="stats">
        <div className="card">Total<b>{complaints.length}</b></div>
        <div className="card">Not acknowledged<b>{pending}</b></div>
        <div className="card">Overdue<b>{overdue}</b></div>
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
      {shown.length === 0 && <p>No complaints.</p>}
      {shown.map((c) => <Row key={c.id} c={c} onDone={load} />)}
    </div>
  );
}