import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  acceptFriendRequest,
  getFriends,
  getReceivedRequests,
  getSentRequests,
  rejectFriendRequest,
  sendFriendRequest,
  type Friend,
  type FriendRequest,
} from "../api/friends";
import toast from "react-hot-toast";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState("");
  const [sending, setSending] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [f, r, s] = await Promise.all([getFriends(), getReceivedRequests(), getSentRequests()]);
      setFriends(f);
      setReceived(r);
      setSent(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar amigos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await acceptFriendRequest(id);
      toast.success("Solicitud aceptada");
      loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo aceptar";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectFriendRequest(id);
      toast.success("Solicitud actualizada");
      loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo actualizar";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number(sendingId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      toast.error("Ingresa un ID válido");
      return;
    }
    try {
      setSending(true);
      await sendFriendRequest(idNum);
      toast.success("Solicitud enviada");
      setSendingId("");
      loadAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar";
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Amigos</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Gestiona tus solicitudes y contactos.
            </p>
          </div>
          <form onSubmit={handleSend} className="row" style={{ gap: 8, alignItems: "center" }}>
            <input
              type="number"
              min={1}
              value={sendingId}
              onChange={(e) => setSendingId(e.target.value)}
              placeholder="ID de usuario"
              className="input"
              style={{ width: 180 }}
            />
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        </div>

        {error && (
          <div className="card" style={{ marginTop: 12 }}>
            <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p className="muted" style={{ margin: 0 }}>Cargando...</p>
          </div>
        ) : (
          <>
            <section className="card" style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>Mis amigos</h3>
              {friends.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>Aún no tienes amigos.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {friends.map((f) => (
                    <li
                      key={f.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <strong>{f.name || "Sin nombre"}</strong>
                        <div className="muted">{f.email}</div>
                      </div>
                      <span className="muted">#{f.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card" style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>Solicitudes recibidas</h3>
              {received.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No tienes solicitudes pendientes.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {received.map((r) => (
                    <li
                      key={r.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                    >
                      <div>
                        <strong>{r.user.name || "Sin nombre"}</strong>
                        <div className="muted">{r.user.email}</div>
                        <div className="muted" style={{ fontSize: 12 }}>#{r.user.id}</div>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn btn-primary" onClick={() => handleAccept(r.id)}>Aceptar</button>
                        <button className="btn btn-ghost" onClick={() => handleReject(r.id)}>Rechazar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card" style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>Solicitudes enviadas</h3>
              {sent.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>No has enviado solicitudes pendientes.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                  {sent.map((r) => (
                    <li
                      key={r.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <strong>{r.user.name || "Sin nombre"}</strong>
                        <div className="muted">{r.user.email}</div>
                        <div className="muted" style={{ fontSize: 12 }}>#{r.user.id}</div>
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>Enviada</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
