import { useEffect, useRef, useState } from "react";
import api from "../api";

function SchemeChat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Namaste! Apni age, income, occupation bataiye, main schemes suggest karunga." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const { data } = await api.post("/chatbot/ask/", { message: text });
      setMessages((m) => [...m, { role: "bot", text: data.reply, schemes: data.schemes }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, something went wrong." }]);
    }
    setBusy(false);
  };

  return (
    <div className="card">
      <h2>Scheme Assistant</h2>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div>{m.text}</div>
            {m.schemes?.map((s) => (
              <div key={s.id}>
                - <a href={s.official_link} target="_blank" rel="noreferrer">{s.name}</a>
              </div>
            ))}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="row" onSubmit={send}>
        <input
          style={{ flex: 1 }}
          placeholder="Meri age 42 hai, income 3 lakh, main farmer hoon..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="primary" disabled={busy}>Send</button>
      </form>
    </div>
  );
}

function LegalAI() {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("description", description);
    files.forEach((f) => fd.append("documents", f));
    try {
      const { data } = await api.post("/legal/analyze/", fd);
      setResult(data);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Failed"));
    }
  };

  return (
    <div>
      <form className="card" onSubmit={submit}>
        <h2>Legal AI</h2>
        <textarea
          rows={5}
          placeholder="Apni situation explain karein (jaise: mera property dispute 6 saal se chal raha hai)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input type="file" accept=".pdf" multiple onChange={(e) => setFiles([...e.target.files])} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary">Analyze my case</button>
      </form>

      {result && (
        <div className="card">
          <p className="notice">{result.message}</p>
          <p><b>Possible case type:</b> {result.possible_case_type}</p>
          {result.documents_received.length > 0 && (
            <p><b>Documents received:</b> {result.documents_received.map((d) => d.name).join(", ")}</p>
          )}
          <small>{result.disclaimer}</small>
        </div>
      )}
    </div>
  );
}

export default function Assistant() {
  return (
    <div className="grid">
      <SchemeChat />
      <LegalAI />
    </div>
  );
}