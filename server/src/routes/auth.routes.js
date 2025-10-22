import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ✅ lee el secreto/expiración SOLO cuando se usan (evita timing issues con dotenv)
const getSecret = () => (process.env.JWT_SECRET ?? "").trim();
const getExpires = () => process.env.JWT_EXPIRES || "7d";

// ==========================
// POST /api/auth/register
// ==========================
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, role = "student" } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Faltan email, password o name" });
    }

    const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)",
      [email, password_hash, name, role]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Error en el registro" });
  }
});

// ==========================
// POST /api/auth/login
// ==========================
router.post("/auth/login", async (req, res) => {
  try {
    const SECRET = getSecret();
    if (!SECRET) return res.status(500).json({ error: "JWT_SECRET no configurado" });

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan email o password" });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ?",
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      SECRET,
      { expiresIn: getExpires() }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("login error:", err?.message, err?.stack);
    return res.status(500).json({ error: "Error en el login" });
  }
});

// ==========================
// GET /api/auth/me
// ==========================
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const [rows] = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = ?",
      [userId]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("auth/me error:", err);
    return res.status(500).json({ error: "Error al obtener datos del usuario" });
  }
});

// ==========================
// GET /api/auth/header (DEBUG)
// ==========================
router.get("/auth/header", (req, res) => {
  const auth = req.headers.authorization || null;
  return res.json({ ok: true, authorization: auth });
});

// ==========================
// GET /api/auth/renew (PROTEGIDO)
// ==========================
router.get("/auth/renew", requireAuth, (req, res) => {
  try {
    const SECRET = getSecret();
    if (!SECRET) return res.status(500).json({ error: "JWT_SECRET no configurado" });

    const payload = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
    const token = jwt.sign(payload, SECRET, { expiresIn: getExpires() });
    return res.json({ ok: true, token, user: payload });
  } catch (err) {
    console.error("auth/renew error:", err);
    return res.status(500).json({ error: "No se pudo renovar el token" });
  }
});

export default router;
