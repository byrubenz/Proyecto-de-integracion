import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";

import unitsRoutes from "./routes/units.routes.js";       // Ruta de las unidades
import questionsRoutes from "./routes/questions.routes.js"; // Ruta de las preguntas
import answersRoutes from "./routes/answers.routes.js";     // Ruta de las respuestas (protegida)
import authRoutes from "./routes/auth.routes.js";           // Ruta de la autenticación

import examsRoutes from "./routes/exams.routes.js"; //Ruta de los examenes

import topicsRoutes from "./routes/topics.routes.js"; //Ruta de los topics
import profileRoutes from "./routes/profile.routes.js"; //Ruta del ajuste de perfil

dotenv.config();

const app = express();

/**
 * 🔐 CORS explícito:
 * - Habilita origen del cliente (Vite)
 * - Permite cabecera Authorization para enviar el JWT
 * - Responde correctamente OPTIONS (preflight)
 */
const corsOptions = {
  // 👇 en dev, acepta cualquier origen (localhost, 127.0.0.1, puertos distintos)
  origin: (origin, cb) => cb(null, true),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], // 👈 necesario para enviar Bearer
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Ruta para probar si Express funciona
app.get("/api/ping", (req, res) => {
  res.json({ ok: true });
});

// Montaje de rutas (⚠️ cada una una sola vez)
app.use("/api", unitsRoutes);       // /api/units...
app.use("/api", questionsRoutes);   // /api/questions...
app.use("/api", answersRoutes);     // /api/answers (va con requireAuth dentro del router)
app.use("/api", authRoutes);        // /api/auth/*
app.use("/api", examsRoutes); // /api de los examenes
app.use("/api", topicsRoutes); //API de las topics
app.use("/api", profileRoutes); //API de los perfiles

// Ruta de test conexión DB
app.get("/test", async (req, res) => {
  const [rows] = await pool.query("SELECT 'Conexión exitosa a MySQL' AS message");
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));

