// server/src/config/db.js (ESM)
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Leica666",
  database: process.env.DB_NAME || "paes_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// (Opcional) prueba rápida de conexión al iniciar
export async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    console.log("✅ MySQL OK:", rows[0]);
  } catch (err) {
    console.error("❌ Error conectando a MySQL:", err.message);
  }
}
