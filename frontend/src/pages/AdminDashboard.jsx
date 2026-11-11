import { useEffect, useState } from "react";
import api from "../api";

const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

function ComplaintTable({ title, rows }) {
  return (
    <div className="card">
      <h3>{title} ({rows.length})</h3>
      {rows.length === 0 ? (
        <p>None. All good.</p>
      ) : (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Complaint</th><th>Department</th><th>Priority</th><th>Status</th><th>Filed</th><th>Due</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.title}</td>
                  <td>{c.department_name}</td>
                  <td>{c.priority}</td>
                  <td>{c.status.replace("_", " ")}</td>
                  <td>{fmt(c.created_at)}</td>
                  <td>{fmt(c.due_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/overview/")
      .then((r) => setData(r.data))
      .catch((e) => setError(JSON.stringify(e.response?.data || "Failed to load")));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;
  const t = data.totals;

  return (
    <div>
      <h2>Monitoring dashboard</h2>
      <div className="stats5">
        <div className="card">Total<b>{t.total}</b></div>
        <div className="card">Open<b>{t.open}</b></div>
        <div className="card">Overdue<b>{t.overdue}</b></div>
        <div className="card">Not acknowledged (4h+)<b>{t.unacknowledged}</b></div>
        <div className="card">Resolved<b>{t.resolved}</b></div>
      </div>

      <div className="card">
        <h3>Department performance</h3>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr><th>Department</th><th>Total</th><th>Open</th><th>Overdue</th><th>Resolved</th><th>Avg. resolution (hrs)</th></tr>
            </thead>
            <tbody>
              {data.departments.map((d) => (
                <tr key={d.department}>
                  <td>{d.department}</td>
                  <td>{d.total}</td>
                  <td>{d.open}</td>
                  <td>{d.overdue}</td>
                  <td>{d.resolved}</td>
                  <td>{d.avg_resolution_hours ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ComplaintTable title="Overdue complaints" rows={data.overdue} />
      <ComplaintTable title="Not acknowledged for 4+ hours" rows={data.unacknowledged} />
    </div>
  );
}