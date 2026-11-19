import { useEffect, useState } from "react";
import api from "../api";
import { useLang } from "../i18n";

const fmt = (d) => new Date(d).toLocaleString();
const mapsLink = (o) =>
  o.latitude && o.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.name} ${o.address}`)}`;

export default function Dashboard() {
  const { t } = useLang();
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
            <h2>{t("notifications")} {unread > 0 && <span className="badge overdue">{t("newCount", { n: unread })}</span>}</h2>
            {unread > 0 && <button onClick={markRead}>{t("markRead")}</button>}
          </div>
          {notifications.length === 0 && <p>{t("noNotif")}</p>}
          {notifications.map((n) => (
            <div key={n.id}>
              <b>{n.is_read ? "" : "* "}</b>{n.message}
              <br /><small>{fmt(n.created_at)}</small>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>{t("announcements")}</h2>
          {announcements.length === 0 && <p>{t("noAnn")}</p>}
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
          <h2>{t("savedSchemes")}</h2>
          {saved.length === 0 && <p>{t("noSaved")}</p>}
          {saved.map((s) => (
            <div key={s.id}>
              <b>{s.name}</b> ({t("level_" + s.level)}){" "}
              <a href={s.official_link} target="_blank" rel="noreferrer">{t("official")}</a>
              {s.last_date && <small> | {t("lastDate")}: {s.last_date}</small>}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>{t("nearby")}</h2>
          <input placeholder={t("searchOffices")} value={q} onChange={(e) => setQ(e.target.value)} />
          {offices.length === 0 && <p>{t("noOffices")}</p>}
          {offices.map((o) => (
            <div key={o.id}>
              <b>{o.name}</b> {o.department && `(${o.department})`}
              <br />{o.address}{o.phone && ` | ${o.phone}`}
              <br /><a href={mapsLink(o)} target="_blank" rel="noreferrer">{t("openMaps")}</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}