import { useEffect, useState } from "react";
import api from "../api";

const fmt = (d) => new Date(d).toLocaleString();
const mapsLink = (o) =>
  o.latitude && o.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.name} ${o.address}`)}`;

export default function Dashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [saved, setSaved] = useState([]);
  const [offices, setOffices] = useState([]);
  const [q, setQ] = useState("");

  const loadNotifications = () => api.get("/notifications/").then((r) => setNotifications(r.data));

  useEffect(() => {
    api.get("/announcements/").then((r) => setAnnouncements(r.data));
    api.get("/schemes/bookmarks/").then((r) => setSaved(r.data));
    loadNotifications();
  }, []);

  useEffect(() => {
    api.get("/offices/", { params: { q } }).then((r) => setOffices(r.data));
  }, [q]);

  const markRead = async () => {
    await api.post("/notifications/read/");
    loadNotifications();
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="grid">
      <section>
        <div className="card">
          <div className="row between">
            <h2>Notifications {unread > 0 && <span className="badge overdue">{unread} new</span>}</h2>
            {unread > 0 && <button onClick={markRead}>Mark all read</button>}
          </div>
          {notifications.length === 0 && <p>No notifications yet.</p>}
          {notifications.map((n) => (
            <div key={n.id}>
              <b>{n.is_read ? "" : "* "}</b>{n.message}
              <br /><small>{fmt(n.created_at)}</small>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Announcements</h2>
          {announcements.length === 0 && <p>No announcements.</p>}
          {announcements.map((a) => (
            <div key={a.id}>
              <b>{a.title}</b>
              <p>{a.message}</p>
              <small>{fmt(a.created_at)}</small>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="card">
          <h2>My saved schemes</h2>
          {saved.length === 0 && <p>No saved schemes. Save from the Schemes page.</p>}
          {saved.map((s) => (
            <div key={s.id}>
              <b>{s.name}</b> ({s.level}){" "}
              <a href={s.official_link} target="_blank" rel="noreferrer">Official website</a>
              {s.last_date && <small> | Last date: {s.last_date}</small>}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Nearby government offices</h2>
          <input placeholder="Search by name, area or department" value={q} onChange={(e) => setQ(e.target.value)} />
          {offices.length === 0 && <p>No offices found.</p>}
          {offices.map((o) => (
            <div key={o.id}>
              <b>{o.name}</b> {o.department && `(${o.department})`}
              <br />{o.address}{o.phone && ` | ${o.phone}`}
              <br /><a href={mapsLink(o)} target="_blank" rel="noreferrer">Open in Maps</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}