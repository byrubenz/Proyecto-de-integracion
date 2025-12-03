// server/src/controllers/profile.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const [rows] = await pool.query(
      `SELECT id, name, email, is_paid, created_at, updated_at
         FROM users
        WHERE id = ?`,
      [userId]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json({ ok: true, profile: u });
  } catch (err) {
    console.error("❌ getProfile error:", err);
    return res.status(500).json({ error: "No se pudo obtener el perfil" });
  }
};

// PUT /api/profile  (actualiza nombre y/o email)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    let { name, email } = req.body || {};
    name = typeof name === "string" ? name.trim() : undefined;
    email = typeof email === "string" ? email.trim().toLowerCase() : undefined;

    if (!name && !email) {
      return res.status(400).json({ error: "No se enviaron campos a actualizar" });
    }

    if (name && name.length < 2) {
      return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
    }

    if (email) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }
      // asegurar unicidad
      const [dupes] = await pool.query(
        `SELECT id FROM users WHERE email = ? AND id <> ?`,
        [email, userId]
      );
      if (dupes.length > 0) {
        return res.status(400).json({ error: "Ese email ya está en uso" });
      }
    }

    const fields = [];
    const params = [];
    if (name) { fields.push("name = ?"); params.push(name); }
    if (email) { fields.push("email = ?"); params.push(email); }
    params.push(userId);

    await pool.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );

    // devolver perfil actualizado
    const [rows] = await pool.query(
      `SELECT id, name, email, is_paid, created_at, updated_at FROM users WHERE id = ?`,
      [userId]
    );
    return res.json({ ok: true, profile: rows[0] });
  } catch (err) {
    console.error("❌ updateProfile error:", err);
    return res.status(500).json({ error: "No se pudo actualizar el perfil" });
  }
};

// PUT /api/profile/password  (cambia contraseña)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Debes enviar contraseña actual y nueva" });
    }
    if (String(new_password).length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const [rows] = await pool.query(
      `SELECT password_hash FROM users WHERE id = ?`,
      [userId]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

    const ok = await bcrypt.compare(String(current_password), String(u.password_hash));
    if (!ok) return res.status(400).json({ error: "La contraseña actual no es correcta" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(String(new_password), salt);

    await pool.query(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [hash, userId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ changePassword error:", err);
    return res.status(500).json({ error: "No se pudo cambiar la contraseña" });
  }
};
