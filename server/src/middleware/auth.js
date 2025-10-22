import jwt from "jsonwebtoken";

// ✅ lee el secreto en runtime y recórtalo
const getSecret = () => (process.env.JWT_SECRET ?? "").trim();

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  console.log("🔎 requireAuth header:", auth);

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    console.log("🔒 requireAuth: sin token");
    return res.status(401).json({
      error: "No se encontró token de autenticación.",
      code: "NO_TOKEN",
    });
  }

  const SECRET = getSecret();
  if (!SECRET) {
    console.log("🔒 requireAuth: JWT_SECRET vacío");
    return res.status(500).json({ error: "JWT_SECRET no configurado" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // { id, email, name, role, iat, exp }
    console.log("✅ requireAuth OK → user:", req.user?.id);
    next();
  } catch (err) {
    console.log("🔒 requireAuth error:", err.name);

    // 🔥 Manejo específico de errores JWT
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Tu sesión ha expirado. Inicia sesión nuevamente.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido o manipulado.",
        code: "TOKEN_INVALID",
      });
    }

    return res.status(401).json({
      error: "Error de autenticación.",
      code: "AUTH_ERROR",
    });
  }
}

