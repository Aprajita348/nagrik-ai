import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";

const PAGE_SIZE = 5;
const STATUSES = ["submitted", "acknowledged", "in_progress", "resolved", "closed", "rejected", "reopened"];
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");
const isOverdue = (c) =>
  c.due_at && new Date(c.due_at) < new Date() && !["resolved", "closed", "rejected"].includes(c.status);

function Row({ c, onDone, categories, officers, isAdmin }) {
  const [status, setStatus] = useState(c.status);
  const [comment, setComment] = useState("");
  const [eta, setEta] = useState("");
  const [tCat, setTCat] = useState("");
  const [tReason, setTReason] = useState("");
  const [officer, setOfficer] = useState("");
  const [err, setErr] = useState("");

  const run = async (fn) => {
    setErr("");
    try {
      await fn();
      onDone();
    } catch (e) {
      setErr(JSON.stringify(e.response?.data || "Failed"));
    }
  };

  const update = () =>
    run(async () => {
      const body = { status, comment };
      if (eta) body.expected_resolution = new Date(eta).toISOString();
      await api.post(`/complaints/${c.id}/status/`, body);
      setComment("");
    });

  const transfer = () => {
    if (!tCat) return setErr("Choose the correct category / department first.");
    run(() => api.post(`/complaints/${c.id}/transfer/`, { category: Number(tCat), comment: tReason }));
  };

  const assign = () => {
    if (!officer) return setErr("Choose an officer first.");
    run(() => api.post(`/complaints/${c.id}/assign/`, { officer: Number(officer) }));
  };

  const otherCategories = categories.filter((k) => k.department !== c.department);
  const deptOfficers = officers.filter((o) => o.department === c.department);

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
        <br />
        Assigned to: {c.assigned_officer_name || "nobody yet"}
        {c.duplicate_of ? ` | Duplicate report of #${c.duplicate_of}` : ""}
        {c.duplicate_count ? ` | ${c.duplicate_count} more citizens reported this` : ""}
        {c.rating ? ` | Citizen rating: ${c.rating}/5` : ""}
        {c.feedback ? ` | Feedback: ${c.feedback}` : ""}
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

      <div className="row wrap">
        <select value={tCat} onChange={(e) => setTCat(e.target.value)}>
          <option value="">Wrong department? Transfer to...</option>
          {otherCategories.map((k) => (
            <option key={k.id} value={k.id}>{k.department_name} - {k.name}</option>
          ))}
        </select>
        <input placeholder="Reason (optional)" value={tReason} onChange={(e) => setTReason(e.target.value)} />
        <button onClick={transfer}>Transfer</button>
      </div>

      {isAdmin && (
        <div className="row wrap">
          <select value={officer} onChange={(e) => setOfficer(e.target.value)}>
            <option value="">Assign to officer...</option>
            {deptOfficers.map((o) => <option key={o.id} value={o.id}>{o.username}</option>)}
          </select>
          <button onClick={assign}>Assign</button>
        </div>
      )}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default function Officer() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, not_acknowledged: 0, overdue: 0 });

  const load = async (p, f) => {
    const { data } = await api.get("/complaints/", {
      params: { page: p, page_size: PAGE_SIZE, status: f },
    });
    setComplaints(data.results);
    setPage(data.page);
    setPages(data.pages);
    setStats(data.stats);
  };

  useEffect(() => {
    load(1, filter);
  }, [filter]);

  useEffect(() => {
    api.get("/categories/").then((r) => setCategories(r.data));
    if (isAdmin) api.get("/officers/").then((r) => setOfficers(r.data));
  }, [isAdmin]);

  return (
    <div>
      <h2>Complaint queue</h2>
      <div className="stats">
        <div className="card">Total<b>{stats.total}</b></div>
        <div className="card">Not acknowledged<b>{stats.not_acknowledged}</b></div>
        <div className="card">Overdue<b>{stats.overdue}</b></div>
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
      {complaints.length === 0 && <p>No complaints.</p>}
      {complaints.map((c) => (
        <Row
          key={c.id}
          c={c}
          onDone={() => load(page, filter)}
          categories={categories}
          officers={officers}
          isAdmin={isAdmin}
        />
      ))}
      <div className="row between">
        <button disabled={page <= 1} onClick={() => load(page - 1, filter)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => load(page + 1, filter)}>Next</button>
      </div>
    </div>
  );
}