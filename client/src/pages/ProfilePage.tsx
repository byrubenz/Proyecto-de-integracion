// client/src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchProfile, updateProfile, changePassword, type UserProfile } from "../api/profile";
import AppLayout from "../components/AppLayout";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // form perfil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // form password
  const [current, setCurrent] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfile();
        setProfile(data.profile);
        setName(data.profile.name || "");
        setEmail(data.profile.email || "");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const payload: { name?: string; email?: string } = {};
      if (name !== profile?.name) payload.name = name.trim();
      if (email !== profile?.email) payload.email = email.trim().toLowerCase();

      if (!payload.name && !payload.email) {
        toast("No hay cambios");
        return;
      }

      const res = await updateProfile(payload);
      setProfile(res.profile);
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !nextPass) {
      toast.error("Completa los campos de contraseña");
      return;
    }
    if (nextPass.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (nextPass !== confirm) {
      toast.error("La confirmación no coincide");
      return;
    }
    try {
      setSavingPwd(true);
      await changePassword({ current_password: current, new_password: nextPass });
      setCurrent(""); setNextPass(""); setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cambiar la contraseña");
    } finally {
      setSavingPwd(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
          <p className="muted">Cargando perfil…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container" style={{ padding: "32px 0" }}>
        <h2 style={{ margin: 0 }}>👤 Mi perfil</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Administra tus datos de cuenta y tu contraseña.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          {/* Datos de cuenta */}
          <form onSubmit={onSaveProfile} className="card">
            <h3 style={{ marginTop: 0 }}>Datos de cuenta</h3>

            <label>Nombre</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="Tu nombre"
            />

            <label style={{ marginTop: 10 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="tu@email.com"
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              disabled={savingProfile}
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          {/* Cambiar contraseña */}
          <form onSubmit={onChangePassword} className="card">
            <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>

            <label>Contraseña actual</label>
            <input
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="input"
            />

            <label style={{ marginTop: 10 }}>Nueva contraseña</label>
            <input
              type="password"
              value={nextPass}
              onChange={e => setNextPass(e.target.value)}
              className="input"
              placeholder="Mínimo 8 caracteres"
            />

            <label style={{ marginTop: 10 }}>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input"
            />

            <button
              type="submit"
              className="btn btn-ghost"
              style={{ marginTop: 12 }}
              disabled={savingPwd}
            >
              {savingPwd ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>

        {/* Si quieres un bloquecito con info del usuario actual */}
        {profile && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg,#7C3AED,#6B2EDB)",
                  display: "grid", placeItems: "center", fontWeight: 900
                }}
                aria-hidden
              >
                {profile.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{profile.name}</div>
                <div className="muted" style={{ fontSize: 14 }}>{profile.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
