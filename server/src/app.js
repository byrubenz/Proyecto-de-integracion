import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";

import unitsRoutes from "./routes/units.routes.js";       // Ruta de las unidades
import questionsRoutes from "./routes/questions.routes.js"; // Ruta de las preguntas
import answersRoutes from "./routes/answers.routes.js";     // Ruta de las respuestas (protegida)
import authRoutes from "./routes/auth.routes.js";           // Ruta de la autenticación
import examsRoutes from "./routes/exams.routes.js";         // Ruta de los exámenes
import topicsRoutes from "./routes/topics.routes.js";       // Ruta de los topics
import profileRoutes from "./routes/profile.routes.js";     // Ruta del ajuste de perfil
import adminRoutes from "./routes/admin.routes.js";         // Rutas de admin
import nemRankingRoutes from "./routes/nemRanking.routes.js"; // Rutas de NEM/Ranking (protegida)
import friendsRouter from "./routes/friends.routes.js";     // Rutas de amigos
import { requireAuth as authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: (origin, cb) => cb(null, true),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Ruta para probar si Express funciona
app.get("/api/ping", (req, res) => {
  res.json({ ok: true });
});

// Montaje de rutas
app.use("/api", unitsRoutes);       // /api/units...
app.use("/api", questionsRoutes);   // /api/questions...
app.use("/api", answersRoutes);     // /api/answers (va con requireAuth dentro del router)
app.use("/api", authRoutes);        // /api/auth/*
app.use("/api", examsRoutes);       // /api/exams...
app.use("/api", topicsRoutes);      // /api/topics...
app.use("/api", profileRoutes);     // /api/profile...
app.use("/api", adminRoutes);       // /api/admin...
app.use("/api", authMiddleware, nemRankingRoutes); // /api/nem-ranking/preview

// API de amigos (protegida)
app.use("/api/friends", authMiddleware, friendsRouter);

// Ruta de test conexión DB
app.get("/test", async (req, res) => {
  const [rows] = await pool.query("SELECT 'Conexión exitosa a MySQL' AS message");
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
